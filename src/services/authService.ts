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
  remainingSeconds?: number;
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

const BACKEND_BASE_URL = 'https://ais-pre-uop2nnhngsmjntleqs5223-542336724245.asia-southeast1.run.app';

async function apiFetch(path: string, options: RequestInit): Promise<Response> {
  const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
  try {
    const res = await fetch(path, options);
    const contentType = res.headers.get('content-type') || '';
    if ((!res.ok || contentType.includes('text/html')) && isNetlify) {
      return await fetch(`${BACKEND_BASE_URL}${path}`, options);
    }
    return res;
  } catch (err) {
    if (isNetlify) {
      return await fetch(`${BACKEND_BASE_URL}${path}`, options);
    }
    throw err;
  }
}

export async function sendVerificationEmailRoomSewa(
  email: string,
  name?: string,
  uid?: string
): Promise<{ success: boolean; message: string; remainingSeconds?: number }> {
  if (!isValidGmail(email)) {
    throw new Error(GMAIL_ERROR_MESSAGE);
  }

  const res = await apiFetch('/api/auth/send-verification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      name,
      uid,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    })
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to dispatch verification email');
  }

  return data;
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

  const res = await apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      name,
      role,
      phone,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    })
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

  const res = await apiFetch('/api/auth/verify-email', {
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

  const res = await apiFetch('/api/auth/login', {
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

  const res = await apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    })
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

  const res = await apiFetch('/api/auth/reset-password', {
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

  const res = await apiFetch('/api/auth/resend-verification', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      origin: typeof window !== 'undefined' ? window.location.origin : undefined
    })
  });

  const data = await res.json();
  if (!res.ok) {
    const error: any = new Error(data.error || 'Could not resend verification email');
    if (data.remainingSeconds !== undefined) {
      error.remainingSeconds = data.remainingSeconds;
    }
    throw error;
  }

  return data;
}
