import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Heart,
  Droplets,
  Zap,
  Wifi,
  GraduationCap,
  Home,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Send,
  Share2,
  Calendar,
  Layers,
  Sparkles,
  ShieldCheck,
  Crown,
  MessageSquare,
  Eye,
  Camera,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Trash2
} from 'lucide-react';
import { RoomListing } from '../types';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { useContent } from '../context/ContentContext';
import { DynamicFeaturesView } from './DynamicFeaturesView';
import { InteractiveRoomMap } from './InteractiveRoomMap';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';

interface RoomDetailModalProps {
  room: RoomListing | null;
  onClose: () => void;
  onOpenAuth?: (mode?: 'login' | 'signup') => void;
  onOpenChat?: (conversationId: string) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, onClose, onOpenAuth, onOpenChat }) => {
  const { savedRoomIds, toggleSaveRoom, submitInquiry, deleteRoom } = useRooms();
  const { currentUser, userProfile, isAdmin } = useAuth();
  const { startOrGetRoomConversation } = useChat();
  const { openViewer, openMenu } = useProfilePicture();
  const { isFeatureVisible, features } = useContent();
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [inquiryMessage, setInquiryMessage] = useState(
    'Namaste! I am interested in this room in Janakpur. Is it currently available for viewing?'
  );
  const [submittingInquiry, setSubmittingInquiry] = useState(false);
  const [startingChat, setStartingChat] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = Boolean(currentUser && room && room.ownerId === currentUser.uid);
  const isOwnerOrAdmin = Boolean(currentUser && (isOwner || isAdmin || userProfile?.role === 'admin'));

  // Reset photo index and success state whenever room changes
  useEffect(() => {
    setSelectedPhoto(0);
    setInquirySuccess(false);
  }, [room?.id]);

  // Keyboard navigation for carousel
  useEffect(() => {
    if (!room) return;
    const photoCount = room.photos && room.photos.length > 0 ? room.photos.length : 1;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        setSelectedPhoto((prev) => (prev > 0 ? prev - 1 : photoCount - 1));
      } else if (e.key === 'ArrowRight') {
        setSelectedPhoto((prev) => (prev < photoCount - 1 ? prev + 1 : 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [room]);

  if (!room) return null;

  const isSaved = savedRoomIds.includes(room.id);
  const photos = room.photos && room.photos.length > 0 ? room.photos : [
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80'
  ];

  const handleSendInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    setSubmittingInquiry(true);
    try {
      await submitInquiry(room.id, inquiryMessage);
      if (currentUser.uid !== room.ownerId) {
        await startOrGetRoomConversation(room, inquiryMessage);
      }
      setInquirySuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to send inquiry');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleStartMessageOwner = async () => {
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth('login');
      return;
    }
    if (currentUser.uid === room.ownerId) {
      alert('You are the owner of this room listing.');
      return;
    }

    setStartingChat(true);
    try {
      const convId = await startOrGetRoomConversation(room, inquiryMessage);
      onClose();
      if (onOpenChat) {
        onOpenChat(convId);
      }
    } catch (err: any) {
      alert(err.message || 'Could not start conversation with owner');
    } finally {
      setStartingChat(false);
    }
  };

  const copyPhone = () => {
    navigator.clipboard.writeText(room.ownerPhone || '9844012345');
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handlePrevPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPhoto((prev) => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedPhoto((prev) => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div
        id="room-detail-modal"
        className="relative bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden my-auto"
      >
        {/* Top Header Bar */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
              {room.roomType}
            </span>
            <span
              className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                room.status === 'rented'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}
            >
              {room.status === 'rented' ? 'Rented' : 'Available'}
            </span>
            {room.isOwnerPremium && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-md bg-amber-100 text-amber-900">
                <Crown className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                Verified Gold Owner
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isOwnerOrAdmin && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-2xs"
                title={isOwner ? 'Delete my room listing' : 'Admin: Delete this room listing'}
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span className="hidden sm:inline">Delete</span>
              </button>
            )}
            <button
              onClick={() => toggleSaveRoom(room.id)}
              className={`p-2 rounded-xl border transition-colors ${
                isSaved
                  ? 'border-rose-200 bg-rose-50 text-rose-600'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
              title="Save room"
            >
              <Heart className={`w-5 h-5 ${isSaved ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              id="close-room-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          {/* Horizontal Image Carousel */}
          <div className="space-y-3">
            <div className="relative aspect-16/9 sm:aspect-21/9 rounded-3xl overflow-hidden bg-slate-950 shadow-lg group">
              <img
                src={photos[selectedPhoto]}
                alt={`${room.title} - Photo ${selectedPhoto + 1}`}
                className="w-full h-full object-cover transition-opacity duration-300 cursor-pointer"
                onClick={() =>
                  openViewer({
                    photoURL: photos[selectedPhoto],
                    displayName: `${room.title} (Photo ${selectedPhoto + 1} of ${photos.length})`
                  })
                }
              />

              {/* Gradient overlays for controls readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

              {/* Prev & Next Carousel Buttons */}
              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={handlePrevPhoto}
                    aria-label="Previous photo"
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNextPhoto}
                    aria-label="Next photo"
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 hover:opacity-100 hover:scale-105 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Top Controls: Zoom / Enlarge */}
              <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openViewer({
                      photoURL: photos[selectedPhoto],
                      displayName: `${room.title} (Photo ${selectedPhoto + 1} of ${photos.length})`
                    })
                  }
                  className="px-3 py-1.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white text-xs font-bold backdrop-blur-md flex items-center gap-1.5 transition-all shadow-sm"
                  title="Click to view full screen"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Enlarge</span>
                </button>
              </div>

              {/* Bottom Info: Counter Pill & Indicators */}
              <div className="absolute bottom-3.5 left-4 right-4 flex items-center justify-between pointer-events-none">
                <div className="px-3 py-1 rounded-full bg-slate-900/70 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-indigo-400" />
                  <span>
                    Photo {selectedPhoto + 1} of {photos.length}
                  </span>
                </div>

                {/* Dot Indicators */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-1.5 pointer-events-auto">
                    {photos.map((_, dotIdx) => (
                      <button
                        key={dotIdx}
                        type="button"
                        onClick={() => setSelectedPhoto(dotIdx)}
                        aria-label={`Go to photo ${dotIdx + 1}`}
                        className={`transition-all rounded-full ${
                          selectedPhoto === dotIdx
                            ? 'w-6 h-2 bg-white shadow-sm'
                            : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Horizontal Carousel Thumbnail Strip */}
            {photos.length > 1 && (
              <div className="relative">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                  {photos.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedPhoto(idx)}
                      className={`relative w-20 sm:w-24 h-14 sm:h-16 rounded-2xl overflow-hidden shrink-0 border-2 transition-all group ${
                        selectedPhoto === idx
                          ? 'border-indigo-600 ring-2 ring-indigo-200 scale-102 shadow-sm'
                          : 'border-slate-200/90 opacity-70 hover:opacity-100 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={p}
                        alt={`thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      {selectedPhoto === idx && (
                        <div className="absolute inset-0 bg-indigo-600/10 pointer-events-none" />
                      )}
                      <span className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded-md bg-black/60 text-white text-[9px] font-bold">
                        {idx + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Title & Key Pricing Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-500 mb-1">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{room.chowk}</span>
                {room.wardNumber && <span>• {room.wardNumber}</span>}
                {room.addressLine && <span>• {room.addressLine}</span>}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                {room.title}
              </h1>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 shrink-0 text-right md:min-w-[190px]">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                Monthly Rent
              </span>
              <div className="text-2xl sm:text-3xl font-black text-indigo-700 font-heading">
                Rs {room.rentPerMonth.toLocaleString()}
              </div>
              <span className="text-xs font-medium text-slate-500">
                {room.negotiable ? 'Negotiable with owner' : 'Fixed Price'}
              </span>
            </div>
          </div>

          {/* Key Specifications Grid */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">
              Room Facilities & Details
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Droplets className="w-4 h-4 text-sky-500" />
                  Water Supply
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.waterFacility}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  Electricity
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.electricityChargePerUnit
                    ? `NPR ${room.electricityChargePerUnit} per unit`
                    : room.electricityFacility || 'Separate Meter'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Wifi className="w-4 h-4 text-emerald-500" />
                  Wi-Fi Internet
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.wifiAvailable ? 'Included / Available' : 'Not Included'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <GraduationCap className="w-4 h-4 text-indigo-500" />
                  Students Policy
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.studentsAllowed ? 'Allowed & Welcome' : 'Families/Employees Only'}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Layers className="w-4 h-4 text-slate-500" />
                  Floor
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.floor}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mb-1">
                  <Home className="w-4 h-4 text-slate-500" />
                  Attached Bathroom
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {room.attachedBathroom ? 'Yes (Private)' : 'Common / Shared'}
                </div>
              </div>
            </div>
          </div>

          {/* Dynamic Specifications Configured by Admin Builder */}
          {room.customFeatures && Object.keys(room.customFeatures).length > 0 && (
            <div className="pt-1">
              <DynamicFeaturesView features={features} customFeatures={room.customFeatures} />
            </div>
          )}

          {/* Description & Rules */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                Room Description
              </h3>
              <p className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-line bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
                {room.description || 'No additional description provided.'}
              </p>
            </div>

            {room.rulesAndDetails && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2">
                  House Rules & Guidelines
                </h3>
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200/60 text-slate-800 text-sm leading-relaxed">
                  {room.rulesAndDetails}
                </div>
              </div>
            )}
          </div>

          {/* Interactive Map Preview with Gemini AI Coordinates */}
          <div className="pt-2">
            <InteractiveRoomMap room={room} />
          </div>

          {/* Owner Details & Direct Contact */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              {/* Clickable Owner Photo */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentUser && currentUser.uid === room.ownerId) {
                    openMenu();
                  } else {
                    openViewer({
                      uid: room.ownerId,
                      displayName: room.ownerName,
                      photoURL: room.ownerPhoto,
                      role: 'owner'
                    });
                  }
                }}
                className="relative cursor-pointer group shrink-0"
                title={
                  currentUser && currentUser.uid === room.ownerId
                    ? 'Click to see or change your profile picture'
                    : `Click to view ${room.ownerName}'s profile photo`
                }
              >
                <img
                  src={
                    room.ownerPhoto ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${room.ownerId}`
                  }
                  alt={room.ownerName}
                  className="w-14 h-14 rounded-2xl object-cover bg-slate-800 border-2 border-slate-700 group-hover:border-indigo-400 group-hover:scale-105 transition-all shadow-md"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity">
                  {currentUser && currentUser.uid === room.ownerId ? (
                    <Camera className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </div>
              </div>

              <div
                onClick={isFeatureVisible('chat') ? handleStartMessageOwner : undefined}
                className={`group/owner transition-opacity ${isFeatureVisible('chat') ? 'cursor-pointer hover:opacity-95' : ''}`}
                title={isFeatureVisible('chat') ? 'Click to chat with owner' : undefined}
              >
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold font-heading group-hover/owner:text-indigo-300 transition-colors">{room.ownerName}</h4>
                  {room.isOwnerPremium && isFeatureVisible('premium') && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                      <Crown className="w-3 h-3 fill-slate-950" />
                      Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Owner in Janakpur</p>
                {isFeatureVisible('owner_contact') && (
                  <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-mono">
                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                    {room.ownerPhone || '+977 9844012345'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {isFeatureVisible('chat') && (
                <button
                  type="button"
                  id="modal-message-owner-btn"
                  onClick={handleStartMessageOwner}
                  disabled={startingChat}
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{startingChat ? 'Opening Chat...' : 'Message Owner'}</span>
                </button>
              )}

              {isFeatureVisible('owner_contact') && (
                <>
                  <a
                    href={`tel:${room.ownerPhone || '9844012345'}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                  >
                    <Phone className="w-4 h-4" />
                    Call Owner
                  </a>

                  <button
                    onClick={copyPhone}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-semibold transition-colors border border-slate-700"
                  >
                    {copiedPhone ? 'Copied!' : 'Copy Number'}
                  </button>
                </>
              )}

              {isFeatureVisible('whatsapp') && (
                <a
                  href={`https://wa.me/${(room.ownerWhatsapp || room.ownerPhone || '9844012345').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Namaste ${room.ownerName}, I found your room listing "${room.title}" on RoomSewa Janakpur. Is it still available?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>

          {/* Quick Inquiry Form */}
          {isFeatureVisible('chat') && (
            <div className="p-5 sm:p-6 rounded-2xl bg-indigo-50/50 border border-indigo-100">
              <h4 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Send Direct Message to Owner
              </h4>
              <p className="text-xs text-slate-600 mb-4">
                Your contact details will be shared with the room owner to schedule a room visit in Janakpur.
              </p>

              {inquirySuccess ? (
                <div className="p-4 rounded-xl bg-emerald-100 text-emerald-900 text-sm font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>Inquiry sent! A private conversation has been initiated with the owner.</span>
                  </div>
                  {onOpenChat && currentUser && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenChat(`room_${room.id}_${currentUser.uid}`);
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shrink-0 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Open Chat
                    </button>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSendInquiry} className="space-y-3">
                  <textarea
                    value={inquiryMessage}
                    onChange={(e) => setInquiryMessage(e.target.value)}
                    rows={2}
                    required
                    placeholder="Ask a question or specify when you want to visit..."
                    className="w-full px-3.5 py-2.5 text-sm bg-white rounded-xl border border-indigo-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-slate-800"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {currentUser ? `Sending as ${currentUser.displayName || currentUser.email}` : 'Sign in to send inquiry'}
                    </span>
                    <button
                      type="submit"
                      disabled={submittingInquiry}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
                    >
                      <Send className="w-4 h-4" />
                      {submittingInquiry ? 'Sending...' : 'Send Inquiry'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Room Deletion Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={showDeleteConfirm}
        roomTitle={room.title}
        isDeleting={isDeleting}
        isAdmin={Boolean(isAdmin || userProfile?.role === 'admin')}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={async () => {
          setIsDeleting(true);
          try {
            await deleteRoom(room.id);
            setShowDeleteConfirm(false);
            onClose();
          } catch (err: any) {
            alert(err?.message || 'Failed to delete room listing.');
            setShowDeleteConfirm(false);
          } finally {
            setIsDeleting(false);
          }
        }}
      />
    </div>
  );
};
