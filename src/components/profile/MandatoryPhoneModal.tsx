import React, { useState, useEffect } from 'react';
import {
  Phone,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  LogOut,
  Search,
  Home,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  extractNepalLocalMobile,
  NEPAL_COUNTRY_CODE,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';
import { sendWelcomeMessageOnce } from '../../services/welcomeMessageService';
import { UserRole, UserProfile } from '../../types';

export const MandatoryPhoneModal: React.FC = () => {
  const { currentUser, userProfile, updateUserProfile, setUserRole, logout, loading } = useAuth();
  const [phoneDigits, setPhoneDigits] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRole, setSelectedRole] = useState<'seeker' | 'owner'>('seeker');

  // Prepopulate role if already set on userProfile
  useEffect(() => {
    if (userProfile?.role === 'owner') {
      setSelectedRole('owner');
    } else if (userProfile?.role === 'seeker') {
      setSelectedRole('seeker');
    }
  }, [userProfile?.role]);

  // Check if user has a valid 10-digit Nepal mobile number
  const hasValidPhone = Boolean(
    userProfile?.phoneNumber && isValidNepalMobile(userProfile.phoneNumber)
  );

  const shouldShow = Boolean(currentUser && userProfile && !loading && !hasValidPhone);

  // Prevent background scrolling while mandatory setup screen is active
  useEffect(() => {
    if (shouldShow) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [shouldShow]);

  if (!shouldShow) return null;

  const isDigitsValid = isValidNepalMobile(phoneDigits);
  const showError = touched && phoneDigits.length > 0 && !isDigitsValid;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanDigits = rawVal.slice(0, 10);
    setPhoneDigits(cleanDigits);
    if (!touched && cleanDigits.length > 0) {
      setTouched(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setErrorMsg('');
    setTouched(true);

    if (!isDigitsValid) {
      setErrorMsg(NEPAL_PHONE_ERROR_MESSAGE);
      return;
    }

    setSubmitting(true);
    try {
      const fullNepalPhone = formatFullNepalMobile(phoneDigits);
      const isSuper = userProfile.role === 'admin';
      const effectiveRole: UserRole = isSuper ? 'admin' : selectedRole;
      
      const updatedProfile: UserProfile = {
        ...userProfile,
        phoneNumber: fullNepalPhone,
        role: effectiveRole,
      };

      // 1. Update in Firestore and local AuthContext
      await updateUserProfile({
        phoneNumber: fullNepalPhone,
        role: effectiveRole
      });

      // 2. If non-admin user changed their role, sync via setUserRole as well
      if (!isSuper && effectiveRole !== userProfile.role) {
        try {
          await setUserRole(effectiveRole);
        } catch (roleErr) {
          console.warn('Non-blocking role update warning:', roleErr);
        }
      }

      // 3. If user has not received welcome message yet, send it automatically
      // Guaranteed to send strictly ONCE per user after signup
      if (!userProfile.welcomeMessageSent) {
        try {
          await sendWelcomeMessageOnce(updatedProfile);
        } catch (welcomeErr) {
          console.warn('Welcome message send notice:', welcomeErr);
        }
      }
    } catch (err: any) {
      console.error('Failed to save mobile number:', err);
      setErrorMsg(err.message || 'Failed to save mobile number. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mandatory-phone-title"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto select-text">
        {/* Top Header Pattern */}
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white p-6 sm:p-7 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-400 shadow-lg">
                <Phone className="w-6 h-6" />
              </div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase tracking-wider border border-rose-400/30">
                <span>Mandatory Step</span>
              </div>
            </div>
            
            <h2 id="mandatory-phone-title" className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              Add Your Nepal Mobile Number
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 mt-1.5 leading-relaxed">
              To keep Janakpurdham rentals secure and verified, adding a valid Nepal mobile number is mandatory before continuing.
            </p>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Role Confirmation (only for non-admin accounts) */}
          {userProfile?.role !== 'admin' && (
            <div>
              <label className="block text-xs font-extrabold text-slate-800 mb-1.5">
                I am using RoomSewa as a:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('seeker')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'seeker'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Search className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Room Seeker</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Finding rooms & flats in Janakpur
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedRole('owner')}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedRole === 'owner'
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 ring-2 ring-indigo-500/20 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-xs">
                    <Home className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Room Owner</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                    Listing rooms & finding tenants
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Mobile Number Input */}
          <NepalPhoneInput
            value={phoneDigits}
            onChange={(_full, localDigits) => {
              setPhoneDigits(localDigits);
              if (!touched && localDigits.length > 0) setTouched(true);
            }}
            label="Nepal Mobile Number"
            required
            autoFocus
            id="mandatory-phone-input"
            error={errorMsg || (showError ? NEPAL_PHONE_ERROR_MESSAGE : null)}
            helperText="Must be exactly 10 digits starting with 98 or 97 (e.g. +977 98XXXXXXXX or +977 97XXXXXXXX)."
          />

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-xs text-slate-600 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              Your number is kept private and used only for direct calls and verified inquiry chats regarding rooms in Janakpurdham.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isDigitsValid || submitting}
            className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white font-extrabold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving Mobile Number...</span>
              </>
            ) : (
              <>
                <span>Save & Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Log Out Option */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={logout}
              className="text-xs text-slate-400 hover:text-rose-600 transition-colors inline-flex items-center gap-1 font-semibold cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out / Switch Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
