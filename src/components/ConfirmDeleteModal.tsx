import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  roomTitle: string;
  isDeleting: boolean;
  isAdmin?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  roomTitle,
  isDeleting,
  isAdmin = false,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150 relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <Trash2 className="w-7 h-7 text-rose-600" />
        </div>

        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-black uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Permanent Deletion</span>
          </div>

          <h3 className="text-lg sm:text-xl font-black font-heading text-slate-900 mb-2">
            Delete Room Listing?
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 mb-4 leading-relaxed">
            Are you sure you want to permanently delete:
            <span className="block font-bold text-slate-900 mt-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs break-words">
              "{roomTitle}"
            </span>
          </p>

          <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mb-6 text-left">
            ⚠️ <strong>Warning:</strong> This listing will be immediately removed from search results, chowk directories, and saved lists. {isAdmin ? 'As an Admin, this will remove the room from the platform.' : 'You will not be able to recover this listing.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs sm:text-sm font-bold hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Delete Permanently</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
