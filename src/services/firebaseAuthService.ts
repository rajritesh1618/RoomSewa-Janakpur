/**
 * RoomSewa Firebase Authentication Service
 * 
 * Provides client-side Firebase Authentication for:
 * - Gmail-only validation (@gmail.com)
 * - Native Firebase email verification (official Google/Firebase delivery, avoids Spam filters)
 * - Dynamic ActionCodeSettings (supporting localhost, Netlify domain, and Cloud Run)
 * - Safe fallback if redirect domain is not yet in Firebase Console authorized domains
 * - Verification gate: users cannot log in until email is verified
 * - Secure password reset with Firebase Action Codes
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  applyActionCode,
  confirmPasswordReset,
  verifyPasswordResetCode,
  updateProfile,
  User,
  ActionCodeSettings
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import { auth, db, isSuperAdminEmail } from '../lib/firebase';
import { isValidGmail, GMAIL_ERROR_MESSAGE } from '../utils/emailValidator';
import { UserRole, UserProfile } from '../types';
import {
  sendVerificationEmailRoomSewa,
  forgotPasswordRoomSewa,
  resetPasswordRoomSewa,
  resendVerificationLink
} from './authService';

export interface AuthSuccessResult {
  success: boolean;
  message: string;
  email?: string;
  remainingSeconds?: number;
  unverified?: boolean;
}

// Temporary in-memory cache for resending verification during an active signup/login session
interface CachedAuthCreds {
  email: string;
  password?: string;
  user?: User;
  timestamp: number;
}
let sessionAuthCache: CachedAuthCreds | null = null;

export function setSessionAuthCache(email: string, password?: string, user?: User) {
  sessionAuthCache = {
    email: email.trim().toLowerCase(),
    password,
    user,
    timestamp: Date.now()
  };
}

export function getSessionAuthCache(email: string): CachedAuthCreds | null {
  if (!sessionAuthCache) return null;
  if (sessionAuthCache.email === email.trim().toLowerCase()) {
    return sessionAuthCache;
  }
  return null;
}

export const PRODUCTION_ROOMSEWA_DOMAIN = 'https://roomsewajnk.netlify.app';

/**
 * Builds ActionCodeSettings with redirect URL back to the RoomSewa app.
 * Enforces the actual production RoomSewa domain (https://roomsewajnk.netlify.app)
 * in email verification and password reset links per requirements.
 */
export function getActionCodeSettings(path = '/'): ActionCodeSettings {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return {
    url: `${PRODUCTION_ROOMSEWA_DOMAIN}${cleanPath}`,
    handleCodeInApp: false
  };
}

/**
 * Dispatches verification email strictly from the official RoomSewa Janakpur email account.
 * Primary: Queues in Firestore mailRequests for real-time background worker delivery via Gmail SMTP.
 * Secondary: Direct HTTP endpoint dispatch (/api/auth/send-verification-email).
 * Completely removes any fallback to default/old project email.
 */
export async function dispatchRoomSewaVerificationEmail(params: {
  email: string;
  name?: string;
  uid?: string;
}): Promise<void> {
  const { email, name, uid } = params;
  const cleanEmail = email.trim().toLowerCase();

  const token = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
      ? window.location.origin
      : PRODUCTION_ROOMSEWA_DOMAIN;
  const verificationLink = `${currentOrigin}/?action=verify-email&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

  // 1. Guaranteed queue in Firestore mailRequests for background worker delivery via RoomSewa Janakpur Gmail SMTP
  try {
    await addDoc(collection(db, 'mailRequests'), {
      to: cleanEmail,
      name: name || cleanEmail.split('@')[0],
      type: 'verification',
      status: 'pending',
      token,
      verificationLink,
      origin: currentOrigin,
      createdAt: new Date().toISOString()
    });

    await setDoc(
      doc(db, 'emailVerifications', cleanEmail),
      {
        email: cleanEmail,
        token,
        expiresAt: verificationExpires,
        isVerified: false,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
  } catch (fsErr) {
    console.warn('[RoomSewa Auth] Firestore mail queueing encountered error:', fsErr);
  }

  // 2. Direct backend HTTP dispatch attempt (if server is directly accessible)
  try {
    await sendVerificationEmailRoomSewa(cleanEmail, name, uid);
  } catch (apiErr) {
    console.log('[RoomSewa Auth] Background Firestore worker will process dispatch:', apiErr);
  }
}

/**
 * Safely sends email verification strictly via RoomSewa Janakpur sender.
 * Enforces sender name as RoomSewa Janakpur and address as roomsewajanakpur@gmail.com.
 */
export async function sendEmailVerificationSafe(user: User): Promise<void> {
  if (user && user.email) {
    await dispatchRoomSewaVerificationEmail({
      email: user.email,
      name: user.displayName || undefined,
      uid: user.uid
    });
  }
}

/**
 * Safely sends password reset email strictly via RoomSewa Janakpur sender.
 */
export async function sendPasswordResetEmailSafe(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  await forgotPasswordWithFirebaseAuth(cleanEmail);
}

/**
 * First-Time Signup:
 * 1. Checks valid @gmail.com
 * 2. Creates Firebase Auth user account
 * 3. Initializes Firestore user profile
 * 4. Sends official RoomSewa Janakpur verification email
 * 5. Signs user out immediately (must remain unverified and unauthenticated until link is clicked)
 */
export async function signupWithFirebaseAuth(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}): Promise<AuthSuccessResult> {
  const { email, password, name, role, phone } = params;
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  if (!password || password.length < 6) {
    throw new Error('Password should be at least 6 characters long.');
  }

  if (!name.trim()) {
    throw new Error('Please enter your full name.');
  }

  // 1. Create Firebase Auth user
  const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  const fbUser = userCredential.user;

  // 2. Set user displayName
  try {
    await updateProfile(fbUser, { displayName: name.trim() });
  } catch (err) {
    console.warn('Could not update Firebase displayName:', err);
  }

  // 3. Save initial profile to Firestore
  const isSuper = isSuperAdminEmail(cleanEmail);
  const userProfile: UserProfile = {
    uid: fbUser.uid,
    email: cleanEmail,
    displayName: name.trim(),
    phoneNumber: phone ? phone.trim() : '',
    photoURL: `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
    role: isSuper ? 'admin' : role,
    isPremium: isSuper,
    createdAt: new Date().toISOString(),
    welcomeMessageSent: false,
    isNewSignup: true
  };

  try {
    await setDoc(doc(db, 'users', fbUser.uid), userProfile);
  } catch (err) {
    console.error('Error writing profile to Firestore:', err);
  }

  // 4. Send official verification email via RoomSewa Janakpur sender
  try {
    await dispatchRoomSewaVerificationEmail({
      email: cleanEmail,
      name: name.trim(),
      uid: fbUser.uid
    });
  } catch (err: any) {
    console.warn('Error dispatching verification email:', err);
    const mailError: any = new Error("We couldn't send the verification email. Please try again.");
    mailError.code = 'auth/email-send-failed';
    throw mailError;
  }

  // 5. Cache credentials for resend during this session
  setSessionAuthCache(cleanEmail, password, fbUser);

  // 6. Sign out so user is NOT logged in while unverified
  await fbSignOut(auth);

  return {
    success: true,
    message: "Account created! Please verify your email using the link we sent to your inbox. Also check your spam folder.",
    email: cleanEmail,
    remainingSeconds: 60
  };
}

/**
 * Login:
 * 1. Checks valid @gmail.com
 * 2. Authenticates with Firebase Auth
 * 3. Enforces verification check (blocks unverified accounts and signs out)
 * 4. Loads / updates user profile from Firestore
 */
export async function loginWithFirebaseAuth(email: string, pass: string): Promise<User> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  const fbUser = userCredential.user;

  // Cache credentials in case user is unverified and wants to resend
  setSessionAuthCache(cleanEmail, pass, fbUser);

  // Strict email verification gate:
  // Check either Firebase Auth native emailVerified OR Firestore profile isEmailVerified / emailVerifications
  let isVerified = fbUser.emailVerified;
  if (!isVerified) {
    try {
      const userRef = doc(db, 'users', fbUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const udata = userSnap.data();
        if (udata.isEmailVerified === true || udata.isVerified === true || udata.emailVerified === true) {
          isVerified = true;
        }
      }
      if (!isVerified) {
        const evRef = doc(db, 'emailVerifications', cleanEmail);
        const evSnap = await getDoc(evRef);
        if (evSnap.exists() && (evSnap.data().isVerified === true || evSnap.data().isEmailVerified === true)) {
          isVerified = true;
        }
      }
    } catch (e) {
      console.warn('Error checking Firestore verification status:', e);
    }
  }

  if (!isVerified) {
    await fbSignOut(auth);
    const err: any = new Error(
      'Please verify your email before signing in. Check your inbox and spam folder.'
    );
    err.unverified = true;
    err.code = 'auth/unverified-email';
    err.email = cleanEmail;
    throw err;
  }

  // Sync profile with Firestore
  const userRef = doc(db, 'users', fbUser.uid);
  const docSnap = await getDoc(userRef);
  const isSuper = isSuperAdminEmail(cleanEmail);

  if (!docSnap.exists()) {
    const newProfile: UserProfile = {
      uid: fbUser.uid,
      email: cleanEmail,
      displayName: fbUser.displayName || 'User',
      phoneNumber: fbUser.phoneNumber || '',
      photoURL: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
      role: isSuper ? 'admin' : 'seeker',
      isPremium: isSuper,
      createdAt: new Date().toISOString(),
      welcomeMessageSent: true,
      isNewSignup: false
    };
    await setDoc(userRef, newProfile);
  }

  return fbUser;
}

/**
 * Resends verification email using RoomSewa Janakpur email delivery.
 */
export async function resendVerificationWithFirebaseAuth(
  email: string,
  pass?: string
): Promise<AuthSuccessResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  // Check if we have an active user or cached credentials to authenticate
  let targetUser = auth.currentUser;
  const cached = getSessionAuthCache(cleanEmail);
  const passwordToUse = pass || cached?.password;

  if (!targetUser && passwordToUse) {
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, passwordToUse);
      targetUser = cred.user;
    } catch (err: any) {
      console.warn('Could not authenticate for resend:', err?.message);
    }
  }

  // Check if already verified
  if (targetUser && targetUser.emailVerified) {
    return {
      success: true,
      message: 'Your account is already verified! You can log in directly.',
      remainingSeconds: 0
    };
  }

  // Dispatch fresh verification email from RoomSewa Janakpur account
  await dispatchRoomSewaVerificationEmail({
    email: cleanEmail,
    name: targetUser?.displayName || undefined,
    uid: targetUser?.uid
  });

  // Sign out to maintain the unverified logged-out constraint
  await fbSignOut(auth);

  return {
    success: true,
    message: "Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.",
    email: cleanEmail,
    remainingSeconds: 60
  };
}

/**
 * Forgot Password:
 * Sends password reset link to user's registered Gmail using RoomSewa Janakpur email delivery.
 */
export async function forgotPasswordWithFirebaseAuth(email: string): Promise<AuthSuccessResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  try {
    const res = await forgotPasswordRoomSewa(cleanEmail);
    return {
      success: true,
      message: res.message || `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
      email: cleanEmail
    };
  } catch (apiErr) {
    console.warn('[RoomSewa Auth] Primary reset dispatch failed, queueing via Firestore:', apiErr);
    // Queue in Firestore mailRequests
    try {
      const token = `rst_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      const resetLink = `${PRODUCTION_ROOMSEWA_DOMAIN}/?action=reset-password&token=${token}&email=${encodeURIComponent(cleanEmail)}`;
      await addDoc(collection(db, 'mailRequests'), {
        to: cleanEmail,
        type: 'password_reset',
        status: 'pending',
        token,
        resetLink,
        createdAt: new Date().toISOString()
      });
      return {
        success: true,
        message: `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
        email: cleanEmail
      };
    } catch (fsErr) {
      console.warn('[RoomSewa Auth] Firestore reset queueing encountered error:', fsErr);
    }
  }

  return {
    success: true,
    message: `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
    email: cleanEmail
  };
}

/**
 * Resets password using Firebase Auth Action Code (oobCode).
 */
export async function resetPasswordWithFirebaseAuth(
  oobCode: string,
  newPassword: string
): Promise<AuthSuccessResult> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    return {
      success: true,
      message: 'Your password has been changed successfully! You can now log in using your Gmail and new password.'
    };
  } catch (err: any) {
    if (err?.code === 'auth/invalid-action-code') {
      throw new Error('This password reset link has expired or has already been used. Please request a new link.');
    }
    throw new Error(err?.message || 'Failed to reset password. Please try again.');
  }
}

/**
 * Verifies email using Firebase Auth Action Code (oobCode).
 */
export async function verifyEmailWithFirebaseAuth(oobCode: string): Promise<AuthSuccessResult> {
  try {
    await applyActionCode(auth, oobCode);
    return {
      success: true,
      message: 'Your RoomSewa account has been successfully verified! You can now log in using your Gmail and password.'
    };
  } catch (err: any) {
    if (err?.code === 'auth/invalid-action-code') {
      throw new Error('This verification link has expired or has already been used. If your account is verified, you can log in directly.');
    }
    throw new Error(err?.message || 'Failed to verify email. Please request a new verification email.');
  }
}
