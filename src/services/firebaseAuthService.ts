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

// Track client-side 60-second cooldown per email
export const resendCooldownTimestamps = new Map<string, number>();

/**
 * Builds ActionCodeSettings with redirect URL back to the RoomSewa app.
 */
export function getActionCodeSettings(path = '/'): ActionCodeSettings | undefined {
  try {
    const origin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : PRODUCTION_ROOMSEWA_DOMAIN;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return {
      url: `${origin}${cleanPath}`,
      handleCodeInApp: false
    };
  } catch {
    return undefined;
  }
}

/**
 * Single-dispatch fallback for verification email when native Firebase Auth fails.
 * Guarantees NO duplicate emails are sent.
 */
export async function dispatchSingleVerificationEmailFallback(params: {
  email: string;
  name?: string;
  uid?: string;
}): Promise<void> {
  const { email, name, uid } = params;
  const cleanEmail = email.trim().toLowerCase();

  // Try direct backend HTTP dispatch first
  try {
    await sendVerificationEmailRoomSewa(cleanEmail, name, uid);
    return;
  } catch (apiErr) {
    console.warn('[RoomSewa Auth] Direct HTTP dispatch failed, queueing single doc to Firestore:', apiErr);
  }

  // Fallback to Firestore queue only if HTTP dispatch was unreachable
  try {
    const token = `verify_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const verificationExpires = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    const currentOrigin =
      typeof window !== 'undefined' && window.location.origin && !window.location.origin.includes('localhost')
        ? window.location.origin
        : PRODUCTION_ROOMSEWA_DOMAIN;
    const verificationLink = `${currentOrigin}/?action=verify-email&token=${token}&email=${encodeURIComponent(cleanEmail)}`;

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
    console.warn('[RoomSewa Auth] Firestore fallback mail queueing encountered error:', fsErr);
  }
}

/**
 * Safely sends email verification strictly once via Firebase Auth.
 */
export async function sendEmailVerificationSafe(user: User): Promise<void> {
  if (user && user.email) {
    try {
      const actionCodeSettings = getActionCodeSettings('/');
      if (actionCodeSettings) {
        try {
          await sendEmailVerification(user, actionCodeSettings);
        } catch {
          await sendEmailVerification(user);
        }
      } else {
        await sendEmailVerification(user);
      }
    } catch (err: any) {
      console.warn('[Firebase Auth] sendEmailVerificationSafe fallback:', err);
      await dispatchSingleVerificationEmailFallback({
        email: user.email,
        name: user.displayName || undefined,
        uid: user.uid
      });
    }
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
  phone: string;
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

  if (!phone || !phone.trim()) {
    throw new Error('Mobile number is mandatory for registration.');
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

  // 4. Send official verification email strictly once via Firebase Auth (no duplicate emails)
  try {
    const actionSettings = getActionCodeSettings('/');
    if (actionSettings) {
      try {
        await sendEmailVerification(fbUser, actionSettings);
      } catch (settingsErr: any) {
        console.warn('[Firebase Auth] sendEmailVerification with settings fallback to default:', settingsErr?.message);
        await sendEmailVerification(fbUser);
      }
    } else {
      await sendEmailVerification(fbUser);
    }
  } catch (err: any) {
    console.warn('[Firebase Auth] sendEmailVerification encountered error, using single dispatch fallback:', err?.message);
    try {
      await dispatchSingleVerificationEmailFallback({
        email: cleanEmail,
        name: name.trim(),
        uid: fbUser.uid
      });
    } catch (fallbackErr: any) {
      console.error('[Firebase Auth] Fallback verification email dispatch failed:', fallbackErr);
      const mailError: any = new Error("We couldn't send the verification email. Please try again.");
      mailError.code = 'auth/email-send-failed';
      throw mailError;
    }
  }

  // 5. Cache credentials for resend during this session
  setSessionAuthCache(cleanEmail, password, fbUser);

  // 6. Record timestamp for strict 60s resend cooldown
  resendCooldownTimestamps.set(cleanEmail, Date.now());

  // 7. Sign out so user is NOT logged in while unverified
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
  // First reload user to reflect real-time verification status from Firebase Auth
  try {
    await fbUser.reload();
  } catch {}

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
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
      welcomeMessageSent: true,
      isNewSignup: false
    };
    await setDoc(userRef, newProfile);
  } else {
    // Keep isEmailVerified synchronized in Firestore
    await setDoc(userRef, { isEmailVerified: true }, { merge: true });
  }

  return fbUser;
}

/**
 * Resends verification email using Firebase Auth with a strict 60-second cooldown.
 */
export async function resendVerificationWithFirebaseAuth(
  email: string,
  pass?: string
): Promise<AuthSuccessResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  // 1. Enforce strict 60-second cooldown
  const now = Date.now();
  const lastSent = resendCooldownTimestamps.get(cleanEmail) || 0;
  const elapsed = now - lastSent;
  if (elapsed < 60000) {
    const remainingSeconds = Math.ceil((60000 - elapsed) / 1000);
    const err: any = new Error(
      `Resend available in ${remainingSeconds}s. Please check your Inbox and don't forget to check your Spam/Junk folder.`
    );
    err.remainingSeconds = remainingSeconds;
    throw err;
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
  if (targetUser) {
    try {
      await targetUser.reload();
    } catch {}
    if (targetUser.emailVerified) {
      return {
        success: true,
        message: 'Your account is already verified! You can log in directly.',
        remainingSeconds: 0
      };
    }
  }

  // Dispatch fresh verification email
  let dispatched = false;
  if (targetUser) {
    try {
      const actionSettings = getActionCodeSettings('/');
      if (actionSettings) {
        try {
          await sendEmailVerification(targetUser, actionSettings);
        } catch {
          await sendEmailVerification(targetUser);
        }
      } else {
        await sendEmailVerification(targetUser);
      }
      dispatched = true;
    } catch (fbErr: any) {
      console.warn('[Firebase Auth] Native resend sendEmailVerification failed:', fbErr?.message);
    }
    // Sign out to maintain the unverified logged-out constraint
    await fbSignOut(auth);
  }

  if (!dispatched) {
    try {
      const res = await resendVerificationLink(cleanEmail);
      if (res.remainingSeconds !== undefined) {
        resendCooldownTimestamps.set(cleanEmail, Date.now() - (60 - res.remainingSeconds) * 1000);
      } else {
        resendCooldownTimestamps.set(cleanEmail, Date.now());
      }
      return {
        success: true,
        message: res.message || "Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.",
        email: cleanEmail,
        remainingSeconds: 60
      };
    } catch (resendErr: any) {
      if (resendErr?.remainingSeconds !== undefined) {
        resendCooldownTimestamps.set(cleanEmail, Date.now() - (60 - resendErr.remainingSeconds) * 1000);
      }
      throw resendErr;
    }
  }

  // Update cooldown timestamp
  resendCooldownTimestamps.set(cleanEmail, Date.now());

  return {
    success: true,
    message: "Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.",
    email: cleanEmail,
    remainingSeconds: 60
  };
}

/**
 * Forgot Password:
 * Sends official Firebase Auth password reset email to user's registered Gmail.
 */
export async function forgotPasswordWithFirebaseAuth(email: string): Promise<AuthSuccessResult> {
  const cleanEmail = email.trim().toLowerCase();

  if (!isValidGmail(cleanEmail)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  // 1. Dispatch official Firebase Auth Password Reset Email
  try {
    const actionSettings = getActionCodeSettings('/');
    if (actionSettings) {
      try {
        await sendPasswordResetEmail(auth, cleanEmail, actionSettings);
      } catch (settingsErr: any) {
        console.warn('[Firebase Auth] sendPasswordResetEmail with settings fallback to default:', settingsErr?.message);
        await sendPasswordResetEmail(auth, cleanEmail);
      }
    } else {
      await sendPasswordResetEmail(auth, cleanEmail);
    }

    return {
      success: true,
      message: `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
      email: cleanEmail
    };
  } catch (fbErr: any) {
    console.warn('[Firebase Auth] Primary sendPasswordResetEmail failed, attempting fallback:', fbErr?.message);
    try {
      const res = await forgotPasswordRoomSewa(cleanEmail);
      return {
        success: true,
        message: res.message || `Password reset link sent to your Gmail (${cleanEmail})! Please check your Inbox and don't forget to check your Spam/Junk folder.`,
        email: cleanEmail
      };
    } catch {
      throw fbErr;
    }
  }
}

/**
 * Resets password using Firebase Auth Action Code (oobCode).
 */
export async function resetPasswordWithFirebaseAuth(
  oobCode: string,
  newPassword: string,
  email?: string
): Promise<AuthSuccessResult> {
  if (!newPassword || newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters long.');
  }

  // Support legacy/fallback custom reset token if applicable
  if (oobCode.startsWith('rst_')) {
    try {
      const res = await resetPasswordRoomSewa({
        email: email || '',
        token: oobCode,
        newPassword,
        confirmPassword: newPassword
      });
      return {
        success: true,
        message: res.message || 'Your password has been changed successfully! You can now log in using your Gmail and new password.'
      };
    } catch (err: any) {
      throw new Error(err?.message || 'Failed to reset password. Please try again.');
    }
  }

  // Official Firebase Auth Action Code confirmation
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
