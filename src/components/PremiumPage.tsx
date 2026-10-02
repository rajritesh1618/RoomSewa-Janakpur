import React, { useState } from 'react';
import {
  Crown,
  Check,
  Zap,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  CheckCircle2,
  XCircle,
  Upload,
  AlertCircle,
  QrCode,
  Building2,
  Phone,
  Image as ImageIcon,
  MessageSquare,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { useContent } from '../context/ContentContext';
import { PaymentMethodConfig } from '../types';
import { uploadPaymentReceiptImage, validatePaymentQrFile } from '../utils/paymentQrStorage';

interface PremiumPageProps {
  onOpenAuth: () => void;
  onNavigateHome?: () => void;
  onOpenChat?: (conversationId: string) => void;
}

export const PremiumPage: React.FC<PremiumPageProps> = ({ onOpenAuth, onNavigateHome, onOpenChat }) => {
  const { currentUser, userProfile, isPremium, isOwner, setUserRole, refreshUserProfile } = useAuth();
  const { requestPremium, premiumRequests } = useRooms();
  const { premiumConfig, paymentMethods } = useContent();

  // Active & visible payment methods from database
  const activeMethods = paymentMethods.filter((m) => m.enabled && m.visible);

  const [selectedMethodId, setSelectedMethodId] = useState<string>(
    activeMethods[0]?.id || ''
  );
  const [transactionRef, setTransactionRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [uploadingScreenshot, setUploadingScreenshot] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const screenshotInputRef = React.useRef<HTMLInputElement>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showResubmitForm, setShowResubmitForm] = useState(false);
  const [showQrZoom, setShowQrZoom] = useState(false);

  // Clean up preview object URLs
  React.useEffect(() => {
    return () => {
      if (screenshotPreviewUrl && screenshotPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(screenshotPreviewUrl);
      }
    };
  }, [screenshotPreviewUrl]);

  const handleScreenshotSelect = async (file: File) => {
    setScreenshotError(null);
    const validation = validatePaymentQrFile(file);
    if (!validation.valid) {
      setScreenshotError(validation.error || 'Invalid receipt image file.');
      return;
    }

    if (screenshotPreviewUrl && screenshotPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }
    const localPreview = URL.createObjectURL(file);
    setScreenshotFile(file);
    setScreenshotPreviewUrl(localPreview);

    setUploadingScreenshot(true);
    try {
      const uploadedUrl = await uploadPaymentReceiptImage(file);
      setProofUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Screenshot upload failed:', err);
      setScreenshotError(err.message || 'Failed to upload screenshot. Please try again.');
    } finally {
      setUploadingScreenshot(false);
    }
  };

  const handleRemoveScreenshot = () => {
    if (screenshotPreviewUrl && screenshotPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(screenshotPreviewUrl);
    }
    setScreenshotFile(null);
    setScreenshotPreviewUrl(null);
    setProofUrl('');
    setScreenshotError(null);
  };

  // Selected method object
  const currentMethod =
    activeMethods.find((m) => m.id === selectedMethodId) || activeMethods[0];

  // Check user's latest payment request from database
  const myRequests = premiumRequests.filter(
    (r) => r.userId === currentUser?.uid || (currentUser?.email && r.userEmail?.toLowerCase() === currentUser.email.toLowerCase())
  );
  const latestRequest = myRequests[0];
  const isPendingReview = latestRequest?.status === 'pending';
  const isRejected = (latestRequest?.status === 'rejected') || (userProfile?.premiumStatus === 'rejected');
  const rejectionReasonText = latestRequest?.rejectionReason || latestRequest?.adminNotes || (userProfile as any)?.rejectionReason;

  const handleTriggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    if (uploadingScreenshot) {
      setErrorMsg('Please wait for your payment screenshot upload to complete.');
      return;
    }
    setErrorMsg('');
    setSubmitting(true);
    try {
      const methodName = currentMethod ? currentMethod.name : 'Direct Transfer';
      await requestPremium(
        methodName as any,
        transactionRef.trim(),
        proofUrl.trim(),
        {
          paymentMethodId: currentMethod?.id,
          amountNPR: premiumConfig.priceNPR || 200,
          senderName: userProfile?.displayName || currentUser.displayName || 'Owner',
          senderPhone: userProfile?.phoneNumber || ''
        }
      );
      setSubmittedSuccess(true);
      handleTriggerConfetti();
    } catch (err: any) {
      console.error('Payment request error:', err);
      setErrorMsg(err.message || 'Payment request failed to submit.');
    } finally {
      setSubmitting(false);
    }
  };

  // If Premium is globally disabled (Premium Status: OFF)
  if (!premiumConfig.enabled) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Sparkles className="w-8 h-8 text-emerald-600" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-black uppercase mb-3">
          <span>Premium Status: OFF</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
          All Owners Can Use the App for Free!
        </h2>
        <p className="text-sm text-slate-600 mt-2.5 mb-6 max-w-md mx-auto leading-relaxed">
          Premium restrictions are currently turned <strong>OFF</strong> by administrators. All property owners and landlords in Janakpur can post unlimited rooms, flats, and rentals completely free with no paid upgrade required.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="#add-room"
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>List a Room for Free</span>
          </a>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // 1. Not logged in: Show Owner Login Required
  if (!currentUser) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <Crown className="w-8 h-8 text-amber-600 fill-amber-500" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Property Owner Access Required
        </h2>
        <p className="text-sm text-slate-600 mt-2.5 mb-6 max-w-md mx-auto leading-relaxed">
          The Premium Dashboard is an owner-only feature for property owners and landlords in Janakpur. Please log in with an Owner account to access this page.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onOpenAuth}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            Log In as Property Owner
          </button>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  // 2. Logged in as Seeker: Access Restricted
  if (!isOwner) {
    return (
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-5 shadow-sm">
          <ShieldCheck className="w-8 h-8 text-rose-600" />
        </div>
        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold mb-3">
          Access Restricted • Owner Feature Only
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          Premium Dashboard is for Property Owners
        </h2>
        <p className="text-sm text-slate-600 mt-2.5 mb-6 max-w-md mx-auto leading-relaxed">
          You are currently logged in as a <strong>Seeker</strong> (tenant). The Premium Dashboard is exclusively reserved for property owners to manage unlimited room listings, badges, and owner perks in Janakpur.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 max-w-md mx-auto mb-6 text-left">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Logged in account:</span>
            <span className="font-bold text-slate-900">{currentUser.email}</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2 pt-2 border-t border-slate-200/70">
            <span className="text-slate-500 font-medium">Current Profile Role:</span>
            <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold capitalize">
              {userProfile?.role || 'Seeker'}
            </span>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold max-w-md mx-auto">
            {errorMsg}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={async () => {
              try {
                await setUserRole('owner');
                await refreshUserProfile();
              } catch (err: any) {
                setErrorMsg(err.message || 'Failed to switch role to owner');
              }
            }}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
          >
            <Crown className="w-4 h-4 fill-slate-950" />
            Switch Role to Owner & Continue
          </button>
          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all"
            >
              Return to Home
            </button>
          )}
        </div>
      </div>
    );
  }

  const activeBenefits = premiumConfig.benefits?.filter((b) => b.active) || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Premium Header */}
      <div className="text-center max-w-2xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold mb-4">
          <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
          {premiumConfig.title || 'RoomSewa Janakpur Verified Gold'}
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight">
          {premiumConfig.subtitle || 'Supercharge Your Room Listings in Janakpur'}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-3">
          Get verified badge, rank higher in chowk searches, and rent out your properties 3x faster with {premiumConfig.durationText || 'lifetime'} premium access.
        </p>
      </div>

      {isPremium ? (
        <div className="max-w-xl mx-auto p-8 rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-100/50 to-amber-50 border-2 border-amber-300 text-center shadow-md">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
            <Crown className="w-8 h-8 fill-slate-950" />
          </div>
          <h3 className="text-2xl font-extrabold text-slate-900 font-heading">
            You Are a Verified Gold Member!
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-md mx-auto">
            Your account has lifetime premium privileges on RoomSewa Janakpur. You can post unlimited rooms, enjoy gold badge highlights, and get priority visibility.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-amber-950 bg-amber-200/80 px-4 py-2 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" /> {premiumConfig.durationText || 'Lifetime'} Membership Active
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Plan Comparison Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-700">
                  {premiumConfig.durationText || 'Lifetime Pass'}
                </span>
                <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
                  RoomSewa Gold
                </h2>
              </div>
              <div className="text-right">
                <div className="text-3xl font-black text-amber-600 font-heading">
                  Rs {premiumConfig.priceNPR || 200}
                </div>
                <span className="text-xs font-medium text-slate-400">One-time payment</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-6">
              Specifically tailored for property owners, landlords, and student hostel managers in Janakpurdham.
            </p>

            <ul className="space-y-3.5 mb-8 text-xs sm:text-sm text-slate-700">
              {activeBenefits.map((b) => (
                <li key={b.id} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                  <span>{b.text}</span>
                </li>
              ))}
            </ul>

            {premiumConfig.rulesText && (
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/80 text-xs text-amber-900 mb-4 leading-relaxed">
                <strong>Platform Terms:</strong> {premiumConfig.rulesText}
              </div>
            )}

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
              <p className="text-xs text-slate-600">
                100% Genuine Janakpur community platform. Handled with verified Nepal eSewa, Khalti, or Bank payment records.
              </p>
            </div>
          </div>

          {/* Payment & Request Form */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-2">
              Upgrade Your Account (Rs {premiumConfig.priceNPR || 200})
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Complete your payment using your preferred gateway below, enter the transaction code, and submit for verification.
            </p>

            {isPendingReview ? (
              <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  Your Request is Under Review
                </div>
                <p className="text-xs text-amber-800">
                  Payment of <strong>Rs {latestRequest?.amountNPR || 200}</strong> via {latestRequest?.paymentMethod} (Ref: {latestRequest?.transactionReference || 'Direct'}) was received on {latestRequest?.requestedAt ? new Date(latestRequest.requestedAt).toLocaleDateString() : 'recent'}.
                </p>
                <p className="text-xs text-slate-600">
                  Janakpur Admin verifies payments within 1 hour. You will see the Gold badge immediately once verified.
                </p>
              </div>
            ) : isRejected && !showResubmitForm ? (
              <div className="p-6 rounded-3xl bg-rose-50 border-2 border-rose-200 text-rose-950 space-y-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-rose-200">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold">
                      <XCircle className="w-5 h-5" />
                    </span>
                    <div>
                      <h4 className="font-extrabold text-sm text-rose-900 font-heading">
                        Premium Payment Status: Rejected
                      </h4>
                      <p className="text-[11px] text-rose-700">
                        Your submitted payment was reviewed and rejected by the Admin Desk.
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-200/80 text-rose-900 text-xs font-black uppercase">
                    Rejected
                  </span>
                </div>

                {/* Rejection Reason Box */}
                <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs space-y-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Reason for Rejection
                  </span>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900 leading-relaxed pl-1">
                    "{rejectionReasonText || 'Payment receipt or transaction reference could not be verified by Admin.'}"
                  </p>
                </div>

                {/* Request Details Grid */}
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-rose-100/50 text-xs border border-rose-200/60">
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">Reviewed Date & Time:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(latestRequest?.reviewedAt || (userProfile as any)?.reviewedAt || (userProfile as any)?.rejectionDate || latestRequest?.requestedAt || Date.now()).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">Payment Method:</span>
                    <span className="font-bold text-slate-900">
                      {latestRequest?.paymentMethod || (userProfile as any)?.rejectedPaymentMethod || 'Gateway Transfer'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">Amount Submitted:</span>
                    <span className="font-bold text-slate-900">
                      Rs {latestRequest?.amountNPR || (userProfile as any)?.rejectedAmountNPR || premiumConfig.priceNPR || 200}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 font-medium block text-[11px]">Transaction Reference:</span>
                    <span className="font-bold font-mono text-slate-900">
                      {latestRequest?.transactionReference || (userProfile as any)?.rejectedTransactionRef || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResubmitForm(true)}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Submit New Payment / Try Again
                  </button>
                  {onOpenChat && (
                    <button
                      type="button"
                      onClick={() => onOpenChat(`support_${currentUser.uid}`)}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-slate-200 transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      View Admin Message in Chat
                    </button>
                  )}
                </div>
              </div>
            ) : submittedSuccess ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-bold">Payment Request Submitted!</h4>
                <p className="text-xs text-emerald-800">
                  Our admin in Janakpur will verify your transaction reference and activate your Gold privileges promptly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpgrade} className="space-y-4">
                {isRejected && (
                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1 text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Previous Payment Was Rejected
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowResubmitForm(false)}
                        className="text-[11px] underline text-rose-700 hover:text-rose-900"
                      >
                        View Rejection Details
                      </button>
                    </div>
                    <p className="text-[11px] text-rose-800">
                      Reason: <em>"{rejectionReasonText}"</em>. Please submit a valid transaction code or updated screenshot.
                    </p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {errorMsg}
                  </div>
                )}

                {/* Dynamic Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Select Payment Gateway
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {activeMethods.map((m) => {
                      const isSelected = (currentMethod?.id === m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMethodId(m.id)}
                          className={`p-3 rounded-xl border text-xs font-bold transition-all text-center ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {m.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Payment Details & QR Box */}
                {currentMethod && (
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 text-xs text-slate-700">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                      <span className="font-extrabold text-slate-900 text-sm">
                        {currentMethod.name} Details
                      </span>
                      <span className="font-bold text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-md">
                        Pay Rs {premiumConfig.priceNPR || 200}
                      </span>
                    </div>

                    <div className="space-y-1.5 font-sans">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account / ID:</span>
                        <strong className="font-mono text-slate-900">{currentMethod.accountNumber}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Account Name:</span>
                        <strong className="text-slate-900">{currentMethod.accountHolder}</strong>
                      </div>
                      {currentMethod.bankName && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Bank Name:</span>
                          <strong className="text-slate-900">{currentMethod.bankName}</strong>
                        </div>
                      )}
                      {currentMethod.branch && (
                        <div className="flex justify-between">
                          <span className="text-slate-500">Branch:</span>
                          <span className="text-slate-800">{currentMethod.branch}</span>
                        </div>
                      )}
                    </div>

                    {/* QR Code Section */}
                    {currentMethod.qrCodeUrl && (
                      <div className="pt-2 text-center">
                        <div
                          onClick={() => setShowQrZoom(true)}
                          className="group relative inline-block p-2.5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer"
                          title="Click to enlarge QR Code"
                        >
                          <img
                            src={currentMethod.qrCodeUrl}
                            alt={`${currentMethod.name} QR Code`}
                            className="w-44 h-44 object-contain mx-auto rounded-xl group-hover:scale-102 transition-transform"
                            onError={(e) => {
                              (e.target as any).src =
                                'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
                                encodeURIComponent(currentMethod.accountNumber);
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/20 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-bold gap-1">
                            <QrCode className="w-4 h-4" />
                            <span>Click to Enlarge</span>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1.5">
                          <span className="text-[11px] text-slate-600 font-semibold">
                            Scan with your {currentMethod.name} app to pay Rs {premiumConfig.priceNPR || 200}
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowQrZoom(true)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                          >
                            Enlarge QR
                          </button>
                        </div>
                      </div>
                    )}

                    {currentMethod.instructions && (
                      <div className="p-2.5 rounded-xl bg-indigo-50/50 border border-indigo-100 text-indigo-900 text-[11px] leading-relaxed">
                        <strong>Instructions:</strong> {currentMethod.instructions}
                      </div>
                    )}

                    {currentMethod.notes && (
                      <p className="text-[11px] text-slate-500 italic">
                        {currentMethod.notes}
                      </p>
                    )}
                  </div>
                )}

                {/* Transaction Reference input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Transaction ID / Reference Code *
                  </label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    required
                    placeholder="e.g. 7X89412 or transfer remark / phone number"
                    className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
                  />
                </div>

                {/* Payment Receipt / Screenshot Upload */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Payment Screenshot / Receipt (Optional)</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Max 5 MB • JPG, PNG
                    </span>
                  </div>

                  {screenshotError && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{screenshotError}</span>
                    </div>
                  )}

                  <input
                    type="file"
                    ref={screenshotInputRef}
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleScreenshotSelect(f);
                      e.target.value = '';
                    }}
                  />

                  {screenshotPreviewUrl || proofUrl ? (
                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
                      <img
                        src={screenshotPreviewUrl || proofUrl}
                        alt="Receipt preview"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 p-0.5 bg-slate-50 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                          {uploadingScreenshot ? (
                            <div className="flex items-center gap-1.5 text-indigo-600">
                              <div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                              <span>Uploading screenshot...</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-emerald-700">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                {screenshotFile ? screenshotFile.name : 'Receipt Screenshot Attached'}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {screenshotFile
                            ? `${(screenshotFile.size / 1024).toFixed(1)} KB • Ready for verification`
                            : 'Receipt image attached'}
                        </p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <button
                            type="button"
                            disabled={uploadingScreenshot}
                            onClick={() => screenshotInputRef.current?.click()}
                            className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                          >
                            Replace
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            type="button"
                            disabled={uploadingScreenshot}
                            onClick={handleRemoveScreenshot}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => screenshotInputRef.current?.click()}
                      className="p-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 bg-slate-50/70 text-center cursor-pointer transition-all"
                    >
                      <Upload className="w-5 h-5 text-indigo-600 mx-auto mb-1" />
                      <p className="text-xs font-extrabold text-slate-800">
                        Upload Screenshot from Gallery / Files
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Attach your eSewa, Khalti, or mobile banking transaction success screen
                      </p>
                    </div>
                  )}

                  {/* Fallback image link input */}
                  <div className="pt-1">
                    <input
                      type="text"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="Or paste receipt image link (optional)"
                      className="w-full px-3 py-1.5 text-[11px] rounded-xl border border-slate-200 text-slate-600 outline-none focus:border-indigo-600 bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-md shadow-amber-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Crown className="w-4 h-4 fill-slate-950" />
                  {submitting
                    ? 'Submitting...'
                    : `Submit Payment for Verification (Rs ${premiumConfig.priceNPR || 200})`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* QR ZOOM MODAL FOR OWNERS */}
      {showQrZoom && currentMethod?.qrCodeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setShowQrZoom(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2 font-bold shadow-xs">
              <QrCode className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 font-heading">
              {currentMethod.name}
            </h4>
            <p className="text-xs text-amber-800 font-bold mb-3">
              Scan & Pay Rs {premiumConfig.priceNPR || 200}
            </p>
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
              <img
                src={currentMethod.qrCodeUrl}
                alt={`${currentMethod.name} QR Code`}
                className="w-64 h-64 object-contain mx-auto rounded-xl"
              />
            </div>
            <div className="space-y-1 mb-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Account:</span>
                <span className="font-mono font-bold text-slate-900">{currentMethod.accountNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Holder:</span>
                <span className="font-bold text-slate-900">{currentMethod.accountHolder}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQrZoom(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer"
            >
              Done Scanning
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
