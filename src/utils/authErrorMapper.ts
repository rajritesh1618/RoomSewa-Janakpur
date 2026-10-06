/**
 * Centralized Firebase Authentication Error Mapper
 * Maps Firebase error codes and validation issues to user-friendly messages.
 * Completely eliminates raw Firebase codes (e.g., auth/invalid-credential) from the UI.
 */

export type AuthContextMode =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'forgot-sent'
  | 'verification-sent'
  | 'reset-password'
  | string;

export function getAuthErrorMessage(error: any, context: AuthContextMode = 'login'): string {
  if (!error) return '';

  // Extract raw error code and message
  const rawCode = (typeof error === 'string' ? error : error?.code || '').toLowerCase().trim();
  const rawMessage = (typeof error === 'string' ? error : error?.message || '').toLowerCase();

  // 0. Resend Cooldown / Rate Limiting
  if (rawMessage.includes('resend available in') || error?.remainingSeconds !== undefined) {
    const secs = error?.remainingSeconds !== undefined ? error.remainingSeconds : 60;
    return `Resend available in ${secs}s. Please check your Inbox and don't forget to check your Spam/Junk folder.`;
  }

  // 1. Email is not verified (gate)
  if (
    error?.unverified === true ||
    rawCode === 'auth/unverified-email' ||
    rawMessage.includes('not verified') ||
    rawMessage.includes('unverified')
  ) {
    return 'Please verify your email before signing in. Check your inbox and spam folder.';
  }

  // 2. Network connectivity errors
  if (
    rawCode === 'auth/network-request-failed' ||
    rawCode === 'network-error' ||
    rawMessage.includes('network') ||
    rawMessage.includes('internet') ||
    rawMessage.includes('offline') ||
    rawMessage.includes('connection failed')
  ) {
    return 'Network error. Please check your internet connection and try again.';
  }

  // 3. Too many attempts / rate limiting
  if (
    rawCode === 'auth/too-many-requests' ||
    rawMessage.includes('too many') ||
    rawMessage.includes('blocked all requests')
  ) {
    return 'Too many unsuccessful attempts. Please try again later.';
  }

  // 4. Invalid email format
  if (
    rawCode === 'auth/invalid-email' ||
    rawCode === 'auth/invalid-email-format' ||
    rawMessage.includes('invalid email') ||
    rawMessage.includes('valid gmail') ||
    rawMessage.includes('valid email')
  ) {
    return 'Please enter a valid email address.';
  }

  // 5. Weak password
  if (
    rawCode === 'auth/weak-password' ||
    rawMessage.includes('weak-password') ||
    rawMessage.includes('password is too weak') ||
    (rawMessage.includes('password') && rawMessage.includes('at least 6'))
  ) {
    return 'Password is too weak. Please use a stronger password.';
  }

  // 6. Passwords mismatch
  if (
    rawCode === 'auth/passwords-mismatch' ||
    rawMessage.includes('passwords do not match') ||
    rawMessage.includes('passwords match')
  ) {
    return 'Passwords do not match.';
  }

  // 7. Empty required fields
  if (
    rawCode === 'auth/missing-fields' ||
    rawCode === 'auth/empty-fields' ||
    rawCode === 'auth/missing-email' ||
    rawCode === 'auth/missing-password' ||
    rawMessage.includes('fill in all') ||
    rawMessage.includes('required fields') ||
    rawMessage.includes('enter your email and password')
  ) {
    if (context === 'signup') {
      return 'Please fill in all required fields.';
    }
    return 'Please enter your email and password.';
  }

  // 8. SIGN UP specific mappings
  if (context === 'signup') {
    if (
      rawCode === 'auth/email-already-in-use' ||
      rawMessage.includes('already in use') ||
      rawMessage.includes('already registered')
    ) {
      return 'This email is already registered. Please sign in instead.';
    }

    if (
      rawCode === 'auth/email-send-failed' ||
      rawMessage.includes("couldn't send") ||
      rawMessage.includes('could not send verification')
    ) {
      return "We couldn't send the verification email. Please try again.";
    }

    // Default for Sign Up failures
    return 'Something went wrong while creating your account. Please try again.';
  }

  // 9. SIGN IN specific mappings
  if (context === 'login') {
    if (
      rawCode === 'auth/user-not-found' ||
      rawMessage.includes('user-not-found') ||
      rawMessage.includes('no account found') ||
      rawMessage.includes('no user record')
    ) {
      return 'No account found with this email. Please sign up first.';
    }

    if (
      rawCode === 'auth/invalid-credential' ||
      rawCode === 'auth/wrong-password' ||
      rawCode === 'auth/invalid-login-credentials' ||
      rawMessage.includes('invalid-credential') ||
      rawMessage.includes('wrong password') ||
      rawMessage.includes('incorrect email or password')
    ) {
      return 'Incorrect email or password. Please try again.';
    }

    // Default for Sign In failures
    return 'Something went wrong. Please try again.';
  }

  // 10. RESET PASSWORD specific mappings
  if (context === 'reset-password' || context === 'forgot-password') {
    if (
      rawCode === 'auth/invalid-action-code' ||
      rawCode === 'auth/expired-action-code' ||
      rawMessage.includes('invalid-action-code') ||
      rawMessage.includes('expired')
    ) {
      return 'This password reset link has expired or is invalid. Please request a new link.';
    }

    if (
      rawCode === 'auth/user-not-found' ||
      rawMessage.includes('user-not-found')
    ) {
      return 'No account found with this email. Please sign up first.';
    }

    return 'Something went wrong. Please try again.';
  }

  // Generic fallback
  return 'Something went wrong. Please try again.';
}
