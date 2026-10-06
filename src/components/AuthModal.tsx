import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Send
} from 'lucide-react';
import { auth, isSuperAdminEmail } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../utils/nepalPhone';
import { isValidGmail, GMAIL_ERROR_MESSAGE } from '../utils/emailValidator';
import { getAuthErrorMessage } from '../utils/authErrorMapper';
import { NepalPhoneInput } from './common/NepalPhoneInput';
import { resetPasswordWithFirebaseAuth } from '../services/firebaseAuthService';
import { JanakiMandirLogo, MithilaBorderStrip } from './common/MithilaMotifs';

export type AuthMode =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'forgot-sent'
  | 'verification-sent'
  | 'reset-password';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  initialEmail?: string;
  initialResetToken?: string;
  verificationSuccessMessage?: string | null;
  onAdminLoginSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login',
  initialEmail = '',
  initialResetToken = '',
  verificationSuccessMessage = null,
  onAdminLoginSuccess
}) => {
  const {
    loginWithEmail,
    signupWithEmail,
    signInWithGoogle,
    resendVerificationEmail,
    forgotPassword
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [role, setRole] = useState<UserRole>('seeker');
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [emailTouched, setEmailTouched] = useState(false);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState('');
  
  // Password reset fields
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState(initialResetToken);

  // Status and feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // 60-second cooldown timer for resending verification email
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);
  const [generatedResetLink, setGeneratedResetLink] = useState('');
  const [copiedResetLink, setCopiedResetLink] = useState(false);

  const handleCopyResetLink = (text: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedResetLink(true);
    setTimeout(() => setCopiedResetLink(false), 2500);
  };

  // Countdown ticker: Decrements every 1 second until 0
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Sync mode and prefilled data whenever defaultMode, initialEmail, or isOpen changes
  useEffect(() => {
    if (isOpen) {
      setMode(defaultMode);
      setErrorMsg('');
      setSuccessMsg(verificationSuccessMessage || '');
      setEmailTouched(false);
      setPhoneTouched(false);
      if (initialEmail) {
        setEmail(initialEmail);
      }
      if (initialResetToken) {
        setResetToken(initialResetToken);
      }
    }
  }, [isOpen, defaultMode, initialEmail, initialResetToken, verificationSuccessMessage]);

  if (!isOpen) return null;

  // Gmail validation calculations
  const isEmailValid = isValidGmail(email);
  const showEmailError = emailTouched && !isEmailValid;

  // Mobile validation calculations
  const isPhoneValid = isValidNepalMobile(phoneDigits);
  const showPhoneError = phoneTouched && phoneDigits.length > 0 && !isPhoneValid;

  // Passwords match validation for Reset Password
  const doPasswordsMatch = Boolean(
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword
  );

  // Form validity for button disabled state
  const isSignupValid = Boolean(
    name.trim().length > 0 &&
    isEmailValid &&
    password.length >= 6 &&
    isPhoneValid
  );

  const isLoginValid = Boolean(
    isEmailValid &&
    password.length > 0
  );

  const isResetValid = Boolean(
    isEmailValid &&
    newPassword.length >= 6 &&
    confirmPassword.length >= 6 &&
    newPassword === confirmPassword
  );

  const handleResendVerification = async (targetEmail: string) => {
    if (!targetEmail || resendCooldown > 0 || resending) return;
    // Immediately start 60-second countdown and disable button to prevent rapid/duplicate requests
    setResendCooldown(60);
    setResending(true);
    setErrorMsg('');
    try {
      const res = await resendVerificationEmail(targetEmail, password);
      setResendCooldown(res.remainingSeconds !== undefined ? res.remainingSeconds : 60);
      setSuccessMsg("Account created! Please verify your email using the link we sent to your inbox. Also check your spam folder.");
    } catch (err: any) {
      if (err?.remainingSeconds !== undefined) {
        setResendCooldown(err.remainingSeconds);
      }
      setErrorMsg(getAuthErrorMessage(err, 'signup'));
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent multiple form submissions while processing
    setSubmitting(true);

    setErrorMsg('');
    setSuccessMsg('');
    setPhoneTouched(true);
    setEmailTouched(true);

    // Context-aware validation with exact user-friendly error messages
    if (mode === 'login') {
      if (!email.trim() || !password) {
        setErrorMsg('Please enter your email and password.');
        setSubmitting(false);
        return;
      }
      if (!isEmailValid) {
        setErrorMsg('Please enter a valid email address.');
        setSubmitting(false);
        return;
      }
    } else if (mode === 'signup') {
      if (!name.trim() || !phoneDigits || !email.trim() || !password) {
        setErrorMsg('Please fill in all required fields.');
        setSubmitting(false);
        return;
      }
      if (!isEmailValid) {
        setErrorMsg('Please enter a valid email address.');
        setSubmitting(false);
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password is too weak. Please use a stronger password.');
        setSubmitting(false);
        return;
      }
      if (!isPhoneValid) {
        setErrorMsg(NEPAL_PHONE_ERROR_MESSAGE);
        setSubmitting(false);
        return;
      }
    } else if (mode === 'forgot-password') {
      if (!email.trim()) {
        setErrorMsg('Please enter your email and password.');
        setSubmitting(false);
        return;
      }
      if (!isEmailValid) {
        setErrorMsg('Please enter a valid email address.');
        setSubmitting(false);
        return;
      }
    } else if (mode === 'reset-password') {
      if (!newPassword || !confirmPassword) {
        setErrorMsg('Please fill in all required fields.');
        setSubmitting(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setSubmitting(false);
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Password is too weak. Please use a stronger password.');
        setSubmitting(false);
        return;
      }
    }

    try {
      if (mode === 'login') {
        // Attempt login with verified Gmail account
        await loginWithEmail(email.trim(), password);
        setErrorMsg('');
        onClose();
        if (isSuperAdminEmail(email) || isSuperAdminEmail(auth.currentUser?.email)) {
          onAdminLoginSuccess?.();
        }
      } else if (mode === 'signup') {
        // First-Time Signup:
        // Delivers real verification email via Firebase Auth, account remains unverified, user is NOT logged in
        const fullNepalPhone = formatFullNepalMobile(phoneDigits);
        const signupRes = await signupWithEmail(
          email.trim(),
          password,
          name.trim(),
          role,
          fullNepalPhone
        );

        setUnverifiedEmail(email.trim());
        setResendCooldown(signupRes.remainingSeconds || 60);
        setMode('verification-sent');
        setErrorMsg('');
        setSuccessMsg(signupRes.message || "Account created! Please verify your email using the link we sent to your inbox. Also check your spam folder.");
      } else if (mode === 'forgot-password') {
        // Forgot Password:
        const res = await forgotPassword(email.trim());
        setMode('forgot-sent');
        setErrorMsg('');
        setSuccessMsg(res.message);
      } else if (mode === 'reset-password') {
        const tokenToUse = resetToken || initialResetToken;
        if (!tokenToUse) {
          throw new Error('This password reset link has expired or is invalid. Please request a new link.');
        }
        const res = await resetPasswordWithFirebaseAuth(tokenToUse, newPassword, email);
        setErrorMsg('');
        setSuccessMsg(res.message);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMode('login');
      }
    } catch (err: any) {
      if (err?.unverified) {
        setUnverifiedEmail(err.email || email.trim());
      }
      // Convert raw error codes into friendly user messages
      setErrorMsg(getAuthErrorMessage(err, mode));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      await signInWithGoogle(role);
      onClose();
      if (isSuperAdminEmail(auth.currentUser?.email)) {
        onAdminLoginSuccess?.();
      }
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('The sign-in popup was blocked by your browser iframe. Please allow popups for this site or open the app in a new tab.');
      } else if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        setErrorMsg('Sign-in popup was closed before completing authentication.');
      } else if (err.code === 'auth/unauthorized-domain') {
        setErrorMsg('This web domain is not authorized in Firebase Auth. Open the app directly via its standalone URL to sign in.');
      } else {
        setErrorMsg(getAuthErrorMessage(err, 'login'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        id="auth-modal"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-200/90 overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Top Decorative Mithila Border Strip */}
        <MithilaBorderStrip variant="saffron" className="opacity-90 shrink-0" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 hover:bg-amber-50 rounded-xl transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 sm:p-8 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="flex justify-center mb-3">
              <JanakiMandirLogo size={52} className="drop-shadow-xs" />
            </div>
            <h2 className="text-2xl font-black text-stone-900 font-heading">
              {mode === 'login' && 'Welcome Back'}
              {mode === 'signup' && 'Create RoomSewa Account'}
              {mode === 'forgot-password' && 'Forgot Password?'}
              {mode === 'forgot-sent' && 'Reset Link Sent'}
              {mode === 'verification-sent' && 'Verify Your Gmail'}
              {mode === 'reset-password' && 'Set New Password'}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              {mode === 'login' && 'Sign in to access your Janakpur saved rooms and listings'}
              {mode === 'signup' && 'Join RoomSewa Janakpur as a room seeker or property owner'}
              {mode === 'forgot-password' && 'Enter your registered Gmail address to receive a secure password-reset link'}
              {mode === 'forgot-sent' && 'Check your Gmail to set a new password for your account'}
              {mode === 'verification-sent' && 'Activate your account via the verification link sent from RoomSewa'}
              {mode === 'reset-password' && 'Enter and confirm your new password to restore account access'}
            </p>
          </div>

          {/* Tab Switcher for standard Login vs Sign Up */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex p-1 bg-amber-100/70 border border-amber-200/80 rounded-xl mb-6">
              <button
                type="button"
                id="tab-login-btn"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setEmailTouched(false);
                  setPhoneTouched(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="tab-signup-btn"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setEmailTouched(false);
                  setPhoneTouched(false);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Success Banner */}
          {successMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-start gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>

              {/* If account unverified banner with Resend button */}
              {unverifiedEmail && (
                <div className="pt-2.5 border-t border-rose-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span className="text-[11px] text-rose-700">Didn't receive the email? Check Spam folder or:</span>
                  <button
                    type="button"
                    disabled={resending || resendCooldown > 0}
                    onClick={() => handleResendVerification(unverifiedEmail)}
                    className={`text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                      resendCooldown > 0
                        ? 'text-rose-400 cursor-not-allowed'
                        : 'text-rose-800 hover:text-rose-950 underline cursor-pointer'
                    }`}
                  >
                    <RefreshCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                    <span>
                      {resending
                        ? 'Sending...'
                        : resendCooldown > 0
                        ? `Resend available in ${resendCooldown}s`
                        : 'Resend Verification Email'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE: VERIFICATION SENT (After Signup) */}
          {mode === 'verification-sent' && (
            <div className="space-y-4">
              {/* Primary Notification Banner */}
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 text-xs space-y-2.5 animate-in fade-in">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                  <Mail className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Verification Email Sent</span>
                </div>
                <p className="text-xs font-bold text-amber-950 leading-relaxed bg-amber-100/70 p-3 rounded-xl border border-amber-200">
                  Verification email sent. Please check your Inbox and don't forget to check your Spam/Junk folder.
                </p>
                <p className="text-[11px] text-amber-900 leading-relaxed">
                  An official email verification message has been dispatched to{' '}
                  <strong className="underline text-slate-900">{email}</strong>.
                </p>
                <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 text-[11px] text-slate-700 font-medium">
                  ⚠️ <strong>Account Status:</strong> Your account will remain unverified and you will <strong>not be logged in</strong> until you click the verification link received in your email.
                </div>
              </div>

              {/* Instructions Box */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>How to Complete Account Activation</span>
                </div>
                <ol className="list-decimal list-inside space-y-2 text-[11px] text-slate-600 leading-relaxed">
                  <li>
                    Open your <strong>Gmail inbox</strong> on this device or your mobile app.
                  </li>
                  <li>
                    Look for an email from <strong>RoomSewa Janakpur</strong> with subject <em>"Verify your RoomSewa Janakpur account"</em>.
                  </li>
                  <li>
                    If you don't see it immediately, please check your <strong>Spam or Junk folder</strong>.
                  </li>
                  <li>
                    Click the verification link/button inside the email to activate your account.
                  </li>
                  <li>
                    Return to this page and sign in with your Gmail address and password.
                  </li>
                </ol>
              </div>

              {/* Action Buttons: 60s Resend Cooldown & Return to Sign In */}
              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  id="resend-verification-btn"
                  disabled={resending || resendCooldown > 0}
                  onClick={() => handleResendVerification(email)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
                    resendCooldown > 0
                      ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed shadow-none'
                      : 'border border-slate-300 hover:bg-slate-100 text-slate-800 hover:text-slate-900 cursor-pointer shadow-xs'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                  <span>
                    {resending
                      ? 'Sending Verification Email...'
                      : resendCooldown > 0
                      ? `Resend available in ${resendCooldown}s`
                      : 'Resend Verification Email'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Already Verified? Return to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* MODE: FORGOT SENT (After requesting password reset) */}
          {mode === 'forgot-sent' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-950 text-xs space-y-2">
                <div className="flex items-center gap-2 text-indigo-800 font-bold">
                  <KeyRound className="w-4 h-4 text-indigo-600" />
                  <span>Password Reset Email Sent</span>
                </div>
                <p className="text-[11px] text-indigo-900 leading-relaxed">
                  We sent a secure password-reset link to <strong className="underline">{email}</strong>.
                </p>
                <p className="text-[11px] text-slate-600">
                  Open the email in your Gmail app and click the link to set your new password. (Be sure to check your Spam folder if needed).
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                  setSuccessMsg('');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Quick Google Sign In for Login and Signup */}
          {(mode === 'login' || mode === 'signup') && (
            <>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full mb-4 flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>
                  {mode === 'signup' ? 'Sign Up with Google (Instant Access)' : 'Continue with Google'}
                </span>
              </button>

              <div className="flex items-center my-4">
                <div className="flex-1 border-t border-slate-200"></div>
                <span className="px-3 text-[11px] font-semibold text-slate-400 uppercase">Or with Gmail</span>
                <div className="flex-1 border-t border-slate-200"></div>
              </div>
            </>
          )}

          {/* MAIN FORMS: Login, Signup, Forgot Password, Reset Password */}
          {(mode === 'login' || mode === 'signup' || mode === 'forgot-password' || mode === 'reset-password') && (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Sign Up Specific Fields */}
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      I am a *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRole('seeker')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          role === 'seeker'
                            ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs'
                            : 'border-stone-200 text-stone-600 hover:bg-amber-50/40'
                        }`}
                      >
                        <span>Room Seeker</span>
                        <span className="text-[10px] font-normal text-stone-500">Looking for room</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('owner')}
                        className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          role === 'owner'
                            ? 'border-amber-500 bg-amber-50/80 text-amber-950 shadow-xs'
                            : 'border-stone-200 text-stone-600 hover:bg-amber-50/40'
                        }`}
                      >
                        <span>Room Owner</span>
                        <span className="text-[10px] font-normal text-stone-500">List room or flat</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="e.g. Roshan Yadav"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  <NepalPhoneInput
                    value={phoneDigits}
                    onChange={(_full, localDigits) => {
                      setPhoneDigits(localDigits);
                      if (errorMsg) setErrorMsg('');
                      if (!phoneTouched && localDigits.length > 0) {
                        setPhoneTouched(true);
                      }
                    }}
                    label="Mobile Number"
                    required
                    id="signup-mobile-input"
                    error={showPhoneError && !errorMsg ? NEPAL_PHONE_ERROR_MESSAGE : null}
                    helperText="Must be exactly 10 digits starting with 98 or 97 (e.g. +977 98XXXXXXXX or +977 97XXXXXXXX)."
                  />
                </>
              )}

              {/* Gmail Address Input (Used in Login, Signup, and Forgot-Password) */}
              {mode !== 'reset-password' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Gmail Address *
                    </label>
                    {email.trim().length > 0 && isEmailValid && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Valid Gmail (@gmail.com)</span>
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3.5 top-3 transition-colors ${
                        showEmailError ? 'text-rose-500' : isEmailValid ? 'text-emerald-600' : 'text-slate-400'
                      }`}
                    />
                    <input
                      id="auth-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMsg) setErrorMsg('');
                        if (!emailTouched && e.target.value.length > 0) {
                          setEmailTouched(true);
                        }
                      }}
                      onBlur={() => setEmailTouched(true)}
                      placeholder="username@gmail.com"
                      required
                      className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                        showEmailError
                          ? 'border-rose-400 ring-2 ring-rose-100 bg-rose-50/10'
                          : isEmailValid
                          ? 'border-emerald-500 ring-2 ring-emerald-50'
                          : 'border-slate-200 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100'
                      }`}
                    />
                  </div>
                  {showEmailError && !errorMsg && (
                    <p className="text-rose-600 text-[11px] font-semibold flex items-center gap-1 mt-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{GMAIL_ERROR_MESSAGE}</span>
                    </p>
                  )}
                  <p className="text-slate-400 text-[10px] mt-1">
                    Accepts valid Gmail addresses ending with <strong>@gmail.com</strong> (e.g. username@gmail.com).
                  </p>
                </div>
              )}

              {/* Password Input for Login & Signup */}
              {(mode === 'login' || mode === 'signup') && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Password *
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      id="auth-password-input"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg('');
                      }}
                      placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                      required
                      minLength={mode === 'signup' ? 6 : 1}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Reset Password Fields: New Password + Confirm Password */}
              {mode === 'reset-password' && (
                <div className="space-y-3.5">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <span className="text-slate-500 font-medium">Resetting password for: </span>
                    <strong className="text-slate-900">{email}</strong>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="At least 6 characters"
                        required
                        minLength={6}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:border-indigo-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                        Confirm Password *
                      </label>
                      {confirmPassword.length > 0 && (
                        <span
                          className={`text-[11px] font-bold flex items-center gap-1 ${
                            doPasswordsMatch ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {doPasswordsMatch ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Passwords Match</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Passwords do not match</span>
                            </>
                          )}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errorMsg) setErrorMsg('');
                        }}
                        placeholder="Re-type new password"
                        required
                        minLength={6}
                        className={`w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all ${
                          confirmPassword.length > 0 && !doPasswordsMatch
                            ? 'border-rose-400 ring-2 ring-rose-50'
                            : doPasswordsMatch
                            ? 'border-emerald-500 ring-2 ring-emerald-50'
                            : 'border-slate-200 focus:border-indigo-600'
                        }`}
                      />
                    </div>
                    <p className="text-slate-400 text-[10px] mt-1">
                      Both passwords must match before allowing the password to be changed.
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                id="auth-submit-btn"
                type="submit"
                disabled={submitting}
                className="w-full mt-3 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:from-stone-300 disabled:to-stone-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md shadow-orange-600/20 disabled:shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Please wait...</span>
                  </span>
                ) : mode === 'login' ? (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : mode === 'signup' ? (
                  <>
                    <span>Sign Up & Send Verification Link</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                ) : mode === 'forgot-password' ? (
                  <>
                    <span>Send Password-Reset Link</span>
                    <Send className="w-4 h-4" />
                  </>
                ) : (
                  <>
                    <span>Change Password & Return to Login</span>
                    <CheckCircle2 className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Forgot Password Link below Login button */}
              {mode === 'login' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    id="forgot-password-link-btn"
                    onClick={() => {
                      setMode('forgot-password');
                      setErrorMsg('');
                      setSuccessMsg('');
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Switch to Sign In / Sign Up helpers */}
              {mode === 'forgot-password' && (
                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}

              {mode === 'login' && (
                <p className="text-center text-xs text-slate-500 pt-1">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg('');
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Sign Up
                  </button>
                </p>
              )}

              {mode === 'signup' && (
                <p className="text-center text-xs text-slate-500 pt-1">
                  Already have a verified account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setErrorMsg('');
                    }}
                    className="font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Log In
                  </button>
                </p>
              )}
            </form>
          )}

          <p className="text-center text-[11px] text-slate-400 mt-6">
            RoomSewa Janakpur — Direct room & flat rental network in Janakpurdham, Nepal.
          </p>
        </div>
      </div>
    </div>
  );
};
