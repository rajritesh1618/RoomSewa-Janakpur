import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string, name: string, role: 'seeker' | 'owner', phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeProfile: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        
        // Listen to real-time profile updates
        unsubscribeProfile = onSnapshot(userDocRef, (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data() as UserProfile);
          } else {
            // Default profile if not found
            const fallbackProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              name: user.displayName || 'User',
              role: user.email === 'admin@roomsewa.com' ? 'admin' : 'seeker',
              createdAt: new Date().toISOString()
            };
            setDoc(userDocRef, fallbackProfile).catch(console.error);
            setUserProfile(fallbackProfile);
          }
          setLoading(false);
        }, (err) => {
          console.error('Error fetching user profile:', err);
          setLoading(false);
        });
      } else {
        if (unsubscribeProfile) {
          unsubscribeProfile();
          unsubscribeProfile = null;
        }
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (
    email: string, 
    pass: string, 
    name: string, 
    role: 'seeker' | 'owner', 
    phone?: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    
    // Create UserProfile: phone is strictly OPTIONAL
    const newProfile: UserProfile = {
      uid: cred.user.uid,
      email: cred.user.email || email,
      name: name.trim(),
      role: email === 'admin@roomsewa.com' ? 'admin' : role,
      createdAt: new Date().toISOString()
    };

    // If user provided a phone number, save it; otherwise omit
    if (phone && phone.trim().length > 0) {
      newProfile.phone = phone.trim();
    }

    await setDoc(doc(db, 'users', cred.user.uid), newProfile);
    try {
      await sendEmailVerification(cred.user);
    } catch (e) {
      console.warn('Could not send email verification:', e);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const ref = doc(db, 'users', currentUser.uid);
    await updateDoc(ref, data);
  };

  const isOwner = userProfile?.role === 'owner';
  const isAdmin = userProfile?.role === 'admin' || currentUser?.email === 'admin@roomsewa.com';

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      isOwner,
      isAdmin,
      login,
      signup,
      logout,
      resetPassword,
      updateUserProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
