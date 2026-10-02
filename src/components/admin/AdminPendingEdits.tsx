import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Edit,
  Eye,
  AlertCircle,
  Clock,
  MapPin,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  X,
  FileText,
  User,
  Phone,
  Sparkles,
  Layers,
  Zap,
  Droplets
} from 'lucide-react';
import { RoomListing, ChowkLocation, RoomFeature } from '../../types';
import { useProfilePicture } from '../../context/ProfilePictureContext';

interface AdminPendingEditsProps {
  pendingEditRooms: RoomListing[];
  chowks: ChowkLocation[];
  features: RoomFeature[];
  onApproveEdit: (roomId: string) => Promise<void>;
  onRejectEdit: (roomId: string, reason: string) => Promise<void>;
  onSelectRoom: (room: RoomListing) => void;
  onOpenChatWithUser?: (userId: string, userName: string) => void;
}

export const AdminPendingEdits: React.FC<AdminPendingEditsProps> = ({
  pendingEditRooms,
  chowks,
  features,
  onApproveEdit,
  onRejectEdit,
  onSelectRoom,
  onOpenChatWithUser
}) => {
  const { openViewer } = useProfilePicture();
  const [selectedRoom, setSelectedRoom] = useState<RoomListing | null>(null);
  const [rejectingRoom, setRejectingRoom] = useState<RoomListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const REJECT_EDIT_TEMPLATES = [
    'Proposed rent change requires updated tenancy terms or owner verification.',
    'Please maintain accurate utility details (electricity per unit or water schedule).',
    'Uploaded photos do not match property room layout.',
    'Room occupancy type or rules modification violates rental policies.'
  ];

  const handleApprove = async (room: RoomListing) => {
    setSubmittingAction(true);
    try {
      await onApproveEdit(room.id);
      showToast('success', `Proposed changes for "${room.title}" approved and published live!`);
      if (selectedRoom?.id === room.id) setSelectedRoom(null);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve room edits.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingRoom) return;
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectionError('Rejection reason is required so the owner understands why their edit was not accepted.');
      return;
    }

    setSubmittingAction(true);
    try {
      await onRejectEdit(rejectingRoom.id, cleanReason);
      showToast('success', `Proposed edits rejected. Existing approved version remains live for seekers.`);
      if (selectedRoom?.id === rejectingRoom.id) setSelectedRoom(null);
      setRejectingRoom(null);
      setRejectionReason('');
    } catch (err: any) {
      setRejectionError(err.message || 'Failed to reject edits.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Helper to nicely format values in diff
  const formatDiffValue = (key: string, val: any): React.ReactNode => {
    if (val === undefined || val === null) return <span className="text-slate-400 italic">None</span>;
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    if (key === 'rentPerMonth') return `Rs ${Number(val).toLocaleString()}`;
    if (key === 'electricityChargePerUnit') return `NPR ${val} / unit`;
    if (key === 'photos' && Array.isArray(val)) {
      return (
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {val.slice(0, 4).map((p: string, i: number) => (
            <img key={i} src={p} alt="" className="w-10 h-8 rounded object-cover border border-slate-200" />
          ))}
          {val.length > 4 && <span className="text-[10px] text-slate-500 font-bold">+{val.length - 4} more</span>}
        </div>
      );
    }
    if (Array.isArray(val)) {
      return (
        <div className="flex flex-wrap gap-1">
          {val.map((item, idx) => (
            <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
            </span>
          ))}
        </div>
      );
    }
    if (typeof val === 'object') {
      return <pre className="text-[10px] font-mono whitespace-pre-wrap">{JSON.stringify(val, null, 2)}</pre>;
    }
    return String(val);
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs border ${
            toast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            {toast.message}
          </div>
          <button
            onClick={() => setToast(null)}
            className="text-xs font-extrabold opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Edit className="w-3 h-3 text-indigo-600" />
              Pending Changes
            </span>
            <span className="text-xs font-bold text-slate-500">
              {pendingEditRooms.length} modification{pendingEditRooms.length === 1 ? '' : 's'} awaiting review
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading mt-1">
            Owner Edits on Approved Listings
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare <strong>Current Approved Version</strong> vs. <strong>Owner's New Changes</strong>. The public listing continues displaying the approved version until you approve or reject these edits.
          </p>
        </div>
      </div>

      {/* Pending Edits List */}
      {pendingEditRooms.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h3 className="font-bold text-base text-slate-700">No pending room edits!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            All submitted room edits have been reviewed. When owners update any details of their approved listings, they will appear here for comparison and approval.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingEditRooms.map((room) => {
            const pending = room.pendingEdit;
            const changedKeys = pending?.changedFieldKeys || [];

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5 sm:p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        room.photos?.[0] ||
                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={room.title}
                      className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {changedKeys.length > 0 ? `${changedKeys.length} fields modified` : 'Edits proposed'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">ID: {room.id.slice(0, 8)}</span>
                      </div>
                      <h4 className="font-bold text-sm sm:text-base text-slate-900 mt-0.5">{room.title}</h4>
                      <p className="text-xs text-slate-500">
                        Chowk: {room.chowk} • Owner: {room.ownerName} ({room.ownerPhone}) • Submitted:{' '}
                        {room.lastEditSubmittedAt ? new Date(room.lastEditSubmittedAt).toLocaleString() : 'Recent'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setSelectedRoom(room)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Compare Changes
                    </button>

                    <button
                      onClick={() => {
                        setRejectingRoom(room);
                        setRejectionReason('');
                        setRejectionError('');
                      }}
                      className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
                    >
                      Reject
                    </button>

                    <button
                      onClick={() => handleApprove(room)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-2xs"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                </div>

                {/* Quick preview of changed fields */}
                {pending && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                    {Object.entries(pending).map(([key, newVal]) => {
                      if (['submittedAt', 'submittedBy', 'submittedByName', 'submittedByEmail', 'changedFieldKeys', 'previousValues'].includes(key)) {
                        return null;
                      }
                      const oldVal = (room as any)[key];
                      if (JSON.stringify(oldVal) === JSON.stringify(newVal)) return null;

                      return (
                        <div key={key} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                          <span className="font-bold text-[10px] uppercase text-slate-400 block mb-1">
                            {key}
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-[11px]">
                            <div className="text-rose-700 bg-rose-50/70 p-1.5 rounded-lg border border-rose-100">
                              <span className="text-[9px] font-bold uppercase block text-rose-400">Current</span>
                              <span className="truncate block font-semibold">{formatDiffValue(key, oldVal)}</span>
                            </div>
                            <div className="text-emerald-700 bg-emerald-50/70 p-1.5 rounded-lg border border-emerald-100">
                              <span className="text-[9px] font-bold uppercase block text-emerald-400">Proposed</span>
                              <span className="truncate block font-semibold">{formatDiffValue(key, newVal)}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED COMPARISON MODAL (CURRENT APPROVED VERSION vs OWNER'S NEW CHANGES) */}
      {selectedRoom && selectedRoom.pendingEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-4xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-extrabold uppercase">
                  Pending Edit Comparison
                </span>
                <h3 className="font-bold text-base text-slate-900 font-heading mt-1">
                  Comparing Changes for "{selectedRoom.title}"
                </h3>
                <p className="text-xs text-slate-500">
                  Owner: {selectedRoom.ownerName} • Submitted:{' '}
                  {selectedRoom.lastEditSubmittedAt ? new Date(selectedRoom.lastEditSubmittedAt).toLocaleString() : 'Recent'}
                </p>
              </div>

              <button
                onClick={() => setSelectedRoom(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comparison Table / Diff Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/70 rounded-xl text-xs text-indigo-950 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  <strong>Safety Rule:</strong> Seekers currently see the <strong>Current Approved Version</strong>. Changes will only become live once you click <strong>Approve Changes</strong>.
                </span>
              </div>

              {/* Side-by-Side Comparison Header */}
              <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 px-3 py-1 bg-slate-100 rounded-xl">
                <div className="col-span-3">Field</div>
                <div className="col-span-4 text-rose-700">Current Approved Version</div>
                <div className="col-span-1 text-center text-slate-400">→</div>
                <div className="col-span-4 text-emerald-700">Owner's New Changes</div>
              </div>

              {/* Comparison Rows */}
              <div className="space-y-3">
                {Object.entries(selectedRoom.pendingEdit).map(([key, newVal]) => {
                  if (['submittedAt', 'submittedBy', 'submittedByName', 'submittedByEmail', 'changedFieldKeys', 'previousValues'].includes(key)) {
                    return null;
                  }
                  const oldVal = (selectedRoom as any)[key];
                  const isDifferent = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                  if (!isDifferent) return null;

                  return (
                    <div
                      key={key}
                      className="grid grid-cols-12 gap-3 p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 transition-colors items-center"
                    >
                      <div className="col-span-3">
                        <span className="font-bold text-xs text-slate-900 block">{key}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">modified</span>
                      </div>

                      <div className="col-span-4 p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-rose-950 text-xs">
                        {formatDiffValue(key, oldVal)}
                      </div>

                      <div className="col-span-1 flex items-center justify-center text-indigo-500 font-bold">
                        <ArrowRight className="w-4 h-4" />
                      </div>

                      <div className="col-span-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-950 text-xs font-semibold">
                        {formatDiffValue(key, newVal)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedRoom(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingRoom(selectedRoom);
                    setRejectionReason('');
                    setRejectionError('');
                  }}
                  disabled={submittingAction}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Changes
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(selectedRoom)}
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve Changes & Publish Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL FOR EDITS */}
      {rejectingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-heading">
                    Reject Changes for "{rejectingRoom.title}"
                  </h3>
                  <p className="text-[11px] text-slate-500">The previously approved version will remain live.</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingRoom(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-950">
                <strong>Notice:</strong> When you reject changes, the previously approved room listing remains publicly visible to seekers without disruption. The owner will receive this rejection reason.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Quick Select Rejection Reason:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {REJECT_EDIT_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRejectionReason(tmpl);
                        setRejectionError('');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 border border-slate-200 text-left transition-colors"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rejection Reason <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    if (rejectionError) setRejectionError('');
                  }}
                  placeholder="Explain why these proposed changes were rejected..."
                  className={`w-full p-3 text-xs rounded-xl border outline-none bg-slate-50/50 ${
                    rejectionError ? 'border-rose-500 ring-1 ring-rose-200' : 'border-slate-200 focus:border-rose-600'
                  }`}
                />
                {rejectionError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {rejectionError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setRejectingRoom(null)}
                disabled={submittingAction}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submittingAction}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                Reject Changes & Notify Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
