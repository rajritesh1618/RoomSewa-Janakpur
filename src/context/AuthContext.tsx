import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile as fbUpdateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot
} from 'firebase/firestore';
import { auth, googleProvider, db, isSuperAdminEmail } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { sendWelcomeMessageOnce } from '../services/welcomeMessageService';
import { isValidNepalMobile } from '../utils/nepalPhone';
import { isValidGmail, GMAIL_ERROR_MESSAGE } from '../utils/emailValidator';
import { signupRoomSewa, loginRoomSewa, SignupResult } from '../services/authService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, role: UserRole, phone?: string) => Promise<SignupResult>;
  logout: () => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  setUserRole: (role: UserRole) => Promise<void>;
  refreshUserProfile: () => Promise<UserProfile | null>;
  isAdmin: boolean;
  isPremium: boolean;
  isOwner: boolean;
  role: UserRole;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync user profile when currentUser or auth changes
  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // User logged in via Firebase (e.g. Google Sign-In)
        setCurrentUser(firebaseUser);
        localStorage.removeItem('roomsewa_auth_user');

        const userRef = doc(db, 'users', firebaseUser.uid);

        unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const effectiveRole: UserRole = isSuperAdminEmail(firebaseUser.email) ? 'admin' : data.role || 'seeker';
            setUserProfile({
              ...data,
              role: effectiveRole,
              isPremium: Boolean(data.isPremium || effectiveRole === 'admin'),
            });

            if (isSuperAdminEmail(firebaseUser.email) && (data.role !== 'admin' || !data.isPremium)) {
              updateDoc(userRef, {
                role: 'admin',
                isPremium: true,
                updatedAt: new Date().toISOString()
              }).catch(() => {});
            }
          } else {
            const isSuper = isSuperAdminEmail(firebaseUser.email);
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              photoURL: firebaseUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${firebaseUser.uid}`,
              phoneNumber: firebaseUser.phoneNumber || '',
              role: isSuper ? 'admin' : 'seeker',
              isPremium: isSuper,
              createdAt: new Date().toISOString(),
              welcomeMessageSent: false,
              isNewSignup: true
            };
            try {
              await setDoc(userRef, newProfile);
              setUserProfile(newProfile);
            } catch {
              setUserProfile(newProfile);
            }
          }
          setLoading(false);
        }, () => {
          const isSuper = isSuperAdminEmail(firebaseUser.email);
          setUserProfile({
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'User',
            photoURL: firebaseUser.photoURL || undefined,
            phoneNumber: firebaseUser.phoneNumber || '',
            role: isSuper ? 'admin' : 'seeker',
            isPremium: isSuper,
            createdAt: new Date().toISOString()
          });
          setLoading(false);
        });
      } else {
        // Check for stored RoomSewa session user
        const storedAuthUser = localStorage.getItem('roomsewa_auth_user');
        if (storedAuthUser) {
          try {
            const parsed = JSON.parse(storedAuthUser);
            if (parsed && parsed.uid && parsed.email) {
              setCurrentUser(parsed);
              const userRef = doc(db, 'users', parsed.uid);
              unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
                if (docSnap.exists()) {
                  const data = docSnap.data() as UserProfile;
                  const effectiveRole: UserRole = isSuperAdminEmail(parsed.email) ? 'admin' : data.role || 'seeker';
                  setUserProfile({
                    ...data,
                    role: effectiveRole,
                    isPremium: Boolean(data.isPremium || effectiveRole === 'admin')
                  });
                } else {
                  const isSuper = isSuperAdminEmail(parsed.email);
                  const newProfile: UserProfile = {
                    uid: parsed.uid,
                    email: parsed.email,
                    displayName: parsed.displayName || 'User',
                    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsed.uid}`,
                    phoneNumber: parsed.phoneNumber || '',
                    role: isSuper ? 'admin' : (parsed.role || 'seeker'),
                    isPremium: isSuper || Boolean(parsed.isPremium),
                    createdAt: new Date().toISOString()
                  };
                  setUserProfile(newProfile);
                }
                setLoading(false);
              }, () => {
                const isSuper = isSuperAdminEmail(parsed.email);
                setUserProfile({
                  uid: parsed.uid,
                  email: parsed.email,
                  displayName: parsed.displayName || 'User',
                  photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${parsed.uid}`,
                  phoneNumber: parsed.phoneNumber || '',
                  role: isSuper ? 'admin' : (parsed.role || 'seeker'),
                  isPremium: isSuper || Boolean(parsed.isPremium),
                  createdAt: new Date().toISOString()
                });
                setLoading(false);
              });
              return;
            }
          } catch {
            localStorage.removeItem('roomsewa_auth_user');
          }
        }

        if (unsubscribeProfile) unsubscribeProfile();
        setCurrentUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const signInWithGoogle = async (preferredRole: UserRole = 'seeker') => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);

      const isSuper = isSuperAdminEmail(user.email);
      if (!docSnap.exists()) {
        const initialProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
          phoneNumber: user.phoneNumber || '',
          role: isSuper ? 'admin' : preferredRole,
          isPremium: isSuper,
          createdAt: new Date().toISOString(),
          welcomeMessageSent: false,
          isNewSignup: true
        };
        await setDoc(userRef, initialProfile);
        setUserProfile(initialProfile);
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      throw error;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidGmail(trimmedEmail)) {
      throw new Error(GMAIL_ERROR_MESSAGE);
    }

    const res = await loginRoomSewa(trimmedEmail, pass);
    const loggedInUser = res.user;

    const userObj = {
      uid: loggedInUser.uid,
      email: loggedInUser.email,
      displayName: loggedInUser.displayName,
      phoneNumber: loggedInUser.phoneNumber || '',
      emailVerified: true
    } as any;

    setCurrentUser(userObj);
    localStorage.setItem('roomsewa_auth_user', JSON.stringify({
      ...userObj,
      role: loggedInUser.role,
      isPremium: loggedInUser.isPremium
    }));

    const isSuper = isSuperAdminEmail(loggedInUser.email);
    const profile: UserProfile = {
      uid: loggedInUser.uid,
      email: loggedInUser.email,
      displayName: loggedInUser.displayName,
      phoneNumber: loggedInUser.phoneNumber || '',
      photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${loggedInUser.uid}`,
      role: isSuper ? 'admin' : loggedInUser.role,
      isPremium: isSuper || Boolean(loggedInUser.isPremium),
      createdAt: new Date().toISOString(),
      welcomeMessageSent: true,
      isNewSignup: false
    };

    const userRef = doc(db, 'users', loggedInUser.uid);
    try {
      await setDoc(userRef, profile, { merge: true });
    } catch {}
    setUserProfile(profile);
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string
  ): Promise<SignupResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidGmail(trimmedEmail)) {
      throw new Error(GMAIL_ERROR_MESSAGE);
    }

    // Call RoomSewa backend to create account and generate verification link
    // Account remains unverified and user is NOT logged in per requirements
    const result = await signupRoomSewa({
      email: trimmedEmail,
      password: pass,
      name: name.trim(),
      role,
      phone: phone?.trim()
    });

    return result;
  };

  const logout = async () => {
    localStorage.removeItem('roomsewa_auth_user');
    try {
      await fbSignOut(auth);
    } catch {}
    setCurrentUser(null);
    setUserProfile(null);
  };

  const refreshUserProfile = async (): Promise<UserProfile | null> => {
    const activeUid = auth.currentUser?.uid || currentUser?.uid;
    if (!activeUid) {
      setUserProfile(null);
      return null;
    }
    try {
      const userRef = doc(db, 'users', activeUid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        const isSuper = isSuperAdminEmail(data.email || currentUser?.email);
        const effectiveRole: UserRole = isSuper ? 'admin' : data.role || 'seeker';
        const refreshed: UserProfile = {
          ...data,
          role: effectiveRole,
          isPremium: Boolean(data.isPremium || effectiveRole === 'admin'),
        };
        setUserProfile(refreshed);
        return refreshed;
      }
    } catch (err) {
      console.warn('Could not refresh user profile from Firestore:', err);
    }
    return null;
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    const activeUid = auth.currentUser?.uid || currentUser?.uid;
    if (!activeUid) return;

    const userRef = doc(db, 'users', activeUid);
    await updateDoc(userRef, {
      ...data,
      updatedAt: new Date().toISOString()
    }).catch(() => {});

    if (data.displayName && auth.currentUser) {
      try {
        await fbUpdateProfile(auth.currentUser, { displayName: data.displayName });
      } catch {}
    }

    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));

    if (currentUser) {
      const updatedUser = { ...currentUser, ...data };
      setCurrentUser(updatedUser as any);
      if (localStorage.getItem('roomsewa_auth_user')) {
        localStorage.setItem('roomsewa_auth_user', JSON.stringify(updatedUser));
      }
    }

    await refreshUserProfile();
  };

  const setUserRole = async (newRole: UserRole) => {
    const activeUid = auth.currentUser?.uid || currentUser?.uid;
    if (!activeUid) return;

    const userRef = doc(db, 'users', activeUid);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString()
    }).catch(() => {});

    await refreshUserProfile();
  };

  const role: UserRole = userProfile?.role || (currentUser as any)?.role || 'seeker';
  const isAdmin = role === 'admin' || isSuperAdminEmail(currentUser?.email);
  const isPremium = Boolean(userProfile?.isPremium || (currentUser as any)?.isPremium || isAdmin);
  const isOwner = Boolean(currentUser && (role === 'owner' || isAdmin));

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
        updateUserProfile,
        setUserRole,
        refreshUserProfile,
        isAdmin,
        isPremium,
        isOwner,
        role
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
