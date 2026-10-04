import React, { useState } from 'react';
import {
  MapPin,
  Heart,
  Droplets,
  Zap,
  Wifi,
  GraduationCap,
  ShieldCheck,
  Crown,
  Eye,
  CheckCircle2,
  ArrowRight,
  MessageSquare
} from 'lucide-react';
import { RoomListing } from '../types';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { useContent } from '../context/ContentContext';

interface RoomCardProps {
  room: RoomListing;
  onSelect: (room: RoomListing) => void;
  onOpenAuth?: () => void;
  onOpenChat?: (conversationId: string) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onSelect, onOpenAuth, onOpenChat }) => {
  const { savedRoomIds, toggleSaveRoom } = useRooms();
  const { currentUser } = useAuth();
  const { startOrGetRoomConversation } = useChat();
  const { openViewer, openMenu } = useProfilePicture();
  const { isFeatureVisible } = useContent();
  const isSaved = savedRoomIds.includes(room.id);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [startingChat, setStartingChat] = useState(false);

  const photos = room.photos && room.photos.length > 0
    ? room.photos
    : ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=900&q=80'];

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    await toggleSaveRoom(room.id);
  };

  const handleMessageOwner = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      if (onOpenAuth) onOpenAuth();
      return;
    }
    if (currentUser.uid === room.ownerId) {
      alert('You are the owner of this room listing.');
      return;
    }
    setStartingChat(true);
    try {
      const convId = await startOrGetRoomConversation(room);
      if (onOpenChat) {
        onOpenChat(convId);
      }
    } catch (err: any) {
      alert(err.message || 'Could not open conversation with owner.');
    } finally {
      setStartingChat(false);
    }
  };

  const isRented = room.status === 'rented';

  return (
    <div
      id={`room-card-${room.id}`}
      onClick={() => onSelect(room)}
      className="group bg-white rounded-2xl border border-amber-200/90 mithila-card-shadow mithila-card-hover transition-all duration-200 overflow-hidden flex flex-col cursor-pointer relative"
    >
      {/* Decorative Mithila Top Accent Line */}
      <div className="h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 w-full shrink-0" />

      {/* Top Image Preview & Badges */}
      <div className="relative aspect-16/10 bg-amber-50/50 overflow-hidden">
        <img
          src={photos[activePhotoIdx]}
          alt={room.title}
          className={`w-full h-full object-cover group-hover:scale-103 transition-transform duration-300 ${
            isRented ? 'grayscale-40 contrast-75' : ''
          }`}
          loading="lazy"
        />

        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Status badge */}
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase tracking-wider backdrop-blur-md shadow-xs ${
                isRented
                  ? 'bg-rose-700/95 text-white'
                  : 'bg-emerald-700/95 text-white'
              }`}
            >
              {isRented ? 'Rented' : 'Available'}
            </span>

            {/* Premium Gold Badge */}
            {room.isOwnerPremium && isFeatureVisible('premium') && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-extrabold rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 backdrop-blur-md shadow-xs border border-amber-300">
                <Crown className="w-3 h-3 fill-stone-950" />
                Verified Gold
              </span>
            )}

            {room.isFeatured && (!room.isOwnerPremium || !isFeatureVisible('premium')) && (
              <span className="px-2 py-1 text-[11px] font-bold rounded-lg bg-orange-600/95 text-white backdrop-blur-md shadow-xs">
                Featured
              </span>
            )}
          </div>

          {/* Save / Bookmark Button */}
          {isFeatureVisible('favorites') && (
            <button
              id={`save-btn-${room.id}`}
              onClick={handleSave}
              title={isSaved ? 'Remove from saved' : 'Save room'}
              className="pointer-events-auto w-9 h-9 rounded-xl bg-white/95 hover:bg-white text-stone-700 hover:text-rose-600 shadow-md flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isSaved ? 'fill-rose-600 text-rose-600' : 'text-stone-700'
                }`}
              />
            </button>
          )}
        </div>

        {/* Bottom image stats */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between text-white text-xs font-medium pointer-events-none">
          <span className="px-2 py-0.5 rounded-md bg-black/45 backdrop-blur-xs font-semibold">
            {room.roomType} • {room.floor}
          </span>
          {photos.length > 1 && (
            <span className="px-1.5 py-0.5 rounded-md bg-black/45 backdrop-blur-xs text-[11px]">
              {photos.length} photos
            </span>
          )}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Chowk location */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900/80 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span className="truncate">{room.chowk}</span>
            {room.wardNumber && (
              <span className="text-stone-400 font-normal">({room.wardNumber})</span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-heading text-base font-bold text-stone-900 group-hover:text-orange-700 transition-colors line-clamp-1 mb-2">
            {room.title}
          </h3>

          {/* Key Facilities Badges */}
          <div className="flex flex-wrap items-center gap-1.5 mb-4">
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-sky-50 text-sky-800 border border-sky-200/80">
              <Droplets className="w-3 h-3 text-sky-600" />
              {room.waterFacility}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-amber-50 text-amber-900 border border-amber-200/80">
              <Zap className="w-3 h-3 text-amber-600" />
              {room.electricityFacility}
            </span>
            {room.wifiAvailable && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                <Wifi className="w-3 h-3 text-emerald-600" />
                Wi-Fi
              </span>
            )}
            {room.studentsAllowed && (
              <span className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md bg-orange-50 text-orange-900 border border-orange-200/80">
                <GraduationCap className="w-3 h-3 text-orange-600" />
                Students OK
              </span>
            )}
          </div>
        </div>

        {/* Footer: Price, Owner details, & Action Buttons */}
        <div className="pt-3 border-t border-amber-100 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-amber-900/70">NPR</span>
              <span className="text-lg font-black text-amber-950 font-heading">
                Rs {room.rentPerMonth.toLocaleString()}
              </span>
              <span className="text-[11px] font-medium text-stone-400">/mo</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
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
                  className="w-5 h-5 rounded-full object-cover bg-amber-50 border border-amber-200 group-hover:scale-110 transition-transform shadow-2xs"
                />
              </div>
              <p
                onClick={handleMessageOwner}
                className="text-[11px] text-stone-600 hover:text-orange-700 truncate max-w-[125px] cursor-pointer transition-colors"
                title="Click to message this owner"
              >
                <span className="font-bold underline decoration-amber-200 underline-offset-2 hover:decoration-orange-500">{room.ownerName || 'Verified Owner'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isFeatureVisible('chat') && (
              <button
                id={`message-owner-btn-${room.id}`}
                onClick={handleMessageOwner}
                disabled={startingChat}
                title="Chat directly with room owner"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-orange-600 via-amber-600 to-rose-600 hover:from-orange-700 hover:to-rose-700 disabled:opacity-50 rounded-xl transition-all shrink-0 shadow-xs cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{startingChat ? 'Opening...' : 'Message'}</span>
              </button>
            )}

            <button
              id={`view-details-btn-${room.id}`}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(room);
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-amber-950 bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 rounded-xl transition-colors shrink-0 cursor-pointer"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
