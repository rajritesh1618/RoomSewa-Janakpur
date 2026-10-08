import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Check, 
  Calendar, 
  User, 
  Sparkles,
  Share2,
  Tag
} from 'lucide-react';
import { RoomListing } from '../types';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

interface RoomDetailModalProps {
  room: RoomListing;
  onClose: () => void;
  onOpenAuth: () => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({ room, onClose, onOpenAuth }) => {
  const { currentUser } = useAuth();
  const { startInquiry } = useChat();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [inquiryText, setInquiryText] = useState(`Namaste, I am interested in your room: ${room.title}. Is it currently available for visit?`);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [inquirySent, setInquirySent] = useState(false);

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    setSendingInquiry(true);
    try {
      await startInquiry(room.id, room.title, room.ownerId, room.ownerName, inquiryText);
      setInquirySent(true);
      setTimeout(() => {
        setInquirySent(false);
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSendingInquiry(false);
    }
  };

  const images = room.images && room.images.length > 0 ? room.images : [
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden relative animate-fade-in my-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Image Gallery */}
        <div className="relative h-64 sm:h-80 bg-stone-900">
          <img
            src={images[activeImageIndex]}
            alt={room.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-3 py-1 rounded-full backdrop-blur">
            {room.chowk}
          </div>

          {room.isPremium && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Premium Verified</span>
            </div>
          )}

          {images.length > 1 && (
            <div className="absolute bottom-3 right-3 flex gap-1">
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    idx === activeImageIndex ? 'bg-amber-400 w-5' : 'bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 font-mithila">
                {room.title}
              </h2>
              <div className="flex items-center gap-1.5 text-stone-500 text-xs sm:text-sm mt-1">
                <MapPin className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{room.address}, {room.chowk}, Janakpurdham</span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <div className="text-2xl font-black text-rose-800">
                Rs. {room.rent.toLocaleString()}
                <span className="text-xs font-normal text-stone-500"> /month</span>
              </div>
              <div className={`text-xs font-semibold mt-0.5 ${room.available ? 'text-emerald-700' : 'text-stone-500'}`}>
                {room.available ? '● Available for Rent' : '○ Currently Occupied'}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Description</h3>
            <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-line">
              {room.description || 'Spacious and well-maintained room in a prime residential locality of Janakpurdham.'}
            </p>
          </div>

          {/* Facilities / Amenities */}
          {room.facilities && room.facilities.length > 0 && (
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2.5">
                Included Amenities &amp; Facilities
              </h3>
              <div className="flex flex-wrap gap-2">
                {room.facilities.map((fac, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-900 text-xs font-medium border border-amber-200"
                  >
                    <Check className="w-3.5 h-3.5 text-amber-600" />
                    <span>{fac}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Owner Info & Contact Actions */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="w-11 h-11 rounded-full bg-amber-200 text-amber-900 font-bold flex items-center justify-center shrink-0">
                {room.ownerName ? room.ownerName.charAt(0).toUpperCase() : 'O'}
              </div>
              <div>
                <p className="text-xs text-stone-500 font-medium">Property Listed By</p>
                <p className="font-bold text-stone-900 text-sm">{room.ownerName || 'Verified Owner'}</p>
                {/* Only display phone number if owner provided one */}
                {room.ownerPhone && (
                  <p className="text-xs text-stone-600 font-medium flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-600" />
                    <span>{room.ownerPhone}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* If owner provided mobile number, allow direct phone call / WhatsApp */}
              {room.ownerPhone ? (
                <a
                  href={`tel:${room.ownerPhone}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call Owner</span>
                </a>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  const elem = document.getElementById('inquiry-form');
                  elem?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Send Message</span>
              </button>
            </div>
          </div>

          {/* Inquiry form */}
          <div id="inquiry-form" className="pt-2">
            <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Direct Message to Owner</h3>
            {inquirySent ? (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-200 text-center">
                ✓ Inquiry message sent to owner! You can continue conversation from your Messages tab.
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-3">
                <textarea
                  rows={2}
                  value={inquiryText}
                  onChange={(e) => setInquiryText(e.target.value)}
                  className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
                  placeholder="Ask owner about availability, viewing time, or price..."
                />
                <button
                  type="submit"
                  disabled={sendingInquiry}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                >
                  {sendingInquiry ? 'Sending...' : 'Send Inquiry Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
