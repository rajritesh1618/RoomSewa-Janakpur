import React, { useEffect } from 'react';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { 
  Eye, 
  Camera, 
  X, 
  UploadCloud, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ShieldCheck,
  Crown,
  Maximize2
} from 'lucide-react';

export const ProfilePictureModals: React.FC = () => {
  const {
    isMenuOpen,
    closeMenu,
    isViewerOpen,
    closeViewer,
    isConfirmModalOpen,
    activeUser,
    selectedFile,
    previewUrl,
    fileError,
    isUploading,
    successMessage,
    openViewer,
    triggerFilePicker,
    confirmAndSave,
    cancelSelection,
    clearSuccessMessage
  } = useProfilePicture();

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isViewerOpen) closeViewer();
        else if (isMenuOpen) closeMenu();
        else if (isConfirmModalOpen && !isUploading) cancelSelection();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isViewerOpen, isMenuOpen, isConfirmModalOpen, isUploading, closeViewer, closeMenu, cancelSelection]);

  const targetPhotoUrl = activeUser?.photoURL || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user';
  const targetName = activeUser?.displayName || 'User Profile';
  const isSelf = activeUser?.isCurrentUser ?? true;

  return (
    <>
      {/* ---------------- Toast Notification ---------------- */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-200">
          <div className="bg-emerald-700 text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-600">
            <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
            <div>
              <p className="text-sm font-bold">{successMessage}</p>
              <p className="text-xs text-emerald-100">Updated across your account and listings.</p>
            </div>
            <button
              onClick={clearSuccessMessage}
              className="ml-2 text-emerald-200 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------- 1. Profile Picture Menu Modal ---------------- */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={closeMenu} />

          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Header with Photo Preview */}
            <div className="bg-gradient-to-br from-indigo-50 via-slate-50 to-indigo-100/50 p-6 text-center relative border-b border-slate-100">
              <button
                onClick={closeMenu}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 hover:bg-white/80 rounded-full transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative inline-block mx-auto mb-3">
                <img
                  src={targetPhotoUrl}
                  alt={targetName}
                  className="w-24 h-24 rounded-2xl object-cover shadow-md border-3 border-white bg-white mx-auto"
                />
                {activeUser?.role === 'admin' ? (
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 text-white rounded-xl shadow-xs" title="Admin">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                ) : activeUser?.role === 'owner' ? (
                  <div className="absolute -bottom-1 -right-1 p-1.5 bg-amber-500 text-white rounded-xl shadow-xs" title="Room Owner">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                ) : null}
              </div>

              <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                {targetName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeUser?.email || (isSelf ? 'Your Account' : 'Janakpur User')}
              </p>
            </div>

            {/* Menu Options */}
            <div className="p-4 space-y-2.5">
              {/* Option 1: See Profile Picture */}
              <button
                id="see-profile-picture-btn"
                type="button"
                onClick={() => openViewer(activeUser || undefined)}
                className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 font-semibold text-sm transition-all border border-slate-200/80 hover:border-indigo-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs group-hover:scale-105 transition-transform">
                  <Eye className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>1. See Profile Picture</span>
                    <Maximize2 className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                  </div>
                  <p className="text-xs text-slate-500 font-normal">
                    View photo in high-resolution full screen
                  </p>
                </div>
              </button>

              {/* Option 2: Change Profile Picture */}
              {isSelf && (
                <button
                  id="change-profile-picture-btn"
                  type="button"
                  onClick={triggerFilePicker}
                  className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl text-left bg-slate-50 hover:bg-indigo-50 text-slate-800 hover:text-indigo-700 font-semibold text-sm transition-all border border-slate-200/80 hover:border-indigo-200 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-xs group-hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center justify-between">
                      <span>2. Change Profile Picture</span>
                      <UploadCloud className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                    <p className="text-xs text-slate-500 font-normal">
                      Choose from gallery (max file size &lt; 2 MB)
                    </p>
                  </div>
                </button>
              )}
            </div>

            <div className="p-4 pt-0">
              <button
                type="button"
                onClick={closeMenu}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. See Profile Picture (Full-Screen / Larger View) ---------------- */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={closeViewer} />

          <div className="relative z-10 max-w-2xl w-full flex flex-col items-center">
            {/* Top Bar */}
            <div className="w-full flex items-center justify-between text-white pb-4 px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white border border-white/20">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg leading-tight">
                    {targetName}
                  </h3>
                  <p className="text-xs text-slate-300">
                    {activeUser?.role ? activeUser.role.toUpperCase() : 'USER PROFILE'} • ROOMSEWA JANAKPUR
                  </p>
                </div>
              </div>

              <button
                id="close-profile-viewer-btn"
                onClick={closeViewer}
                className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/20 transition-colors shadow-lg"
                title="Close full-screen preview"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo Container */}
            <div className="relative w-full max-w-lg aspect-square bg-slate-900 rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl flex items-center justify-center group">
              <img
                src={targetPhotoUrl}
                alt={targetName}
                className="w-full h-full object-contain sm:object-cover bg-slate-950"
              />

              {/* Photo watermark badge */}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-[11px] text-white/90 font-medium">
                RoomSewa Verified Profile
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="mt-5 flex items-center gap-3 w-full max-w-lg justify-center">
              {isSelf && (
                <button
                  type="button"
                  onClick={() => {
                    closeViewer();
                    triggerFilePicker();
                  }}
                  className="flex-1 py-3 px-5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all hover:shadow-indigo-500/25"
                >
                  <Camera className="w-4 h-4" />
                  Change Profile Picture
                </button>
              )}

              <button
                type="button"
                onClick={closeViewer}
                className="py-3 px-6 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-2xl border border-white/20 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. Change Profile Picture (Preview & Confirmation Dialog) ---------------- */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          {/* Backdrop Click (only when not actively uploading) */}
          <div
            className="absolute inset-0"
            onClick={() => {
              if (!isUploading) cancelSelection();
            }}
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 font-heading">
                  {fileError ? 'Invalid Profile Photo' : isUploading ? 'Updating Profile' : 'Confirm New Profile Picture'}
                </h3>
                <p className="text-xs text-slate-500">
                  {fileError ? 'Check file size & format' : isUploading ? 'Please wait a moment' : 'Preview before saving'}
                </p>
              </div>

              {!isUploading && (
                <button
                  onClick={cancelSelection}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5">
              {/* Error state */}
              {fileError ? (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3 text-red-800">
                  <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1 text-xs">
                    <p className="font-bold text-sm text-red-900">Upload Failed</p>
                    <p className="leading-relaxed">{fileError}</p>
                    <div className="pt-2 border-t border-red-200/60 mt-2">
                      <p className="font-semibold text-red-800">Photo Requirements:</p>
                      <ul className="list-disc pl-4 space-y-0.5 text-red-700">
                        <li>Maximum file size: <strong>strictly less than 2 MB</strong></li>
                        <li>Supported formats: JPG, PNG, WEBP, GIF</li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : previewUrl ? (
                <>
                  {/* Photo Preview Stage */}
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      {/* Round Avatar Preview */}
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-36 h-36 rounded-full object-cover border-4 border-indigo-600 shadow-xl bg-slate-100"
                      />
                      <div className="absolute bottom-1 right-1 p-2 bg-indigo-600 text-white rounded-full shadow-md">
                        <Camera className="w-4 h-4" />
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-700">
                      How your profile picture will appear to seekers & owners
                    </p>

                    {/* Metadata pill */}
                    {selectedFile && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full text-xs text-slate-600 font-medium">
                        <span className="truncate max-w-[150px]">{selectedFile.name}</span>
                        <span>•</span>
                        <span className="text-emerald-700 font-bold">
                          {(selectedFile.size / 1024).toFixed(0)} KB (under 2 MB limit)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Context Info */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-xs text-slate-600 space-y-1">
                    <p className="font-bold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Automatic Sync Everywhere
                    </p>
                    <p>
                      This photo will immediately update your User Profile, Chat Messages, Owner/Seeker badges, and Admin Support desk.
                    </p>
                  </div>
                </>
              ) : null}

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                {fileError ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={triggerFilePicker}
                      className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Choose Another Photo
                    </button>
                    <button
                      type="button"
                      onClick={cancelSelection}
                      className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      id="confirm-upload-photo-btn"
                      type="button"
                      disabled={isUploading}
                      onClick={confirmAndSave}
                      className="w-full py-3.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Uploading…</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Confirm & Save Profile Picture</span>
                        </>
                      )}
                    </button>

                    {!isUploading && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={triggerFilePicker}
                          className="flex-1 py-2.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                        >
                          Choose Different Photo
                        </button>
                        <button
                          type="button"
                          onClick={cancelSelection}
                          className="py-2.5 px-4 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
