import React, { useState } from 'react';
import {
  CheckCircle,
  XCircle,
  Eye,
  Building2,
  MapPin,
  DollarSign,
  Phone,
  Mail,
  Calendar,
  Clock,
  Zap,
  Droplets,
  ShieldCheck,
  AlertTriangle,
  Crown,
  Search,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  X,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { RoomListing, ChowkLocation, RoomFeature } from '../../types';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { DynamicFeaturesView } from '../DynamicFeaturesView';

interface AdminPendingListingsProps {
  pendingRooms: RoomListing[];
  chowks: ChowkLocation[];
  features: RoomFeature[];
  onApprove: (roomId: string) => Promise<void>;
  onReject: (roomId: string, reason: string) => Promise<void>;
  onSelectRoom: (room: RoomListing) => void;
  onOpenChatWithUser?: (userId: string, userName: string) => void;
}

export const AdminPendingListings: React.FC<AdminPendingListingsProps> = ({
  pendingRooms,
  chowks,
  features,
  onApprove,
  onReject,
  onSelectRoom,
  onOpenChatWithUser
}) => {
  const { openViewer } = useProfilePicture();
  const [searchTerm, setSearchTerm] = useState('');
  const [inspectingRoom, setInspectingRoom] = useState<RoomListing | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  // Rejection Modal State
  const [rejectingRoom, setRejectingRoom] = useState<RoomListing | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);

  // Quick action feedback
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const REJECTION_TEMPLATES = [
    'Please upload clearer and authentic photos of the room and amenities.',
    'Electricity charge per unit information is missing or unclear.',
    'Water availability schedule and source details need clarification.',
    'The specified chowk or landmark address appears inaccurate.',
    'Provided owner contact phone number appears unreachable or invalid.',
    'Monthly rent details or additional service charges require clarification.'
  ];

  const filteredPending = pendingRooms.filter((r) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.chowk.toLowerCase().includes(q) ||
      r.ownerName.toLowerCase().includes(q) ||
      (r.ownerPhone && r.ownerPhone.includes(q)) ||
      (r.landmark && r.landmark.toLowerCase().includes(q)) ||
      (r.roomType && r.roomType.toLowerCase().includes(q))
    );
  });

  const handleApprove = async (room: RoomListing) => {
    setSubmittingAction(true);
    try {
      await onApprove(room.id);
      showToast('success', `Room "${room.title}" approved and published live!`);
      if (inspectingRoom?.id === room.id) {
        setInspectingRoom(null);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Failed to approve room listing.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleStartReject = (room: RoomListing) => {
    setRejectingRoom(room);
    setRejectionReason('');
    setRejectionError('');
  };

  const handleConfirmReject = async () => {
    if (!rejectingRoom) return;
    const cleanReason = rejectionReason.trim();
    if (!cleanReason) {
      setRejectionError('Rejection reason is required. Please provide a clear explanation for the owner.');
      return;
    }

    setSubmittingAction(true);
    try {
      await onReject(rejectingRoom.id, cleanReason);
      showToast('success', `Listing "${rejectingRoom.title}" rejected. Reason sent to owner.`);
      if (inspectingRoom?.id === rejectingRoom.id) {
        setInspectingRoom(null);
      }
      setRejectingRoom(null);
      setRejectionReason('');
    } catch (err: any) {
      setRejectionError(err.message || 'Failed to reject listing.');
    } finally {
      setSubmittingAction(false);
    }
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
            <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-600" />
              Pending Approvals
            </span>
            <span className="text-xs font-bold text-slate-500">
              {pendingRooms.length} listing{pendingRooms.length === 1 ? '' : 's'} awaiting review
            </span>
          </div>
          <h2 className="text-lg font-bold text-slate-900 font-heading mt-1">
            New Room Listings Waiting for Approval
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review room photos, rent, mandatory electricity per unit, water availability, and owner details before publishing.
          </p>
        </div>

        {/* Search */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search pending rooms..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-600"
          />
        </div>
      </div>

      {/* Listings List */}
      {pendingRooms.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
          <h3 className="font-bold text-base text-slate-700">All listings reviewed!</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            There are currently no new room listings waiting for admin approval. When owners submit new rooms, they will appear here immediately.
          </p>
        </div>
      ) : filteredPending.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
          <p className="font-bold text-slate-700 text-sm">No pending rooms match your search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPending.map((room) => {
            const coverPhoto =
              room.photos && room.photos.length > 0
                ? room.photos[0]
                : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={room.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Photo with zoom and status badge */}
                  <div className="relative aspect-16/10 bg-slate-100 overflow-hidden group">
                    <img
                      src={coverPhoto}
                      alt={room.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      onClick={() => openViewer({ photoURL: coverPhoto, displayName: room.title })}
                    />
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between pointer-events-none">
                      <span className="px-2.5 py-1 rounded-full bg-amber-500 text-white text-[10px] font-extrabold uppercase shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pending Approval
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-950/70 text-white text-[10px] font-bold backdrop-blur-xs">
                        {room.photos?.length || 1} photo{room.photos?.length === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white pointer-events-none">
                      <span className="text-xs font-black drop-shadow-md">
                        Rs {room.rentPerMonth.toLocaleString()} / mo
                      </span>
                      <span className="text-[10px] font-bold bg-indigo-600/90 px-2 py-0.5 rounded backdrop-blur-xs">
                        {room.roomType || 'Room'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-3">
                    <div>
                      <h3
                        onClick={() => {
                          setInspectingRoom(room);
                          setActivePhotoIndex(0);
                        }}
                        className="font-bold text-slate-900 text-sm line-clamp-1 hover:text-indigo-600 cursor-pointer"
                      >
                        {room.title}
                      </h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{room.chowk}</span>
                        {room.landmark && <span>• {room.landmark}</span>}
                      </p>
                    </div>

                    {/* Key Specifications Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-100/70">
                        <span className="text-[9px] font-bold text-amber-800 uppercase block flex items-center gap-1">
                          <Zap className="w-2.5 h-2.5 text-amber-600" />
                          Electricity
                        </span>
                        <span className="font-extrabold text-amber-950">
                          {room.electricityChargePerUnit
                            ? `NPR ${room.electricityChargePerUnit} / unit`
                            : 'NPR 15 / unit'}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-sky-50/70 border border-sky-100/70">
                        <span className="text-[9px] font-bold text-sky-800 uppercase block flex items-center gap-1">
                          <Droplets className="w-2.5 h-2.5 text-sky-600" />
                          Water
                        </span>
                        <span className="font-extrabold text-sky-950 truncate block">
                          {room.waterTimeSlots && room.waterTimeSlots.length > 0
                            ? `${room.waterTimeSlots.length} schedule period${room.waterTimeSlots.length === 1 ? '' : 's'}`
                            : '24 Hours'}
                        </span>
                      </div>
                    </div>

                    {/* Owner Info Box */}
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 truncate">{room.ownerName}</span>
                          {room.isOwnerPremium && (
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono">{room.ownerPhone}</p>
                      </div>

                      {onOpenChatWithUser && (
                        <button
                          onClick={() => onOpenChatWithUser(room.ownerId, room.ownerName)}
                          title="Message Owner"
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-indigo-600"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setInspectingRoom(room);
                      setActivePhotoIndex(0);
                    }}
                    className="flex-1 py-2 px-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Inspect Details
                  </button>

                  <button
                    onClick={() => handleStartReject(room)}
                    disabled={submittingAction}
                    className="py-2 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center justify-center gap-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>

                  <button
                    onClick={() => handleApprove(room)}
                    disabled={submittingAction}
                    className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INSPECTION MODAL */}
      {inspectingRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase">
                  Pending Review
                </span>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 font-heading truncate max-w-md">
                  {inspectingRoom.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingRoom(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
              {/* Photo Carousel / Preview */}
              <div>
                <div className="aspect-16/9 bg-slate-900 rounded-2xl overflow-hidden relative">
                  <img
                    src={
                      inspectingRoom.photos?.[activePhotoIndex] ||
                      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
                    }
                    alt={inspectingRoom.title}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() =>
                      openViewer({
                        photoURL: inspectingRoom.photos?.[activePhotoIndex] || '',
                        displayName: inspectingRoom.title
                      })
                    }
                  />
                  <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-white text-[11px] font-bold">
                    {activePhotoIndex + 1} / {inspectingRoom.photos?.length || 1}
                  </div>
                </div>

                {/* Thumbnails */}
                {inspectingRoom.photos && inspectingRoom.photos.length > 1 && (
                  <div className="flex items-center gap-2 mt-2.5 overflow-x-auto pb-1">
                    {inspectingRoom.photos.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`w-14 h-12 rounded-lg overflow-hidden border-2 shrink-0 ${
                          activePhotoIndex === idx
                            ? 'border-indigo-600 ring-2 ring-indigo-200'
                            : 'border-slate-200 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={p} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Core Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Monthly Rent</span>
                  <span className="font-extrabold text-indigo-700 text-sm">
                    Rs {inspectingRoom.rentPerMonth.toLocaleString()}
                  </span>
                  {inspectingRoom.negotiable && (
                    <span className="text-[9px] text-slate-500 block">Negotiable</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Chowk Location</span>
                  <span className="font-bold text-slate-800">{inspectingRoom.chowk}</span>
                  <span className="text-[10px] text-slate-500 truncate block">
                    {inspectingRoom.landmark || 'Janakpur'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Room Type & Floor</span>
                  <span className="font-bold text-slate-800">{inspectingRoom.roomType}</span>
                  <span className="text-[10px] text-slate-500 block">{inspectingRoom.floor}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Preferred For</span>
                  <span className="font-bold text-slate-800">{inspectingRoom.roomFor || 'Anyone'}</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    {inspectingRoom.bestFor || 'Students / Family'}
                  </span>
                </div>
              </div>

              {/* Utility Specifications (Electricity & Water) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Mandatory Utilities & Rules
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <span className="text-[10px] font-bold text-amber-800 uppercase block">Electricity Charge</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      NPR {inspectingRoom.electricityChargePerUnit || 15} per unit
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <span className="text-[10px] font-bold text-sky-800 uppercase block">Water Availability</span>
                    <p className="font-extrabold text-slate-900 mt-0.5">
                      {inspectingRoom.waterTimeSlots && inspectingRoom.waterTimeSlots.length > 0 ? (
                        <span>
                          {inspectingRoom.waterTimeSlots
                            .map((s) => `${s.from} – ${s.to}`)
                            .join(', ')}
                        </span>
                      ) : (
                        '24 Hours Available'
                      )}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">Water Source</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {inspectingRoom.waterSource || 'Tap Only'}
                      {inspectingRoom.waterSourceCustom ? ` (${inspectingRoom.waterSourceCustom})` : ''}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-white border border-amber-200/70">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block">Gate Closing Time</span>
                    <p className="font-bold text-slate-900 mt-0.5">
                      {inspectingRoom.gateClosingTime || 'No Fixed Closing Time'}
                    </p>
                  </div>
                </div>

                {inspectingRoom.rules && inspectingRoom.rules.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1">House Rules</span>
                    <div className="flex flex-wrap gap-1.5">
                      {inspectingRoom.rules.map((rule, rIdx) => (
                        <span
                          key={rIdx}
                          className="px-2.5 py-1 rounded-lg bg-white border border-amber-200 text-[11px] font-medium text-slate-800"
                        >
                          ✓ {rule}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Dynamic Features View */}
              {inspectingRoom.customFeatures && Object.keys(inspectingRoom.customFeatures).length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    Additional Feature Builder Specifications
                  </h4>
                  <DynamicFeaturesView
                    features={features}
                    customFeatures={inspectingRoom.customFeatures}
                  />
                </div>
              )}

              {/* Description */}
              {inspectingRoom.description && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Description</h4>
                  <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {inspectingRoom.description}
                  </p>
                </div>
              )}

              {/* Owner Profile Card */}
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] font-bold text-indigo-800 uppercase block">Submitted By Owner</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="font-extrabold text-slate-900 text-sm">{inspectingRoom.ownerName}</span>
                    {inspectingRoom.isOwnerPremium && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-extrabold flex items-center gap-1">
                        <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                        Gold Verified
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 font-mono mt-0.5">
                    Phone: {inspectingRoom.ownerPhone} • Email: {inspectingRoom.ownerEmail || 'N/A'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectRoom(inspectingRoom)}
                  className="px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 font-bold text-xs hover:bg-indigo-50"
                >
                  Full Modal View
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setInspectingRoom(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleStartReject(inspectingRoom)}
                  disabled={submittingAction}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-700 text-xs font-bold flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Listing
                </button>

                <button
                  type="button"
                  onClick={() => handleApprove(inspectingRoom)}
                  disabled={submittingAction}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve & Publish Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL (REQUIRED REASON BEFORE REJECTION) */}
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
                    Reject Listing: {rejectingRoom.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">Owner: {rejectingRoom.ownerName}</p>
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
              <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-xs text-rose-900">
                <strong>Mandatory Requirement:</strong> Provide a clear rejection reason. This message is automatically sent to the owner so they know exactly what needs to be fixed.
              </div>

              {/* Quick Template Reasons */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Quick Select Common Reasons:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                  {REJECTION_TEMPLATES.map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setRejectionReason(tmpl);
                        setRejectionError('');
                      }}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 text-left transition-colors"
                    >
                      {tmpl}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Textarea */}
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
                  placeholder="Enter detailed reason for rejecting this room listing (e.g., Please upload clearer room photos)..."
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

            {/* Modal Action Buttons */}
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
                Confirm Rejection & Notify Owner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
