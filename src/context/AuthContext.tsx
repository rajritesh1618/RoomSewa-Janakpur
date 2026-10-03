import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut as fbSignOut,
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
import { isValidGmail, GMAIL_ERROR_MESSAGE } from '../utils/emailValidator';
import {
  signupWithFirebaseAuth,
  loginWithFirebaseAuth,
  resendVerificationWithFirebaseAuth,
  forgotPasswordWithFirebaseAuth,
  resetPasswordWithFirebaseAuth,
  AuthSuccessResult
} from '../services/firebaseAuthService';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: (preferredRole?: UserRole) => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string, role: UserRole, phone?: string) => Promise<AuthSuccessResult>;
  resendVerificationEmail: (email: string, pass?: string) => Promise<AuthSuccessResult>;
  forgotPassword: (email: string) => Promise<AuthSuccessResult>;
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
        // Enforce verification gate: password users MUST have verified email before being logged in
        const isPasswordProvider = firebaseUser.providerData.some((p) => p.providerId === 'password');
        if (isPasswordProvider && !firebaseUser.emailVerified) {
          console.log('[Auth] User email not yet verified. Keeping unauthenticated state.');
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
          return;
        }

        setCurrentUser(firebaseUser);
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

    // Authenticate with Firebase Auth and enforce verified email gate
    const fbUser = await loginWithFirebaseAuth(trimmedEmail, pass);
    setCurrentUser(fbUser);

    // Fetch user profile from Firestore
    const userRef = doc(db, 'users', fbUser.uid);
    const docSnap = await getDoc(userRef);
    const isSuper = isSuperAdminEmail(trimmedEmail);

    if (docSnap.exists()) {
      const data = docSnap.data() as UserProfile;
      const effectiveRole: UserRole = isSuper ? 'admin' : data.role || 'seeker';
      setUserProfile({
        ...data,
        uid: fbUser.uid,
        email: fbUser.email || trimmedEmail,
        displayName: data.displayName || fbUser.displayName || 'User',
        role: effectiveRole,
        isPremium: isSuper || Boolean(data.isPremium)
      });
    }
  };

  const signupWithEmail = async (
    email: string,
    pass: string,
    name: string,
    role: UserRole,
    phone?: string
  ): Promise<AuthSuccessResult> => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!isValidGmail(trimmedEmail)) {
      throw new Error(GMAIL_ERROR_MESSAGE);
    }

    // Creates user via Firebase Auth, sends official Firebase verification email, and signs user out
    return await signupWithFirebaseAuth({
      email: trimmedEmail,
      password: pass,
      name: name.trim(),
      role,
      phone: phone?.trim()
    });
  };

  const resendVerificationEmail = async (email: string, pass?: string): Promise<AuthSuccessResult> => {
    return await resendVerificationWithFirebaseAuth(email, pass);
  };

  const forgotPassword = async (email: string): Promise<AuthSuccessResult> => {
    return await forgotPasswordWithFirebaseAuth(email);
  };

  const logout = async () => {
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
    });

    setUserProfile((prev) => (prev ? { ...prev, ...data } : null));
  };

  const setUserRole = async (newRole: UserRole) => {
    if (!currentUser) return;
    const isSuper = isSuperAdminEmail(currentUser.email);
    const targetRole: UserRole = isSuper ? 'admin' : newRole;

    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, {
      role: targetRole,
      updatedAt: new Date().toISOString()
    });

    setUserProfile((prev) => (prev ? { ...prev, role: targetRole } : null));
  };

  const isAdmin = isSuperAdminEmail(currentUser?.email) || userProfile?.role === 'admin';
  const isPremium = isAdmin || Boolean(userProfile?.isPremium);
  const isOwner = userProfile?.role === 'owner' || isAdmin;
  const role: UserRole = isAdmin ? 'admin' : (userProfile?.role || 'seeker');

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        signInWithGoogle,
        loginWithEmail,
        signupWithEmail,
        resendVerificationEmail,
        forgotPassword,
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
