import React, { useState } from 'react';
import { 
  User, 
  Home, 
  PlusCircle, 
  MessageSquare, 
  Trash2, 
  Edit3, 
  Phone, 
  Mail, 
  CheckCircle2, 
  ShieldCheck,
  Camera,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { RoomListing } from '../types';

interface DashboardProps {
  onNavigate: (view: string, extraData?: any) => void;
  onEditRoom: (room: RoomListing) => void;
  onSelectRoom: (room: RoomListing) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onEditRoom, onSelectRoom }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { rooms, deleteRoom, toggleAvailability } = useRooms();
  const { uploadProfilePicture, uploading } = useProfilePicture();

  const [activeTab, setActiveTab] = useState<'rooms' | 'profile'>('rooms');
  const [editingPhone, setEditingPhone] = useState(userProfile?.phone || '');
  const [phoneSaved, setPhoneSaved] = useState(false);

  const myRooms = rooms.filter(r => r.ownerId === currentUser?.uid);

  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUserProfile({
      phone: editingPhone.trim() ? editingPhone.trim() : undefined
    });
    setPhoneSaved(true);
    setTimeout(() => setPhoneSaved(false), 2500);
  };

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadProfilePicture(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-amber-100 border-2 border-amber-300 flex items-center justify-center text-amber-900 font-extrabold text-2xl shadow-md">
            {userProfile?.avatarUrl ? (
              <img src={userProfile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span>{userProfile?.name?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <label className="absolute bottom-0 right-0 p-1.5 rounded-full bg-stone-900 text-white cursor-pointer hover:bg-stone-800 shadow">
            <Camera className="w-3.5 h-3.5" />
            <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </label>
        </div>

        <div className="text-center sm:text-left flex-1 space-y-1">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 font-mithila">
              {userProfile?.name}
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 uppercase">
              {userProfile?.role}
            </span>
          </div>

          <p className="text-xs text-stone-500 flex items-center justify-center sm:justify-start gap-1">
            <Mail className="w-3.5 h-3.5 text-stone-400" />
            <span>{userProfile?.email}</span>
          </p>

          {/* Contact number: displayed ONLY if provided, hidden if omitted */}
          {userProfile?.phone && (
            <p className="text-xs text-stone-700 font-semibold flex items-center justify-center sm:justify-start gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{userProfile.phone}</span>
            </p>
          )}
        </div>

        <button
          onClick={() => onNavigate('add-room')}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-700 to-rose-700 hover:from-amber-800 hover:to-rose-800 text-white text-xs font-bold shadow flex items-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post New Room</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-stone-200 gap-4">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 ${
            activeTab === 'rooms' 
              ? 'border-amber-700 text-amber-900' 
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          My Listed Rooms ({myRooms.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-xs sm:text-sm font-bold transition border-b-2 ${
            activeTab === 'profile' 
              ? 'border-amber-700 text-amber-900' 
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          Profile &amp; Contact Settings
        </button>
      </div>

      {activeTab === 'rooms' ? (
        <div className="space-y-4">
          {myRooms.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-stone-200">
              <p className="text-stone-600 font-medium text-sm">You haven't listed any rooms yet.</p>
              <button
                onClick={() => onNavigate('add-room')}
                className="mt-3 px-4 py-2 bg-amber-700 text-white rounded-xl text-xs font-bold"
              >
                Post Your First Room
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myRooms.map(room => (
                <div 
                  key={room.id}
                  className="bg-white rounded-2xl p-4 border border-stone-200 shadow-xs flex gap-4"
                >
                  <img
                    src={room.images?.[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=400&q=80'}
                    alt={room.title}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-1">{room.title}</h3>
                      <p className="text-xs text-stone-500 mt-0.5">{room.chowk}</p>
                      <p className="text-xs font-extrabold text-rose-800 mt-1">Rs. {room.rent.toLocaleString()} /mo</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                      <button
                        onClick={() => toggleAvailability(room.id, room.available)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          room.available ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {room.available ? 'Available' : 'Rented'}
                      </button>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEditRoom(room)}
                          className="p-1 text-stone-500 hover:text-amber-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteRoom(room.id)}
                          className="p-1 text-stone-400 hover:text-rose-700"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200 max-w-lg">
          <h2 className="text-lg font-bold text-stone-900 mb-4 font-mithila">Contact Information</h2>
          <form onSubmit={handlePhoneUpdate} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-stone-700">Phone / Mobile Number</label>
                <span className="text-[10px] font-semibold text-stone-400 uppercase">Optional</span>
              </div>
              <input
                type="tel"
                value={editingPhone}
                onChange={(e) => setEditingPhone(e.target.value)}
                placeholder="98XXXXXXXX (Optional)"
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                If provided, tenants will be able to call you directly. If left blank, tenants will contact you via in-app messages.
              </p>
            </div>

            {phoneSaved && (
              <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Contact number updated successfully!</span>
              </p>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold"
            >
              Save Profile Contact
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
