/**
 * RoomSewa Authentication Service
 * Communicates with backend endpoints for Gmail-only login, registration,
 * email verification links, and password resets.
 */

import { isValidGmail, GMAIL_ERROR_MESSAGE } from '../utils/emailValidator';
import { UserRole } from '../types';

export interface AuthUserResponse {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  isPremium: boolean;
  emailVerified: boolean;
}

export interface SignupResult {
  success: boolean;
  message: string;
  email: string;
  verificationLink?: string;
}

export interface LoginResult {
  success: boolean;
  user: AuthUserResponse;
}

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  email: string;
  resetLink?: string;
}

export interface VerificationResult {
  success: boolean;
  message: string;
  alreadyVerified?: boolean;
  email?: string;
}

export interface ResetPasswordResult {
  success: boolean;
  message: string;
  email?: string;
}

export async function signupRoomSewa(params: {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
}): Promise<SignupResult> {
  const { email, password, name, role, phone } = params;

  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, role, phone })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  return data;
}

export async function verifyEmailRoomSewa(token: string, email: string): Promise<VerificationResult> {
  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await fetch('/api/auth/verify-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Email verification failed');
  }

  return data;
}

export async function loginRoomSewa(email: string, password: string): Promise<LoginResult> {
  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || 'Login failed');
    error.unverified = data.unverified;
    error.email = data.email;
    throw error;
  }

  return data;
}

export async function forgotPasswordRoomSewa(email: string): Promise<ForgotPasswordResult> {
  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await fetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not send password reset email');
  }

  return data;
}

export async function resetPasswordRoomSewa(params: {
  email: string;
  token: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ResetPasswordResult> {
  const { email, token, newPassword, confirmPassword } = params;

  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  if (newPassword !== confirmPassword) {
    throw new Error('Both passwords must match before allowing the password to be changed.');
  }

  const res = await fetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, token, newPassword, confirmPassword })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Password reset failed');
  }

  return data;
}

export async function resendVerificationLink(email: string): Promise<SignupResult> {
  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await fetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Could not resend verification email');
  }

  return data;
}
