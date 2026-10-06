import React, { useState } from 'react';
import {
  User,
  Heart,
  Home,
  PlusCircle,
  Phone,
  Mail,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Crown,
  Eye,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Camera,
  UploadCloud
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { useChat } from '../context/ChatContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { useContent } from '../context/ContentContext';
import { RoomCard } from './RoomCard';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { RoomListing, InterestedInquiry, UserRole } from '../types';
import { calculateRoomPricing } from '../utils/pricingCalculator';
import {
  isValidNepalMobile,
  extractNepalLocalMobile,
  formatFullNepalMobile,
  NEPAL_PHONE_ERROR_MESSAGE
} from '../utils/nepalPhone';
import { NepalPhoneInput } from './common/NepalPhoneInput';

interface DashboardProps {
  initialTab?: 'overview' | 'my-rooms' | 'saved' | 'inquiries' | 'profile';
  onNavigateAddRoom: () => void;
  onEditRoom: (room: RoomListing) => void;
  onSelectRoom: (room: RoomListing) => void;
  onNavigatePremium: () => void;
  onOpenChat?: (conversationId: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  initialTab = 'overview',
  onNavigateAddRoom,
  onEditRoom,
  onSelectRoom,
  onNavigatePremium,
  onOpenChat
}) => {
  const { currentUser, userProfile, updateUserProfile, setUserRole, refreshUserProfile, isPremium, isAdmin, isOwner, role } = useAuth();
  const { premiumConfig } = useContent();
  const { startOrGetDirectConversation, startOrGetRoomConversation } = useChat();
  const { openMenu, openViewer, triggerFilePicker } = useProfilePicture();
  const {
    rooms,
    savedRoomIds,
    inquiries,
    deleteRoom,
    toggleRoomStatus,
    markInquiryContacted
  } = useRooms();

  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Profile Edit State
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [selectedRole, setSelectedRole] = useState<UserRole>(userProfile?.role || 'seeker');
  const [phoneDigits, setPhoneDigits] = useState(
    userProfile?.phoneNumber ? extractNepalLocalMobile(userProfile.phoneNumber) : ''
  );
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');

  // Listings Action Feedback
  const [deletingRoomId, setDeletingRoomId] = useState<string | null>(null);
  const [roomToDelete, setRoomToDelete] = useState<RoomListing | null>(null);
  const [listingsAlert, setListingsAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Keep phone input state synced if userProfile updates
  React.useEffect(() => {
    if (userProfile?.displayName) setDisplayName(userProfile.displayName);
    if (userProfile?.role) setSelectedRole(userProfile.role);
    if (userProfile?.phoneNumber) {
      setPhoneDigits(extractNepalLocalMobile(userProfile.phoneNumber));
    }
    if (userProfile?.photoURL) setPhotoURL(userProfile.photoURL);
    if (userProfile?.bio) setBio(userProfile.bio);
  }, [userProfile]);

  const isPhoneValid = isValidNepalMobile(phoneDigits);
  const showPhoneError = phoneTouched && phoneDigits.length > 0 && !isPhoneValid;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\D/g, '');
    const cleanDigits = rawVal.slice(0, 10);
    setPhoneDigits(cleanDigits);
    if (!phoneTouched && cleanDigits.length > 0) {
      setPhoneTouched(true);
    }
  };

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Please sign in to view your dashboard</h2>
      </div>
    );
  }

  // Filter items
  const userRooms = rooms.filter((r) => r.ownerId === currentUser.uid);
  const savedRooms = rooms.filter((r) => savedRoomIds.includes(r.id));
  
  // Inquiries directed to owner or sent by seeker
  const receivedInquiries = inquiries.filter((inq) => inq.ownerId === currentUser.uid);
  const sentInquiries = inquiries.filter((inq) => inq.seekerId === currentUser.uid);

  const isOwnerOrAdmin = userProfile?.role === 'owner' || isAdmin;

  // Lifetime listing quota calculation (1 free room listing ever)
  const lifetimeCount = userProfile?.lifetimeListingCount ?? 0;
  const hasUsedFreeListing = Boolean(
    userProfile?.hasUsedFreeListing === true ||
    lifetimeCount >= 1 ||
    userRooms.length > 0
  );
  // Premium restrictions active ONLY when Premium System is ON (enabled: true)
  // When Premium is OFF -> All owners can use the app for free without quota limits!
  const isPremiumSystemActive = Boolean(premiumConfig?.enabled);
  const isFreeListingUsed = isPremiumSystemActive && !isPremium && !isAdmin && hasUsedFreeListing;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileErrorMsg('');
    setProfileSuccessMsg('');
    setPhoneTouched(true);

    if (!displayName.trim()) {
      setProfileErrorMsg('Please enter your display name');
      return;
    }

    if (!phoneDigits) {
      setProfileErrorMsg('Mobile number is required. ' + NEPAL_PHONE_ERROR_MESSAGE);
      return;
    }

    if (!isPhoneValid) {
      setProfileErrorMsg(NEPAL_PHONE_ERROR_MESSAGE);
      return;
    }

    setSavingProfile(true);
    try {
      const fullPhone = formatFullNepalMobile(phoneDigits);
      await updateUserProfile({
        displayName: displayName.trim(),
        phoneNumber: fullPhone,
        photoURL: photoURL.trim(),
        bio: bio.trim()
      });
      if (selectedRole !== userProfile?.role && !isAdmin) {
        await setUserRole(selectedRole);
      }
      setProfileSuccessMsg('Profile updated successfully!');
      setTimeout(() => setProfileSuccessMsg(''), 3000);
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarPreset = (seed: string) => {
    setPhotoURL(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Welcome Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Interactive Profile Picture Click Target */}
          <div
            id="dashboard-header-avatar"
            onClick={() => openMenu()}
            className="relative cursor-pointer group select-none shrink-0"
            title="Click to see or change profile picture"
          >
            <img
              src={
                userProfile?.photoURL ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
              }
              alt="Avatar"
              className="w-20 h-20 rounded-2xl object-cover border-2 border-slate-200 bg-slate-100 group-hover:scale-105 transition-transform shadow-xs"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity backdrop-blur-[1px]">
              <Camera className="w-6 h-6" />
            </div>
            {/* Quick Camera Indicator Badge */}
            <div className="absolute -bottom-1 -right-1 p-1 bg-indigo-600 text-white rounded-lg shadow-sm border-2 border-white">
              <Camera className="w-3 h-3" />
            </div>
            {isPremium && (
              <div
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md"
                title="Verified Gold Member"
              >
                <Crown className="w-3.5 h-3.5 fill-slate-950" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
                {userProfile?.displayName || 'Janakpur User'}
              </h1>
              {isPremium && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-bold rounded-lg bg-amber-100 text-amber-900 border border-amber-200">
                  <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                  Premium Member
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {currentUser.email} •{' '}
              <span className="capitalize font-semibold text-slate-700">
                {userProfile?.role || 'Seeker'} Account
              </span>
            </p>
            {/* Profile Picture Quick Actions */}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                type="button"
                onClick={() => openViewer()}
                className="px-2.5 py-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                See Profile Picture
              </button>
              <button
                type="button"
                onClick={() => triggerFilePicker()}
                className="px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 transition-colors"
              >
                <Camera className="w-3.5 h-3.5" />
                Change Photo (&lt; 2 MB)
              </button>
            </div>
          </div>
        </div>

        {/* Action quick buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {isOwner && !isPremium && (
            <button
              id="dashboard-upgrade-premium-btn"
              onClick={onNavigatePremium}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition-all"
            >
              <Crown className="w-4 h-4 fill-white" />
              Upgrade to Lifetime Premium (Rs 200)
            </button>
          )}

          {isOwner && isPremium && (
            <button
              id="dashboard-premium-badge-btn"
              onClick={onNavigatePremium}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold transition-all shadow-2xs"
            >
              <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
              Premium Dashboard
            </button>
          )}

          {isOwner ? (
            <button
              onClick={onNavigateAddRoom}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Add New Room
            </button>
          ) : (
            <button
              onClick={() => setActiveTab('saved')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <Heart className="w-4 h-4 text-rose-300" />
              View Saved Rooms
            </button>
          )}
        </div>
      </div>

      {/* Owner Payment Rejection Notice Banner */}
      {isOwner && userProfile?.premiumStatus === 'rejected' && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-rose-950 font-bold block text-sm">
                Your Premium Payment was Rejected
              </strong>
              <p className="text-rose-800 mt-0.5">
                Reason: <em>"{userProfile?.rejectionReason || 'Details could not be verified by Admin'}"</em>
              </p>
            </div>
          </div>
          <button
            onClick={onNavigatePremium}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold shrink-0 self-start sm:self-auto shadow-xs transition-colors"
          >
            View Details & Try Again
          </button>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 pb-2 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Overview & Stats
        </button>

        <button
          onClick={() => setActiveTab('my-rooms')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'my-rooms'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Home className="w-4 h-4" />
          My Listed Rooms ({userRooms.length})
        </button>

        <button
          onClick={() => setActiveTab('saved')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'saved'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Heart className="w-4 h-4 text-rose-500" />
          Saved Rooms ({savedRooms.length})
        </button>

        <button
          onClick={() => setActiveTab('inquiries')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'inquiries'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Inquiries & Contacts ({receivedInquiries.length + sentInquiries.length})
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'profile'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <User className="w-4 h-4" />
          Edit Profile
        </button>

        {isOwner && (
          <button
            id="tab-premium-dashboard-btn"
            onClick={onNavigatePremium}
            className="px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-2 text-amber-900 bg-amber-50/80 hover:bg-amber-100 border border-amber-200"
          >
            <Crown className="w-4 h-4 text-amber-600 fill-amber-500" />
            Premium Dashboard
          </button>
        )}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                My Active Rooms
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
                {userRooms.filter((r) => r.status === 'available').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Available for seekers in Janakpur</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Rented Rooms
              </span>
              <div className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
                {userRooms.filter((r) => r.status === 'rented').length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Marked as occupied</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Saved Rooms
              </span>
              <div className="text-3xl font-extrabold text-rose-600 font-heading mt-2">
                {savedRooms.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Bookmarked for later viewing</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Interested Inquiries
              </span>
              <div className="text-3xl font-extrabold text-indigo-600 font-heading mt-2">
                {receivedInquiries.length}
              </div>
              <p className="text-xs text-slate-500 mt-1">Seekers who messaged your rooms</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="p-6 rounded-3xl bg-indigo-900 text-white flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-lg font-bold font-heading">
                Looking to find rooms across Janakpur chowks?
              </h3>
              <p className="text-xs text-indigo-200 mt-1">
                Explore verified listings near Bhanu Chowk, Shiva Chowk, Murali Chowk, and Ramanand Chowk.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('my-rooms')}
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 shrink-0"
            >
              Manage My Listings
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: MY ROOMS (Owners) */}
      {activeTab === 'my-rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 font-heading">
              Your Room Listings in Janakpur ({userRooms.length})
            </h2>
            <button
              onClick={onNavigateAddRoom}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              {isFreeListingUsed ? 'Add Room (Premium)' : 'Add Room (Free)'}
            </button>
          </div>

          {listingsAlert && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold border transition-all ${
                listingsAlert.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {listingsAlert.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{listingsAlert.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setListingsAlert(null)}
                className="opacity-60 hover:opacity-100 text-xs"
              >
                Dismiss
              </button>
            </div>
          )}

          {!isPremiumSystemActive && isOwnerOrAdmin && (
            <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-emerald-200 text-emerald-900 shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-950">
                    All Owners Free Access Active (Premium Status: OFF)
                  </p>
                  <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                    Premium restrictions are currently turned OFF by administrators. All landlords and property owners can post unlimited room and flat listings completely for free!
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigateAddRoom}
                className="shrink-0 w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                List Another Room (Free)
              </button>
            </div>
          )}

          {isFreeListingUsed && (
            <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0 mt-0.5">
                  <Crown className="w-5 h-5 text-amber-700 fill-amber-500" />
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-950">
                    Your free room listing has already been used. Premium is required to list another room.
                  </p>
                  <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                    Owners get <strong>only 1 free room listing ever</strong> based on lifetime history. Deleting previous listings or having zero active rooms does not reset your free listing. Upgrade to Lifetime Premium (Rs 200) for unlimited room listings across Janakpur.
                  </p>
                </div>
              </div>
              <button
                onClick={onNavigatePremium}
                className="shrink-0 w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                Upgrade to Premium (Rs 200)
              </button>
            </div>
          )}

          {userRooms.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Home className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No rooms listed currently</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
                {isFreeListingUsed
                  ? 'Your free room listing has already been used. Premium is required to list another room.'
                  : 'Have a room, flat, or student accommodation in Janakpur? List your first room for free!'}
              </p>
              {isFreeListingUsed ? (
                <button
                  onClick={onNavigatePremium}
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 text-white rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-1.5"
                >
                  <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  Upgrade to Premium to List (Rs 200)
                </button>
              ) : (
                <button
                  onClick={onNavigateAddRoom}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold"
                >
                  List First Room Free Now
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {userRooms.map((room) => {
                const isRented = room.status === 'rented';
                return (
                  <div
                    key={room.id}
                    className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          room.photos[0] ||
                          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80'
                        }
                        alt="Room"
                        className="w-20 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Main Approval Status Badge */}
                          {room.approvalStatus === 'pending' && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-amber-100 text-amber-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Pending Approval
                            </span>
                          )}
                          {room.approvalStatus === 'rejected' && (
                            <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-rose-100 text-rose-800 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              Listing Rejected
                            </span>
                          )}
                          {room.approvalStatus === 'approved' && (
                            <>
                              <span
                                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-md ${
                                  isRented ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {isRented ? 'Rented' : 'Active / Public'}
                              </span>
                              {room.editStatus === 'pending' && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase rounded-md bg-indigo-100 text-indigo-800 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-indigo-600" />
                                  Edit Under Review
                                </span>
                              )}
                            </>
                          )}
                          <span className="text-xs font-semibold text-slate-500">
                            • {room.chowk}
                          </span>
                        </div>
                        <h4 className="font-heading text-sm sm:text-base font-bold text-slate-900 line-clamp-1 mt-0.5">
                          {room.title}
                        </h4>
                        {(() => {
                          const pricing = calculateRoomPricing(room);
                          return (
                            <div className="text-xs font-bold text-amber-950 mt-1 flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300">
                                Total: {pricing.totalFormatted}
                              </span>
                              <span className="text-slate-500 font-normal">
                                (Rent: NPR {room.rentPerMonth.toLocaleString()})
                              </span>
                              {pricing.variableChargesNote && (
                                <span className="text-amber-800 text-[11px] font-normal">
                                  {pricing.variableChargesNote}
                                </span>
                              )}
                            </div>
                          );
                        })()}

                        {/* Status Notice Banners for Owner */}
                        {room.approvalStatus === 'pending' && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs">
                            <div className="flex items-center gap-1.5 font-bold">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              Waiting for Admin Approval
                            </div>
                            <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                              Your room listing has been submitted and is waiting for admin approval. It will become visible to the public once approved.
                            </p>
                          </div>
                        )}

                        {room.approvalStatus === 'rejected' && (
                          <div className="mt-2.5 p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs space-y-1.5">
                            <div className="flex items-center gap-1.5 font-bold text-rose-800">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                              Room Listing Rejected by Admin
                            </div>
                            {room.rejectionReason && (
                              <div className="text-[11px] text-rose-900 bg-white/80 p-2.5 rounded-lg border border-rose-200/80">
                                <strong>Reason:</strong> {room.rejectionReason}
                              </div>
                            )}
                            <p className="text-[11px] text-rose-700 leading-relaxed">
                              Your room is not visible to the public. Please edit your listing to correct the issue and submit for approval again.
                            </p>
                            <button
                              type="button"
                              onClick={() => onEditRoom(room)}
                              className="mt-1 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              Edit & Resubmit Listing
                            </button>
                          </div>
                        )}

                        {/* Edit Status Badges for Owner */}
                        {room.approvalStatus === 'approved' && room.editStatus === 'pending' && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-indigo-50 text-indigo-950 border border-indigo-200 text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" />
                              Changes Waiting for Admin Approval
                            </div>
                            <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                              Your newly edited changes have been submitted for admin review. Room seekers will continue to see your previously approved listing until your new changes are approved.
                            </p>
                          </div>
                        )}

                        {room.approvalStatus === 'approved' && room.editStatus === 'rejected' && room.lastEditRejectionReason && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold text-amber-800">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              Last Requested Changes Were Rejected
                            </div>
                            <p className="text-[11px] text-amber-900 bg-white/80 p-2 rounded-lg border border-amber-200">
                              <strong>Reason:</strong> {room.lastEditRejectionReason}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Your previously approved version remains live and visible to seekers. You can edit and resubmit changes anytime.
                            </p>
                          </div>
                        )}

                        {room.approvalStatus === 'approved' && room.editStatus === 'approved' && !room.pendingEdit && (
                          <div className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            All edits approved & public
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions: Toggle Status, Edit, Delete, View */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            await toggleRoomStatus(room.id, room.status);
                          } catch (err: any) {
                            alert(err?.message || 'Failed to update room availability status.');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                          isRented
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        Mark as {isRented ? 'Available' : 'Rented'}
                      </button>

                      <button
                        onClick={() => onSelectRoom(room)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200"
                      >
                        View
                      </button>

                      <button
                        onClick={() => onEditRoom(room)}
                        className="p-2 rounded-xl text-indigo-600 bg-indigo-50 hover:bg-indigo-100"
                        title="Edit Room"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setRoomToDelete(room)}
                        className="p-2 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors"
                        title="Delete Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SAVED ROOMS */}
      {activeTab === 'saved' && (
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-heading mb-4">
            Saved & Interested Rooms ({savedRooms.length})
          </h2>

          {savedRooms.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200">
              <Heart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No saved rooms yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Browse rooms in Janakpur and click the heart icon on any room card to save it here for quick reference.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {savedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={onSelectRoom}
                  onOpenChat={onOpenChat}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: INQUIRIES */}
      {activeTab === 'inquiries' && (
        <div className="space-y-6">
          {/* Inquiries received as owner */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading mb-3">
              Inquiries for Your Rooms ({receivedInquiries.length})
            </h3>
            {receivedInquiries.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-6 rounded-2xl border border-slate-200">
                No inquiries received yet. When room seekers message you, they will appear here.
              </p>
            ) : (
              <div className="space-y-3">
                {receivedInquiries.map((inq) => (
                  <div
                    key={inq.id}
                    className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700">{inq.roomTitle}</span>
                        <span className="text-xs text-slate-400">• {inq.roomChowk}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-900 mt-1">
                        "{inq.message}"
                      </p>
                      <div className="text-xs text-slate-500 mt-1 flex items-center gap-3">
                        <span
                          onClick={async () => {
                            try {
                              const convId = await startOrGetDirectConversation({
                                targetUserId: inq.seekerId,
                                targetUserName: inq.seekerName,
                                targetUserRole: 'seeker',
                                roomId: inq.roomId,
                                roomTitle: inq.roomTitle,
                                roomChowk: inq.roomChowk
                              });
                              if (onOpenChat) onOpenChat(convId);
                            } catch (err: any) {
                              alert(err.message || 'Could not open chat with seeker');
                            }
                          }}
                          className="cursor-pointer hover:text-indigo-600 underline"
                          title="Click to message this seeker"
                        >
                          From: <strong>{inq.seekerName}</strong>
                        </span>
                        <span>Phone: {inq.seekerPhone || 'Not provided'}</span>
                        <span>Email: {inq.seekerEmail}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={async () => {
                          try {
                            const convId = await startOrGetDirectConversation({
                              targetUserId: inq.seekerId,
                              targetUserName: inq.seekerName,
                              targetUserRole: 'seeker',
                              roomId: inq.roomId,
                              roomTitle: inq.roomTitle,
                              roomChowk: inq.roomChowk
                            });
                            if (onOpenChat) onOpenChat(convId);
                          } catch (err: any) {
                            alert(err.message || 'Could not open chat with seeker');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-xs"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Chat with Seeker
                      </button>

                      {inq.seekerPhone && (
                        <a
                          href={`tel:${inq.seekerPhone}`}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
                        >
                          Call
                        </a>
                      )}
                      {inq.status !== 'contacted' ? (
                        <button
                          onClick={() => markInquiryContacted(inq.id)}
                          className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200"
                        >
                          Mark Contacted
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Contacted
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Inquiries sent as seeker */}
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading mb-3">
              Inquiries You Sent to Owners ({sentInquiries.length})
            </h3>
            {sentInquiries.length === 0 ? (
              <p className="text-xs text-slate-500 bg-white p-6 rounded-2xl border border-slate-200">
                You haven't inquired about any rooms yet.
              </p>
            ) : (
              <div className="space-y-3">
                {sentInquiries.map((inq) => (
                  <div key={inq.id} className="p-4 bg-white rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-700">{inq.roomTitle}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(inq.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1">Message: "{inq.message}"</p>
                    </div>

                    <button
                      onClick={async () => {
                        try {
                          const targetRoom = rooms.find((r) => r.id === inq.roomId);
                          if (targetRoom) {
                            const convId = await startOrGetRoomConversation(targetRoom);
                            if (onOpenChat) onOpenChat(convId);
                          } else {
                            const convId = await startOrGetDirectConversation({
                              targetUserId: inq.ownerId,
                              targetUserName: 'Room Owner',
                              targetUserRole: 'owner',
                              roomId: inq.roomId,
                              roomTitle: inq.roomTitle,
                              roomChowk: inq.roomChowk
                            });
                            if (onOpenChat) onOpenChat(convId);
                          }
                        } catch (err: any) {
                          alert(err.message || 'Could not open chat with owner');
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors self-start sm:self-auto"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Chat with Owner
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: PROFILE EDIT */}
      {activeTab === 'profile' && (
        <div className="max-w-2xl bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <h2 className="text-xl font-extrabold text-slate-900 font-heading mb-4">
            Edit Your Profile
          </h2>

          {/* Owner Premium Dashboard Banner - Only visible to Owners */}
          {isOwner && (
            <div
              id="profile-premium-banner"
              className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-amber-100/50 to-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Crown className="w-5 h-5 fill-slate-950" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-amber-950">Owner Premium Dashboard</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    {isPremium
                      ? 'Verified Gold status is active on your owner account.'
                      : 'Upgrade to Lifetime Premium (Rs 200) for unlimited room listings & gold badge.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                id="profile-go-premium-btn"
                onClick={onNavigatePremium}
                className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Crown className="w-3.5 h-3.5 fill-white text-white" />
                Go to Premium Dashboard
              </button>
            </div>
          )}

          {profileSuccessMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {profileSuccessMsg}
            </div>
          )}

          {profileErrorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              {profileErrorMsg}
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Account Role Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account Role
                </label>
                <span className="text-[11px] text-slate-400 font-medium">
                  Currently: <strong className="capitalize text-slate-700">{userProfile?.role || 'Seeker'}</strong>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
                <label
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    selectedRole === 'seeker'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="profile-role"
                    value="seeker"
                    checked={selectedRole === 'seeker'}
                    onChange={() => setSelectedRole('seeker')}
                    className="accent-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Seeker (Tenant)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      Looking to rent rooms or flats in Janakpur
                    </span>
                  </div>
                </label>

                <label
                  className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                    selectedRole === 'owner'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="profile-role"
                    value="owner"
                    checked={selectedRole === 'owner'}
                    onChange={() => setSelectedRole('owner')}
                    className="accent-indigo-600 mt-0.5"
                  />
                  <div>
                    <span className="block text-xs font-bold text-slate-900">
                      Owner (Landlord)
                    </span>
                    <span className="block text-[11px] text-slate-500 mt-0.5">
                      List properties & access Owner Premium Dashboard
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Display Name *
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <NepalPhoneInput
              value={phoneDigits}
              onChange={(_full, localDigits) => {
                setPhoneDigits(localDigits);
                if (!phoneTouched && localDigits.length > 0) {
                  setPhoneTouched(true);
                }
              }}
              label="Mobile Number"
              required
              id="profile-phone-input"
              error={showPhoneError ? NEPAL_PHONE_ERROR_MESSAGE : null}
              helperText="Must be exactly 10 digits starting with 98 or 97 (saved as +97798XXXXXXXX / +97797XXXXXXXX)."
            />

            {/* Dedicated Profile Picture System Section */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Profile Picture
              </label>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div
                  onClick={() => openMenu()}
                  className="relative cursor-pointer group shrink-0"
                  title="Click to see or change profile picture"
                >
                  <img
                    src={
                      userProfile?.photoURL ||
                      photoURL ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`
                    }
                    alt="Current Profile"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-xs bg-white group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-5 h-5" />
                  </div>
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      id="dashboard-see-pic-btn"
                      onClick={() => openViewer()}
                      className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 border border-indigo-200 rounded-xl flex items-center gap-1.5 shadow-2xs transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      See Profile Picture
                    </button>

                    <button
                      type="button"
                      id="dashboard-change-pic-btn"
                      onClick={() => triggerFilePicker()}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Change Profile Picture (&lt; 2 MB)
                    </button>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Maximum file size: <strong>less than 2 MB</strong>. Choose from device gallery or camera. Stored securely via Firebase Storage.
                  </p>
                </div>
              </div>

              {/* Optional Quick Avatars */}
              <div className="mt-4 pt-3 border-t border-slate-200/80 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">Quick Avatars:</span>
                {['Janakpur1', 'Janakpur2', 'Ramesh', 'Sita', 'Mahesh'].map((seed) => (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => handleAvatarPreset(seed)}
                    className="text-xs px-2.5 py-1 bg-white hover:bg-slate-200/70 border border-slate-200 rounded-lg text-slate-700 font-medium transition-colors"
                  >
                    {seed}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                About / Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="Write a short line about yourself (e.g. Student at RR Campus or Local resident in Ward 4)"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              disabled={savingProfile || !isPhoneValid || !displayName.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
          </form>
        </div>
      )}

      {/* Permanent Delete Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={Boolean(roomToDelete)}
        roomTitle={roomToDelete?.title || 'Room Listing'}
        isDeleting={Boolean(deletingRoomId)}
        isAdmin={isAdmin}
        onCancel={() => setRoomToDelete(null)}
        onConfirm={async () => {
          if (!roomToDelete) return;
          setDeletingRoomId(roomToDelete.id);
          try {
            await deleteRoom(roomToDelete.id);
            setListingsAlert({
              type: 'success',
              message: `Room "${roomToDelete.title}" deleted successfully.`
            });
            setRoomToDelete(null);
          } catch (err: any) {
            setListingsAlert({
              type: 'error',
              message: err?.message || 'Failed to delete room listing.'
            });
          } finally {
            setDeletingRoomId(null);
          }
        }}
      />
    </div>
  );
};
