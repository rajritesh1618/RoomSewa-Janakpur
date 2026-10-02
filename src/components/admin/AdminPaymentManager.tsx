import React, { useState, useRef, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  QrCode,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  Building2,
  Upload,
  AlertCircle,
  X,
  FileCheck,
  Maximize2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { PaymentMethodConfig } from '../../types';
import {
  validatePaymentQrFile,
  uploadPaymentQrImage,
  deletePaymentQrFromStorage,
  MAX_QR_IMAGE_BYTES
} from '../../utils/paymentQrStorage';
import {
  isValidNepalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../../utils/nepalPhone';
import { NepalPhoneInput } from '../common/NepalPhoneInput';

export const AdminPaymentManager: React.FC = () => {
  const {
    paymentMethods,
    addPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    resetPaymentMethods
  } = useContent();

  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [previewQrModal, setPreviewQrModal] = useState<{ url: string; name: string } | null>(null);

  // Quick Direct QR Upload modal state (uploading directly for a specific method)
  const [quickUploadMethod, setQuickUploadMethod] = useState<PaymentMethodConfig | null>(null);
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickPreviewUrl, setQuickPreviewUrl] = useState<string | null>(null);
  const [quickError, setQuickError] = useState<string | null>(null);
  const [isQuickUploading, setIsQuickUploading] = useState(false);
  const quickFileInputRef = useRef<HTMLInputElement>(null);

  // Add/Edit Form state
  const [name, setName] = useState('');
  const [code, setCode] = useState<PaymentMethodConfig['code']>('custom');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branch, setBranch] = useState('');
  const [instructions, setInstructions] = useState('');
  const [notes, setNotes] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [visible, setVisible] = useState(true);

  // Form QR File Upload state
  const [formQrFile, setFormQrFile] = useState<File | null>(null);
  const [formQrPreviewUrl, setFormQrPreviewUrl] = useState<string | null>(null);
  const [existingQrUrl, setExistingQrUrl] = useState<string>('');
  const [existingStoragePath, setExistingStoragePath] = useState<string>('');
  const [formQrError, setFormQrError] = useState<string | null>(null);
  const [isFormUploading, setIsFormUploading] = useState(false);
  const formFileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (formQrPreviewUrl && formQrPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(formQrPreviewUrl);
      }
      if (quickPreviewUrl && quickPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(quickPreviewUrl);
      }
    };
  }, [formQrPreviewUrl, quickPreviewUrl]);

  const handleOpenAdd = () => {
    setEditingMethod(null);
    setName('');
    setCode('custom');
    setAccountNumber('');
    setAccountHolder('RoomSewa Janakpur Official');
    setPhoneNumber('+977 ');
    setBankName('');
    setBranch('');
    setInstructions('');
    setNotes('');
    setEnabled(true);
    setVisible(true);

    // Reset QR state
    setFormQrFile(null);
    setFormQrPreviewUrl(null);
    setExistingQrUrl('');
    setExistingStoragePath('');
    setFormQrError(null);

    setShowModal(true);
  };

  const handleOpenEdit = (m: PaymentMethodConfig) => {
    setEditingMethod(m);
    setName(m.name);
    setCode(m.code);
    setAccountNumber(m.accountNumber);
    setAccountHolder(m.accountHolder);
    setPhoneNumber(m.phoneNumber || '');
    setBankName(m.bankName || '');
    setBranch(m.branch || '');
    setInstructions(m.instructions || '');
    setNotes(m.notes || '');
    setEnabled(m.enabled);
    setVisible(m.visible);

    // Set QR state
    setFormQrFile(null);
    setFormQrPreviewUrl(null);
    setExistingQrUrl(m.qrCodeUrl || '');
    setExistingStoragePath(m.qrCodeStoragePath || '');
    setFormQrError(null);

    setShowModal(true);
  };

  // Open Direct Quick QR Upload modal
  const handleOpenQuickUpload = (m: PaymentMethodConfig) => {
    setQuickUploadMethod(m);
    setQuickFile(null);
    setQuickPreviewUrl(null);
    setQuickError(null);
  };

  const handleQuickFileSelect = (file: File) => {
    setQuickError(null);
    const validation = validatePaymentQrFile(file);
    if (!validation.valid) {
      setQuickError(validation.error || 'Invalid image file.');
      return;
    }

    if (quickPreviewUrl && quickPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(quickPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setQuickFile(file);
    setQuickPreviewUrl(preview);
  };

  const handleSaveQuickUpload = async () => {
    if (!quickUploadMethod || !quickFile) return;

    setIsQuickUploading(true);
    setQuickError(null);

    try {
      // 1. Upload to Firebase Storage
      const { downloadUrl, storagePath } = await uploadPaymentQrImage(
        quickFile,
        quickUploadMethod.code,
        quickUploadMethod.name
      );

      // 2. Clean up old storage file if different
      if (quickUploadMethod.qrCodeStoragePath && quickUploadMethod.qrCodeStoragePath !== storagePath) {
        deletePaymentQrFromStorage(quickUploadMethod.qrCodeStoragePath).catch(() => {});
      }

      // 3. Save new URL in Firestore
      await updatePaymentMethod(quickUploadMethod.id, {
        qrCodeUrl: downloadUrl,
        qrCodeStoragePath: storagePath
      });

      setFeedbackMsg({
        type: 'success',
        text: `QR code for "${quickUploadMethod.name}" uploaded to Firebase Storage successfully!`
      });
      setQuickUploadMethod(null);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Quick QR upload error:', err);
      setQuickError(err.message || 'Failed to upload QR code. Please try again.');
    } finally {
      setIsQuickUploading(false);
    }
  };

  const handleFormFileSelect = (file: File) => {
    setFormQrError(null);
    const validation = validatePaymentQrFile(file);
    if (!validation.valid) {
      setFormQrError(validation.error || 'Invalid image file.');
      return;
    }

    if (formQrPreviewUrl && formQrPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formQrPreviewUrl);
    }

    const preview = URL.createObjectURL(file);
    setFormQrFile(file);
    setFormQrPreviewUrl(preview);
  };

  const handleRemoveFormQr = () => {
    if (formQrPreviewUrl && formQrPreviewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(formQrPreviewUrl);
    }
    setFormQrFile(null);
    setFormQrPreviewUrl(null);
    setExistingQrUrl('');
    setFormQrError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !accountNumber.trim()) return;

    if (code === 'esewa' || code === 'khalti') {
      if (!isValidNepalMobile(accountNumber)) {
        setFormQrError(`For ${name || (code === 'esewa' ? 'eSewa' : 'Khalti')}, mobile number must be valid Nepal mobile starting with 98 or 97. ${NEPAL_PHONE_ERROR_MESSAGE}`);
        return;
      }
    }

    setIsFormUploading(true);
    setFormQrError(null);

    try {
      let finalQrUrl = existingQrUrl;
      let finalStoragePath = existingStoragePath;

      // 1. If a new file was chosen, upload it to Firebase Storage
      if (formQrFile) {
        const uploadRes = await uploadPaymentQrImage(formQrFile, code, name.trim());
        finalQrUrl = uploadRes.downloadUrl;
        finalStoragePath = uploadRes.storagePath;

        // Clean up previous storage file if it exists
        if (existingStoragePath && existingStoragePath !== finalStoragePath) {
          deletePaymentQrFromStorage(existingStoragePath).catch(() => {});
        }
      }

      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, {
          name: name.trim(),
          code,
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          phoneNumber: phoneNumber.trim(),
          bankName: bankName.trim(),
          branch: branch.trim(),
          qrCodeUrl: finalQrUrl.trim(),
          qrCodeStoragePath: finalStoragePath,
          instructions: instructions.trim(),
          notes: notes.trim(),
          enabled,
          visible
        });
        setFeedbackMsg({
          type: 'success',
          text: `Payment method "${name}" updated successfully with QR code.`
        });
      } else {
        await addPaymentMethod({
          name: name.trim(),
          code,
          accountNumber: accountNumber.trim(),
          accountHolder: accountHolder.trim(),
          phoneNumber: phoneNumber.trim(),
          bankName: bankName.trim(),
          branch: branch.trim(),
          qrCodeUrl: finalQrUrl.trim(),
          qrCodeStoragePath: finalStoragePath,
          instructions: instructions.trim(),
          notes: notes.trim(),
          order: paymentMethods.length + 1,
          enabled,
          visible
        });
        setFeedbackMsg({
          type: 'success',
          text: `Payment gateway "${name}" added successfully with QR code.`
        });
      }
      setShowModal(false);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (err: any) {
      console.error('Save payment method error:', err);
      setFormQrError(err.message || 'Failed to save payment gateway.');
    } finally {
      setIsFormUploading(false);
    }
  };

  const handleToggleEnabled = async (m: PaymentMethodConfig) => {
    try {
      await updatePaymentMethod(m.id, { enabled: !m.enabled });
      setFeedbackMsg({
        type: 'success',
        text: `"${m.name}" is now ${!m.enabled ? 'Enabled' : 'Disabled'}.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update payment status.' });
    }
  };

  const handleToggleVisible = async (m: PaymentMethodConfig) => {
    try {
      await updatePaymentMethod(m.id, { visible: !m.visible });
      setFeedbackMsg({
        type: 'success',
        text: `"${m.name}" is now ${!m.visible ? 'Visible' : 'Hidden'} for users.`
      });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to update visibility.' });
    }
  };

  const handleDelete = async (m: PaymentMethodConfig) => {
    if (confirm(`Are you sure you want to delete payment method "${m.name}"?`)) {
      try {
        if (m.qrCodeStoragePath) {
          deletePaymentQrFromStorage(m.qrCodeStoragePath).catch(() => {});
        }
        await deletePaymentMethod(m.id);
        setFeedbackMsg({ type: 'success', text: `Payment method "${m.name}" deleted.` });
        setTimeout(() => setFeedbackMsg(null), 3000);
      } catch {
        setFeedbackMsg({ type: 'error', text: 'Failed to delete payment gateway.' });
      }
    }
  };

  const handleReset = async () => {
    try {
      await resetPaymentMethods();
      setShowResetConfirm(false);
      setFeedbackMsg({ type: 'success', text: 'Payment gateways reset to default.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Failed to reset payment gateways.' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <CreditCard className="w-3.5 h-3.5" />
              <span>Section 10 • Payment Gateways & QR Codes</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-heading tracking-tight">
              Payment Methods & Official QR Codes
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Upload official QR codes directly from your device gallery or local files. QR codes are stored securely in Firebase Storage and displayed to room owners when purchasing Premium.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleOpenAdd}
              className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
          </div>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
              : 'bg-rose-50 text-rose-900 border border-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Methods List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map((method) => {
          const isEsewa = method.code === 'esewa';
          const isKhalti = method.code === 'khalti';
          const isBank = method.code === 'bank';

          return (
            <div
              key={method.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                !method.enabled || !method.visible
                  ? 'bg-slate-50 border-dashed border-slate-300 opacity-80'
                  : 'bg-white border-slate-200 shadow-sm hover:shadow-md'
              }`}
            >
              <div>
                {/* Method Header Badge */}
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs shadow-xs ${
                        isEsewa
                          ? 'bg-emerald-500 text-white'
                          : isKhalti
                          ? 'bg-purple-600 text-white'
                          : isBank
                          ? 'bg-blue-600 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isBank ? <Building2 className="w-5 h-5" /> : method.name[0]}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 font-heading">
                        {method.name}
                      </h3>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        Gateway: {method.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(method)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                      title="Edit gateway & details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(method)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Delete method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Account Details Box */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Account / Phone:</span>
                    <span className="font-mono font-bold text-slate-900">{method.accountNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Holder Name:</span>
                    <span className="font-bold text-slate-900">{method.accountHolder}</span>
                  </div>
                  {method.bankName && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Bank Name:</span>
                      <span className="font-bold text-slate-900">{method.bankName}</span>
                    </div>
                  )}
                  {method.branch && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Branch:</span>
                      <span className="text-slate-700">{method.branch}</span>
                    </div>
                  )}
                </div>

                {/* QR Code Section with Direct Upload & Preview */}
                <div className="mb-4">
                  {method.qrCodeUrl ? (
                    <div className="p-3 rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => setPreviewQrModal({ url: method.qrCodeUrl!, name: method.name })}
                          className="relative group cursor-pointer shrink-0"
                          title="Click to view large QR"
                        >
                          <img
                            src={method.qrCodeUrl}
                            alt={`${method.name} QR`}
                            className="w-14 h-14 rounded-xl object-contain border border-slate-100 p-1 bg-white group-hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              (e.target as any).src =
                                'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' +
                                encodeURIComponent(method.accountNumber);
                            }}
                          />
                          <div className="absolute inset-0 bg-slate-950/30 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                            <Maximize2 className="w-3.5 h-3.5" />
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                            <span>QR Code Active</span>
                          </div>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {method.qrCodeStoragePath ? 'Stored in Firebase Storage' : 'Configured QR Image'}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenQuickUpload(method)}
                              className="text-[11px] font-extrabold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3 h-3" />
                              <span>Replace QR</span>
                            </button>
                            <span className="text-slate-300">•</span>
                            <button
                              type="button"
                              onClick={() => setPreviewQrModal({ url: method.qrCodeUrl!, name: method.name })}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 cursor-pointer"
                            >
                              View Large
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-2xl bg-amber-50/60 border border-dashed border-amber-300 text-center">
                      <QrCode className="w-6 h-6 text-amber-600 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-amber-900 mb-0.5">
                        No QR Code Uploaded
                      </p>
                      <p className="text-[10px] text-amber-700 mb-2.5">
                        Upload your {method.name} scan QR from your device gallery.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenQuickUpload(method)}
                        className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload QR Code</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Instructions snippet */}
                {method.instructions && (
                  <div className="text-[11px] text-slate-500 line-clamp-2 italic mb-4 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                    "{method.instructions}"
                  </div>
                )}
              </div>

              {/* Toggles Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleToggleEnabled(method)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    method.enabled
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  {method.enabled ? (
                    <>
                      <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                      Active
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-3.5 h-3.5 text-rose-600" />
                      Disabled
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleToggleVisible(method)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    method.visible
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
                      : 'bg-slate-200 text-slate-700 border border-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {method.visible ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-indigo-600" />
                      Visible to Landlords
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                      Hidden
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* QUICK DIRECT QR UPLOAD MODAL */}
      {quickUploadMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 font-heading">
                    Upload QR Code
                  </h3>
                  <p className="text-xs text-slate-500">
                    {quickUploadMethod.name} ({quickUploadMethod.code})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setQuickUploadMethod(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {quickError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{quickError}</span>
              </div>
            )}

            {/* Hidden file input */}
            <input
              type="file"
              ref={quickFileInputRef}
              accept="image/png, image/jpeg, image/jpg, image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleQuickFileSelect(f);
                e.target.value = '';
              }}
            />

            {/* Drop / Upload Zone */}
            <div
              onClick={() => quickFileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) handleQuickFileSelect(f);
              }}
              className={`p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                quickFile
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/20 bg-slate-50/60'
              }`}
            >
              {quickPreviewUrl ? (
                <div className="space-y-3">
                  <div className="relative inline-block bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
                    <img
                      src={quickPreviewUrl}
                      alt="Selected QR Preview"
                      className="w-44 h-44 object-contain mx-auto rounded-xl"
                    />
                    <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-xs">
                      Preview Ready
                    </span>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 truncate max-w-xs mx-auto">
                      {quickFile?.name}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {quickFile ? `${(quickFile.size / 1024).toFixed(1)} KB` : ''} • Ready for Firebase Storage
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      quickFileInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-indigo-600 text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    Change Selected File
                  </button>
                </div>
              ) : (
                <div className="space-y-2 py-2">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-extrabold text-slate-800">
                    Click to choose from Gallery or Local Files
                  </p>
                  <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                    Select a QR screenshot or photo of your {quickUploadMethod.name} barcode
                  </p>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/70 text-slate-700 text-[10px] font-bold">
                    <span>Supports JPG, JPEG, PNG, WEBP (Max 5 MB)</span>
                  </div>
                </div>
              )}
            </div>

            {/* Current Active QR comparison if exists */}
            {quickUploadMethod.qrCodeUrl && !quickPreviewUrl && (
              <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
                <img
                  src={quickUploadMethod.qrCodeUrl}
                  alt="Current QR"
                  className="w-12 h-12 object-contain rounded-xl bg-white p-1 border border-slate-200"
                />
                <div className="text-xs">
                  <p className="font-bold text-slate-800">Current Active QR</p>
                  <p className="text-[11px] text-slate-500">
                    Uploading a new image will replace this QR code for all owners.
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setQuickUploadMethod(null)}
                disabled={isQuickUploading}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveQuickUpload}
                disabled={!quickFile || isQuickUploading}
                className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
              >
                {isQuickUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Uploading to Storage...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload & Save QR</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ADD / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 my-8 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 font-heading">
                  {editingMethod ? `Edit: ${editingMethod.name}` : 'Add Payment Gateway'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure account numbers and upload official payment QR code.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formQrError && (
              <div className="p-3 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formQrError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gateway Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. eSewa Mobile Wallet"
                    required
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Gateway Type / Code
                  </label>
                  <select
                    value={code}
                    onChange={(e) => setCode(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 outline-none bg-white font-medium"
                  >
                    <option value="esewa">eSewa</option>
                    <option value="khalti">Khalti</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="custom">Custom Gateway</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {code === 'esewa' || code === 'khalti' ? (
                  <div>
                    <NepalPhoneInput
                      value={accountNumber}
                      onChange={(_full, localDigits) => {
                        setAccountNumber(localDigits);
                        setPhoneNumber(localDigits ? formatFullNepalMobile(localDigits) : '');
                      }}
                      label={`${code === 'esewa' ? 'eSewa' : 'Khalti'} Mobile ID`}
                      required
                      id="gateway-phone-number"
                      error={accountNumber && !isValidNepalMobile(accountNumber) ? NEPAL_PHONE_ERROR_MESSAGE : null}
                      helperText="Fixed +977 prefix, exactly 10 digits starting with 98 or 97."
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Account / Identifier *
                    </label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g. 01201017500123"
                      required
                      className="w-full px-3.5 py-2.5 text-xs font-mono font-bold rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Account Holder Name *
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. RoomSewa Janakpur"
                    required
                    className="w-full px-3.5 py-2.5 text-xs font-bold rounded-xl border border-slate-200 focus:border-emerald-600 outline-none"
                  />
                </div>
              </div>

              {/* Bank-specific fields */}
              {(code === 'bank' || bankName) && (
                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Nepal Bank Limited"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                      Branch
                    </label>
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="e.g. Janakpur Main Branch"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              )}

              {/* OFFICIAL QR CODE IMAGE UPLOAD (FIREBASE STORAGE) */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Upload Official QR Code (Firebase Storage)</span>
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Max 5 MB • JPG, PNG
                  </span>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={formFileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFormFileSelect(f);
                    e.target.value = '';
                  }}
                />

                {/* Preview Box or Upload Prompt */}
                {formQrPreviewUrl || existingQrUrl ? (
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white border border-slate-200">
                    <div className="relative group shrink-0">
                      <img
                        src={formQrPreviewUrl || existingQrUrl}
                        alt="QR Code"
                        className="w-20 h-20 rounded-xl object-contain border border-slate-100 p-1 bg-white shadow-2xs"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1 text-xs font-extrabold text-slate-800">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">
                          {formQrFile ? formQrFile.name : 'Configured QR Image'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {formQrFile
                          ? `${(formQrFile.size / 1024).toFixed(1)} KB (New file to be uploaded)`
                          : 'Currently active on Owner Payment Page'}
                      </p>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => formFileInputRef.current?.click()}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors cursor-pointer"
                        >
                          Replace Photo
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveFormQr}
                          className="px-2.5 py-1 text-xs font-bold rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => formFileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files?.[0];
                      if (f) handleFormFileSelect(f);
                    }}
                    className="p-5 rounded-2xl border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/20 bg-white text-center cursor-pointer transition-all"
                  >
                    <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                    <p className="text-xs font-extrabold text-slate-800">
                      Choose QR image from Device Gallery / Local Files
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Upload your official {name || code} barcode or QR screenshot (JPG, JPEG, PNG up to 5 MB)
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Payment Instructions (Step-by-step for Landlord)
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={2}
                  placeholder="1. Open app... 2. Scan QR or transfer... 3. Enter transaction ID..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-emerald-600 outline-none resize-none font-sans"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => setEnabled(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Enabled (Active)</span>
                </label>

                <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={visible}
                    onChange={(e) => setVisible(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Visible to Users</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={isFormUploading}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    isFormUploading ||
                    ((code === 'esewa' || code === 'khalti') && !isValidNepalMobile(accountNumber)) ||
                    !name.trim() ||
                    !accountNumber.trim() ||
                    !accountHolder.trim()
                  }
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white shadow-md shadow-emerald-600/30 flex items-center gap-2 cursor-pointer"
                >
                  {isFormUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading QR to Storage...</span>
                    </>
                  ) : (
                    <span>{editingMethod ? 'Save Changes' : 'Create Payment Method'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR PREVIEW LARGE MODAL */}
      {previewQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl relative">
            <button
              onClick={() => setPreviewQrModal(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-extrabold text-slate-900 mb-1 font-heading">
              {previewQrModal.name} Official QR
            </h4>
            <p className="text-[11px] text-slate-500 mb-4">
              Stored in Firebase Storage • Scannable by eSewa, Khalti, or Mobile Banking
            </p>
            <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-inner mb-4">
              <img
                src={previewQrModal.url}
                alt="QR Code"
                className="w-64 h-64 object-contain mx-auto"
              />
            </div>
            <button
              onClick={() => setPreviewQrModal(null)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close Preview
            </button>
          </div>
        </div>
      )}

      {/* Reset Confirmation */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading">
              Reset Payment Gateways to Default?
            </h3>
            <p className="text-xs text-slate-600 mt-2 mb-6 leading-relaxed">
              This will restore standard eSewa, Khalti, and Nepal Bank configurations.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md cursor-pointer"
              >
                Yes, Reset Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
