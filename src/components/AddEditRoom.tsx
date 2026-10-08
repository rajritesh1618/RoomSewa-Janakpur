import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Image as ImageIcon, 
  Check, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useRooms } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { RoomListing } from '../types';

interface AddEditRoomProps {
  initialRoom?: RoomListing | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const CHOWKS = [
  'Janaki Mandir',
  'Bhanu Chowk',
  'Ramanand Chowk',
  'Shiva Chowk',
  'Murali Chowk',
  'Pidari Chowk',
  'Mills Area',
  'Station Road',
  'Brahmapuri',
  'Kadam Chowk'
];

export const AddEditRoom: React.FC<AddEditRoomProps> = ({ initialRoom, onCancel, onSuccess }) => {
  const { addRoom, updateRoom } = useRooms();
  const { currentUser, userProfile } = useAuth();
  const { activeFeatures } = useContent();

  const [title, setTitle] = useState(initialRoom?.title || '');
  const [description, setDescription] = useState(initialRoom?.description || '');
  const [chowk, setChowk] = useState(initialRoom?.chowk || CHOWKS[0]);
  const [address, setAddress] = useState(initialRoom?.address || '');
  const [rent, setRent] = useState<number>(initialRoom?.rent || 6000);
  const [roomType, setRoomType] = useState<RoomListing['roomType']>(initialRoom?.roomType || 'single');
  // Phone is pre-filled from user profile if present, but optional
  const [ownerPhone, setOwnerPhone] = useState(initialRoom?.ownerPhone || userProfile?.phone || '');
  const [facilities, setFacilities] = useState<string[]>(initialRoom?.facilities || []);
  const [imageUrl, setImageUrl] = useState(initialRoom?.images?.[0] || '');
  const [loading, setLoading] = useState(false);

  const toggleFacility = (name: string) => {
    setFacilities(prev => 
      prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setLoading(true);
    try {
      const roomPayload = {
        title: title.trim(),
        description: description.trim(),
        chowk,
        address: address.trim(),
        rent: Number(rent),
        roomType,
        available: true,
        facilities,
        images: imageUrl ? [imageUrl.trim()] : [
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'
        ],
        ownerId: currentUser.uid,
        ownerName: userProfile?.name || currentUser.displayName || 'Property Owner',
        ownerPhone: ownerPhone.trim() ? ownerPhone.trim() : undefined,
        isPremium: initialRoom?.isPremium || false
      };

      if (initialRoom) {
        await updateRoom(initialRoom.id, roomPayload);
      } else {
        await addRoom(roomPayload);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-stone-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-stone-100 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-mithila">
              {initialRoom ? 'Edit Room Listing' : 'Post New Room in Janakpur'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Fill in property specifications to connect with verified seekers
            </p>
          </div>

          <button
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Listing Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunny 1BHK Flat near Ramanand Chowk"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Chowk Location</label>
              <select
                value={chowk}
                onChange={(e) => setChowk(e.target.value)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                {CHOWKS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value as any)}
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              >
                <option value="single">Single Room</option>
                <option value="double">Double Room</option>
                <option value="1bhk">1 BHK Flat</option>
                <option value="2bhk">2 BHK Flat</option>
                <option value="flat">Full Flat / House</option>
                <option value="commercial">Commercial Space</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Exact Street / Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Ward 4, Station Road, near Janak Hall"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Monthly Rent (NPR)</label>
              <input
                type="number"
                required
                min={1000}
                value={rent}
                onChange={(e) => setRent(Number(e.target.value))}
                placeholder="6000"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Contact phone: strictly optional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-700">Contact Number</label>
              <span className="text-[10px] text-stone-400 font-semibold uppercase">Optional</span>
            </div>
            <input
              type="tel"
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              placeholder="98XXXXXXXX (Leave blank if you prefer messages only)"
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Room Photo URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
              className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Dynamic Amenities from Firestore ContentContext */}
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-2">
              Select Included Facilities &amp; Amenities
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activeFeatures.map(f => {
                const isSelected = facilities.includes(f.name);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => toggleFacility(f.name)}
                    className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      isSelected 
                        ? 'bg-amber-100 border-amber-600 text-amber-900 font-bold' 
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <span>{f.name}</span>
                    {isSelected && <Check className="w-4 h-4 text-amber-800" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe floor level, water availability, electricity sub-meter, rules, etc."
              className="w-full p-3 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-bold hover:bg-stone-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white text-xs font-bold shadow-md disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'Saving...' : initialRoom ? 'Update Room' : 'Publish Room Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
