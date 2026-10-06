import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Building2,
  Users,
  MapPin,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Crown,
  Search,
  Filter,
  DollarSign,
  Clock,
  Plus,
  Activity,
  Layers,
  MessageSquare,
  Settings,
  FileText,
  ArrowRight,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Ban,
  UserCheck,
  UserX,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sliders,
  Bell,
  CreditCard,
  Navigation,
  QrCode,
  HelpCircle,
  X
} from 'lucide-react';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useRooms } from '../context/RoomContext';
import { useChat } from '../context/ChatContext';
import { useContent } from '../context/ContentContext';
import { useProfilePicture } from '../context/ProfilePictureContext';
import { RoomListing, ChowkLocation, UserProfile, PremiumRequest } from '../types';
import { AdminSupportDesk } from './admin/AdminSupportDesk';
import { AdminRoomEditModal } from './admin/AdminRoomEditModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { AdminUserEditModal } from './admin/AdminUserEditModal';
import { AdminChowksManager } from './admin/AdminChowksManager';
import { AdminFeaturesManager } from './admin/AdminFeaturesManager';
import { AdminContentManager } from './admin/AdminContentManager';
import { AdminSettingsManager } from './admin/AdminSettingsManager';
import { AdminFeaturesControlManager } from './admin/AdminFeaturesControlManager';
import { AdminNavControlManager } from './admin/AdminNavControlManager';
import { AdminPremiumManager } from './admin/AdminPremiumManager';
import { AdminPaymentManager } from './admin/AdminPaymentManager';
import { AdminPaymentApprovals } from './admin/AdminPaymentApprovals';
import { AdminNotificationCenter } from './admin/AdminNotificationCenter';
import { AdminPendingListings } from './admin/AdminPendingListings';
import { AdminPendingEdits } from './admin/AdminPendingEdits';

interface AdminPanelProps {
  onSelectRoom: (room: RoomListing) => void;
  onEditRoom?: (room: RoomListing) => void;
  onOpenChat?: (conversationId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onSelectRoom, onEditRoom, onOpenChat }) => {
  const { currentUser, isAdmin } = useAuth();
  const { adminUnreadSupportCount, startOrGetDirectConversation } = useChat();
  const { openViewer } = useProfilePicture();
  const {
    rooms,
    chowks,
    premiumRequests,
    approveRoom,
    rejectRoom,
    approveRoomEdit,
    rejectRoomEdit,
    deleteRoom,
    toggleRoomStatus,
    adminUpdateRoom,
    toggleRoomHidden,
    addChowk,
    updateChowk,
    deleteChowk,
    toggleChowkHidden,
    reorderChowk,
    approvePremiumRequest,
    rejectPremiumRequest
  } = useRooms();

  const {
    appContent,
    features,
    adminSettings,
    adminNotifications,
    unreadNotificationsCount,
    updateAppContent,
    updateAdminSettings,
    addFeature,
    updateFeature,
    deleteFeature,
    toggleFeatureHidden,
    toggleFeatureDisabled,
    reorderFeatures,
    resetFeaturesToDefault,
    addFaq,
    updateFaq,
    deleteFaq,
    addNotice,
    updateNotice,
    deleteNotice
  } = useContent();

  const [activeTab, setActiveTab] = useState<
    | 'rooms'
    | 'pending-listings'
    | 'edit-approvals'
    | 'payments'
    | 'premium-config'
    | 'payment-methods'
    | 'app-controls'
    | 'nav-controls'
    | 'users'
    | 'chowks'
    | 'features'
    | 'content'
    | 'settings'
    | 'live-chat'
    | 'support'
    | 'notifications'
    | 'activity'
  >('rooms');

  // Pending edit approvals count
  const pendingEditRooms = rooms.filter((r) => r.editStatus === 'pending' && Boolean(r.pendingEdit));
  const pendingApprovalRooms = rooms.filter((r) => r.approvalStatus === 'pending');
  const pendingPremiumRequests = premiumRequests.filter((p) => p.status === 'pending');

  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Search and Filter States for Rooms
  const [roomFilterStatus, setRoomFilterStatus] = useState<string>('all');
  const [roomFilterChowk, setRoomFilterChowk] = useState<string>('all');
  const [roomSearch, setRoomSearch] = useState<string>('');

  // Search and Filter States for Users
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userSearch, setUserSearch] = useState<string>('');

  // Modals
  const [selectedRoomForAdminEdit, setSelectedRoomForAdminEdit] = useState<RoomListing | null>(null);
  const [selectedUserForAdminEdit, setSelectedUserForAdminEdit] = useState<UserProfile | null>(null);
  const [roomToDeleteForAdmin, setRoomToDeleteForAdmin] = useState<RoomListing | null>(null);
  const [isDeletingRoomForAdmin, setIsDeletingRoomForAdmin] = useState(false);

  // Quick Rejection from Table State
  const [rejectingTableRoom, setRejectingTableRoom] = useState<RoomListing | null>(null);
  const [tableRejectReason, setTableRejectReason] = useState('');
  const [tableRejectError, setTableRejectError] = useState('');
  const [submittingTableReject, setSubmittingTableReject] = useState(false);

  // Edit Approval Review State
  const [selectedEditReviewRoom, setSelectedEditReviewRoom] = useState<RoomListing | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState('');
  const [isRejecting, setIsRejecting] = useState(false);
  const [processingEditAction, setProcessingEditAction] = useState(false);

  // Quick Action feedback
  const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setActionAlert({ type, message });
    setTimeout(() => {
      setActionAlert(null);
    }, 4000);
  };

  // Listen to all users
  useEffect(() => {
    if (!isAdmin) {
      setAllUsers([]);
      setLoadingUsers(false);
      return;
    }

    const usersCol = collection(db, 'users');
    const unsub = onSnapshot(
      usersCol,
      (snap) => {
        const uList: UserProfile[] = [];
        snap.forEach((d) => {
          uList.push(d.data() as UserProfile);
        });
        setAllUsers(uList);
        setLoadingUsers(false);
      },
      (err) => {
        console.error('Error fetching users:', err);
        setLoadingUsers(false);
      }
    );

    return () => unsub();
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 font-heading">Admin Access Restricted</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto">
          You must be an authorized RoomSewa Janakpur administrative officer to access this central management system.
        </p>
      </div>
    );
  }

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    if (roomFilterStatus !== 'all') {
      if (roomFilterStatus === 'available' && r.status !== 'available') return false;
      if (roomFilterStatus === 'rented' && r.status !== 'rented') return false;
      if (roomFilterStatus === 'pending' && r.approvalStatus !== 'pending') return false;
      if (roomFilterStatus === 'approved' && r.approvalStatus !== 'approved') return false;
      if (roomFilterStatus === 'rejected' && r.approvalStatus !== 'rejected') return false;
      if (roomFilterStatus === 'hidden' && !r.isHidden) return false;
      if (roomFilterStatus === 'pending-edit' && r.editStatus !== 'pending') return false;
    }
    if (roomFilterChowk !== 'all' && r.chowk !== roomFilterChowk) return false;
    if (roomSearch.trim()) {
      const q = roomSearch.toLowerCase();
      return (
        r.title.toLowerCase().includes(q) ||
        r.chowk.toLowerCase().includes(q) ||
        r.ownerName.toLowerCase().includes(q) ||
        (r.ownerPhone && r.ownerPhone.includes(q)) ||
        (r.landmark && r.landmark.toLowerCase().includes(q)) ||
        (r.roomType && r.roomType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Filtered Users
  const filteredUsers = allUsers.filter((u) => {
    if (userRoleFilter !== 'all') {
      if (userRoleFilter === 'owner' && u.role !== 'owner') return false;
      if (userRoleFilter === 'seeker' && u.role !== 'seeker') return false;
      if (userRoleFilter === 'admin' && u.role !== 'admin') return false;
      if (userRoleFilter === 'premium' && !u.isPremium) return false;
      if (userRoleFilter === 'disabled' && !u.isDisabled) return false;
    }
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      return (
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.phoneNumber && u.phoneNumber.includes(q)) ||
        u.uid.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // User Actions
  const handleSaveUser = async (userId: string, updates: Partial<UserProfile>) => {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
    showAlert('success', 'User profile updated successfully.');
  };

  const handleDeleteUser = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    await deleteDoc(userRef);
    showAlert('success', 'User profile deleted.');
  };

  const handleToggleUserDisabled = async (user: UserProfile) => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      isDisabled: !user.isDisabled
    });
    showAlert(
      'success',
      user.isDisabled ? `Enabled account for ${user.displayName}` : `Disabled account for ${user.displayName}`
    );
  };

  const handleToggleUserPremium = async (user: UserProfile) => {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      isPremium: !user.isPremium
    });
    showAlert(
      'success',
      user.isPremium ? `Revoked Gold badge from ${user.displayName}` : `Granted Gold badge to ${user.displayName}`
    );
  };

  const handleMessageUser = async (targetUserId: string, userName: string) => {
    try {
      const convId = await startOrGetDirectConversation({
        targetUserId,
        targetUserName: userName,
        initialMessage: `Hello ${userName}, this is the RoomSewa Janakpur Admin Desk.`
      });
      if (onOpenChat) {
        onOpenChat(convId);
      } else {
        setActiveTab('support');
      }
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to start message conversation.');
    }
  };

  // Edit Approval Handlers
  const handleApproveEdit = async (roomId: string) => {
    setProcessingEditAction(true);
    try {
      await approveRoomEdit(roomId);
      showAlert('success', 'Room edit approved and updated live!');
      setSelectedEditReviewRoom(null);
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to approve room edit.');
    } finally {
      setProcessingEditAction(false);
    }
  };

  const handleRejectEdit = async (roomId: string) => {
    setProcessingEditAction(true);
    try {
      await rejectRoomEdit(roomId, rejectReasonInput.trim() || 'Modifications not approved by Admin.');
      showAlert('success', 'Room edit rejected.');
      setSelectedEditReviewRoom(null);
      setIsRejecting(false);
      setRejectReasonInput('');
    } catch (err: any) {
      showAlert('error', err.message || 'Failed to reject room edit.');
    } finally {
      setProcessingEditAction(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Alert Banner */}
      {actionAlert && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-xs border ${
            actionAlert.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold">
            {actionAlert.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            )}
            {actionAlert.message}
          </div>
          <button
            onClick={() => setActionAlert(null)}
            className="text-xs font-extrabold opacity-60 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Panel Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-[10px] font-extrabold uppercase tracking-wider border border-indigo-400/20 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              Central Control Console
            </span>
            <span className="text-xs text-slate-300 font-medium">Janakpurdham, Nepal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
            RoomSewa Admin Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Full management system for all rooms, users, chowks, amenities, dynamic app copy, and platform settings.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {unreadNotificationsCount > 0 && (
            <button
              onClick={() => setActiveTab('notifications')}
              className="px-3 py-2 rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/40 transition-all"
            >
              <Bell className="w-3.5 h-3.5 text-indigo-300" />
              {unreadNotificationsCount} Alerts
            </button>
          )}

          {pendingApprovalRooms.length > 0 && (
            <button
              onClick={() => setActiveTab('pending-listings')}
              className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-200 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              {pendingApprovalRooms.length} Pending Approval
            </button>
          )}

          {pendingEditRooms.length > 0 && (
            <button
              onClick={() => setActiveTab('edit-approvals')}
              className="px-3 py-2 rounded-xl bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-500/40 transition-all"
            >
              <Edit className="w-3.5 h-3.5 text-indigo-300" />
              {pendingEditRooms.length} Pending Edits
            </button>
          )}

          {pendingPremiumRequests.length > 0 && (
            <button
              onClick={() => setActiveTab('payments')}
              className="px-3 py-2 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-300 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 fill-slate-950" />
              {pendingPremiumRequests.length} Payments
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none">
        {[
          { id: 'rooms', label: 'All Rooms', icon: Building2, count: rooms.length },
          { id: 'pending-listings', label: 'Pending Listings', icon: Clock, count: pendingApprovalRooms.length, highlight: pendingApprovalRooms.length > 0 },
          { id: 'edit-approvals', label: 'Pending Changes', icon: Edit, count: pendingEditRooms.length, highlight: pendingEditRooms.length > 0 },
          { id: 'payments', label: 'Payment Approvals', icon: CreditCard, count: pendingPremiumRequests.length, highlight: pendingPremiumRequests.length > 0 },
          { id: 'premium-config', label: 'Gold Premium Plan', icon: Crown },
          { id: 'payment-methods', label: 'Payment Methods & QR', icon: QrCode },
          { id: 'app-controls', label: 'Feature Visibility', icon: Sliders },
          { id: 'nav-controls', label: 'Navigation Menu', icon: Navigation },
          { id: 'users', label: 'User Management', icon: Users, count: allUsers.length },
          { id: 'chowks', label: 'Chowks & Areas', icon: MapPin, count: chowks.length },
          { id: 'features', label: 'Features (Builder)', icon: Layers, count: features.length },
          { id: 'content', label: 'App Content & Text', icon: FileText },
          { id: 'live-chat', label: 'Live Chat', icon: MessageSquare, badge: adminUnreadSupportCount },
          { id: 'support', label: 'Support Desk', icon: HelpCircle },
          { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotificationsCount },
          { id: 'settings', label: 'Admin Settings', icon: Settings },
          { id: 'activity', label: 'Activity Stats', icon: Activity }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 border border-slate-200'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{tab.label}</span>
              {typeof tab.count === 'number' && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
              {Boolean(tab.badge) && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: ROOMS MANAGEMENT */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                placeholder="Search rooms by title, landmark, owner name, phone..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={roomFilterStatus}
                onChange={(e) => setRoomFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="all">All Statuses ({rooms.length})</option>
                <option value="pending">Pending Approval ({pendingApprovalRooms.length})</option>
                <option value="approved">Approved Rooms</option>
                <option value="rejected">Rejected Rooms</option>
                <option value="available">Available Only</option>
                <option value="rented">Rented Only</option>
                <option value="hidden">Hidden Listings</option>
                <option value="pending-edit">Pending Edits ({pendingEditRooms.length})</option>
              </select>

              <select
                value={roomFilterChowk}
                onChange={(e) => setRoomFilterChowk(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="all">All Chowks / Areas</option>
                {chowks.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Rooms Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Listing Details</th>
                    <th className="px-5 py-3.5">Chowk / Location</th>
                    <th className="px-5 py-3.5">Rent / Type</th>
                    <th className="px-5 py-3.5">Owner Details</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Visibility</th>
                    <th className="px-5 py-3.5 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRooms.map((room) => {
                    const coverPhoto =
                      room.photos && room.photos.length > 0
                        ? room.photos[0]
                        : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=400&q=80';

                    return (
                      <tr
                        key={room.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          room.isHidden ? 'bg-slate-50/50 opacity-75' : ''
                        }`}
                      >
                        {/* Listing Details */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={coverPhoto}
                              alt={room.title}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200 cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => onSelectRoom(room)}
                              title="Click to view room details"
                            />
                            <div className="min-w-0 max-w-xs">
                              <p
                                onClick={() => onSelectRoom(room)}
                                className="font-bold text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                              >
                                {room.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">ID: {room.id.slice(0, 8)}</span>
                                {room.isFeatured && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                                    Featured
                                  </span>
                                )}
                                {room.editStatus === 'pending' && (
                                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[9px] font-bold">
                                    Edit Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Chowk */}
                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-800 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                            {room.chowk}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-xs">
                            {room.landmark || room.addressLine || 'Ward ' + (room.wardNumber || 'Janakpur')}
                          </p>
                        </td>

                        {/* Rent & Type */}
                        <td className="px-5 py-4">
                          <p className="font-black text-indigo-600">Rs. {room.rentPerMonth}</p>
                          <p className="text-[11px] text-slate-500">{room.roomType || 'Room'} • {room.floor || 'Floor'}</p>
                        </td>

                        {/* Owner Details */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{room.ownerName}</span>
                            {room.isOwnerPremium && (
                              <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono">{room.ownerPhone}</p>
                        </td>

                        {/* Approval Status */}
                        <td className="px-5 py-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                room.approvalStatus === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : room.approvalStatus === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {room.approvalStatus}
                            </span>
                            <span
                              className={`text-[10px] font-bold ${
                                room.status === 'available' ? 'text-emerald-600' : 'text-slate-400'
                              }`}
                            >
                              {room.status === 'available' ? '● Available' : '○ Rented'}
                            </span>
                          </div>
                        </td>

                        {/* Visibility (Hidden / Visible) */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => toggleRoomHidden(room.id, room.isHidden)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                              room.isHidden
                                ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            {room.isHidden ? <EyeOff className="w-3 h-3 text-rose-500" /> : <Eye className="w-3 h-3 text-emerald-600" />}
                            {room.isHidden ? 'Hidden' : 'Visible'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Quick Approval if pending */}
                            {room.approvalStatus === 'pending' && (
                              <>
                                <button
                                  onClick={async () => {
                                    try {
                                      await approveRoom(room.id);
                                      showAlert('success', `Room "${room.title}" approved and visible to the public!`);
                                    } catch (e: any) {
                                      showAlert('error', e.message || 'Failed to approve room.');
                                    }
                                  }}
                                  title="Approve Listing"
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-2xs"
                                >
                                  <CheckCircle className="w-3 h-3" /> Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setRejectingTableRoom(room);
                                    setTableRejectReason('');
                                    setTableRejectError('');
                                  }}
                                  title="Reject Listing"
                                  className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[10px] flex items-center gap-1"
                                >
                                  <XCircle className="w-3 h-3" /> Reject
                                </button>
                              </>
                            )}

                            {/* View Rejection Reason if rejected */}
                            {room.approvalStatus === 'rejected' && room.rejectionReason && (
                              <button
                                onClick={() => {
                                  alert(`Rejection Reason for "${room.title}":\n\n${room.rejectionReason}`);
                                }}
                                title={`Rejected: ${room.rejectionReason}`}
                                className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold flex items-center gap-1"
                              >
                                <AlertCircle className="w-3 h-3" /> Reason
                              </button>
                            )}

                            {/* Review pending edit */}
                            {room.editStatus === 'pending' && (
                              <button
                                onClick={() => setSelectedEditReviewRoom(room)}
                                title="Review Pending Edit"
                                className="px-2 py-1 rounded-lg bg-indigo-600 text-white font-bold text-[10px] flex items-center gap-1"
                              >
                                <Edit className="w-3 h-3" /> Review Edit
                              </button>
                            )}

                            {/* Full Edit Room */}
                            <button
                              onClick={() => setSelectedRoomForAdminEdit(room)}
                              title="Edit All Room Details"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>

                            {/* Toggle Availability */}
                            <button
                              onClick={async () => {
                                try {
                                  await toggleRoomStatus(room.id, room.status);
                                  showAlert('success', `Room marked as ${room.status === 'available' ? 'Rented' : 'Available'}.`);
                                } catch (err: any) {
                                  showAlert('error', err?.message || 'Failed to update room status.');
                                }
                              }}
                              title={room.status === 'available' ? 'Mark as Rented' : 'Mark as Available'}
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 text-[10px] font-bold"
                            >
                              {room.status === 'available' ? 'Mark Rented' : 'Mark Available'}
                            </button>

                            {/* Delete Room */}
                            <button
                              type="button"
                              onClick={() => setRoomToDeleteForAdmin(room)}
                              title="Delete Room Listing"
                              className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredRooms.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No rooms match the selected filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PENDING LISTINGS APPROVAL */}
      {activeTab === 'pending-listings' && (
        <AdminPendingListings
          pendingRooms={pendingApprovalRooms}
          chowks={chowks}
          features={features}
          onApprove={approveRoom}
          onReject={rejectRoom}
          onSelectRoom={onSelectRoom}
          onOpenChatWithUser={(uid, uName) => handleMessageUser(uid, uName)}
        />
      )}

      {/* TAB: PENDING EDITS (CHANGES) APPROVAL */}
      {activeTab === 'edit-approvals' && (
        <AdminPendingEdits
          pendingEditRooms={pendingEditRooms}
          chowks={chowks}
          features={features}
          onApproveEdit={approveRoomEdit}
          onRejectEdit={rejectRoomEdit}
          onSelectRoom={onSelectRoom}
          onOpenChatWithUser={(uid, uName) => handleMessageUser(uid, uName)}
        />
      )}

      {/* TAB 3: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* User Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search users by name, email, phone number, or UID..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-indigo-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white text-slate-700 outline-none focus:border-indigo-600"
              >
                <option value="all">All Roles ({allUsers.length})</option>
                <option value="owner">Owners / Landlords</option>
                <option value="seeker">Room Seekers</option>
                <option value="admin">Administrators</option>
                <option value="premium">Verified Gold Users</option>
                <option value="disabled">Disabled Accounts</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Contact Details</th>
                    <th className="px-5 py-3.5 text-center">Role</th>
                    <th className="px-5 py-3.5 text-center">Gold Status</th>
                    <th className="px-5 py-3.5 text-center">Listed Rooms</th>
                    <th className="px-5 py-3.5 text-center">Account Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => {
                    const userRooms = rooms.filter((r) => r.ownerId === user.uid);

                    return (
                      <tr
                        key={user.uid}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          user.isDisabled ? 'bg-rose-50/30' : ''
                        }`}
                      >
                        {/* User identity */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 font-bold flex items-center justify-center shrink-0">
                              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 truncate">
                                {user.displayName || 'Unnamed User'}
                              </p>
                              <p className="text-[10px] font-mono text-slate-400 truncate max-w-xs">{user.uid}</p>
                            </div>
                          </div>
                        </td>

                        {/* Contacts */}
                        <td className="px-5 py-4">
                          <p className="text-slate-700">{user.email || <span className="text-slate-400 italic">No email</span>}</p>
                          <p className="text-slate-500 font-mono mt-0.5">
                            {user.phoneNumber || <span className="text-slate-400 italic">No phone</span>}
                          </p>
                        </td>

                        {/* Role */}
                        <td className="px-5 py-4 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              user.role === 'admin'
                                ? 'bg-rose-100 text-rose-800'
                                : user.role === 'owner'
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        {/* Gold status */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleUserPremium(user)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase inline-flex items-center gap-1 transition-all ${
                              user.isPremium
                                ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                                : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                            }`}
                          >
                            <Crown className="w-3 h-3" />
                            {user.isPremium ? 'Gold' : 'Standard'}
                          </button>
                        </td>

                        {/* Listed rooms */}
                        <td className="px-5 py-4 text-center">
                          <span className="font-bold text-slate-700">
                            {userRooms.length}
                          </span>
                        </td>

                        {/* Disabled / Active toggle */}
                        <td className="px-5 py-4 text-center">
                          <button
                            onClick={() => handleToggleUserDisabled(user)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all inline-flex items-center gap-1 ${
                              user.isDisabled
                                ? 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                                : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            }`}
                          >
                            {user.isDisabled ? <Ban className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                            {user.isDisabled ? 'Disabled' : 'Active'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Send Message */}
                            <button
                              onClick={() => handleMessageUser(user.uid, user.displayName || user.email)}
                              title="Message User"
                              className="p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>

                            {/* Edit User Modal */}
                            <button
                              onClick={() => setSelectedUserForAdminEdit(user)}
                              title="Manage User Account"
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-700"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No users match the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CHOWKS & AREAS MANAGEMENT */}
      {activeTab === 'chowks' && (
        <AdminChowksManager
          chowks={chowks}
          rooms={rooms}
          onAddChowk={addChowk}
          onUpdateChowk={updateChowk}
          onDeleteChowk={deleteChowk}
          onToggleHideChowk={toggleChowkHidden}
          onReorderChowk={reorderChowk}
        />
      )}

      {/* TAB 5: ROOM FEATURES & FACILITIES */}
      {activeTab === 'features' && (
        <AdminFeaturesManager
          features={features}
          onAddFeature={addFeature}
          onUpdateFeature={updateFeature}
          onDeleteFeature={deleteFeature}
          onToggleFeatureHidden={toggleFeatureHidden}
          onToggleFeatureDisabled={toggleFeatureDisabled}
          onReorderFeature={reorderFeatures}
          onResetFeatures={resetFeaturesToDefault}
        />
      )}

      {/* TAB 6: APP CONTENT MANAGEMENT */}
      {activeTab === 'content' && (
        <AdminContentManager
          content={appContent}
          onSaveContent={updateAppContent}
          onAddFaq={addFaq}
          onUpdateFaq={updateFaq}
          onDeleteFaq={deleteFaq}
          onAddNotice={addNotice}
          onUpdateNotice={updateNotice}
          onDeleteNotice={deleteNotice}
        />
      )}

      {/* TAB 7: ADMIN & PLATFORM SETTINGS */}
      {activeTab === 'settings' && (
        <AdminSettingsManager
          settings={adminSettings}
          onSaveSettings={updateAdminSettings}
        />
      )}

      {/* TAB: PAYMENT APPROVALS */}
      {activeTab === 'payments' && (
        <AdminPaymentApprovals />
      )}

      {/* TAB: PREMIUM CONFIG & PLANS */}
      {activeTab === 'premium-config' && (
        <AdminPremiumManager onNavigateToPayments={() => setActiveTab('payments')} />
      )}

      {/* TAB: PAYMENT METHODS & QR CODES */}
      {activeTab === 'payment-methods' && (
        <AdminPaymentManager />
      )}

      {/* TAB: APP CONTROLS & FEATURE VISIBILITY */}
      {activeTab === 'app-controls' && (
        <AdminFeaturesControlManager />
      )}

      {/* TAB: NAVIGATION MENU CONTROL */}
      {activeTab === 'nav-controls' && (
        <AdminNavControlManager />
      )}

      {/* TAB: NOTIFICATIONS CENTER */}
      {activeTab === 'notifications' && (
        <AdminNotificationCenter onNavigateTab={(tab) => setActiveTab(tab)} />
      )}

      {/* TAB 9: SUPPORT DESK & LIVE CHAT */}
      {(activeTab === 'support' || activeTab === 'live-chat') && (
        <AdminSupportDesk initialSubTab="chats" />
      )}

      {/* TAB 10: ACTIVITY & STATS */}
      {activeTab === 'activity' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] uppercase font-bold text-slate-400">Total Rooms</p>
            <p className="text-2xl font-black text-slate-900 font-heading mt-1">{rooms.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {rooms.filter((r) => r.status === 'available').length} Available • {rooms.filter((r) => r.status === 'rented').length} Rented
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] uppercase font-bold text-slate-400">Registered Users</p>
            <p className="text-2xl font-black text-slate-900 font-heading mt-1">{allUsers.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {allUsers.filter((u) => u.role === 'owner').length} Owners • {allUsers.filter((u) => u.role === 'seeker').length} Seekers
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] uppercase font-bold text-slate-400">Janakpur Chowks</p>
            <p className="text-2xl font-black text-slate-900 font-heading mt-1">{chowks.length}</p>
            <p className="text-xs text-slate-500 mt-2">
              {chowks.filter((c) => !c.isHidden).length} Visible • {chowks.filter((c) => c.isHidden).length} Hidden
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-[11px] uppercase font-bold text-slate-400">Verified Gold Owners</p>
            <p className="text-2xl font-black text-amber-600 font-heading mt-1">
              {allUsers.filter((u) => u.isPremium).length}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              {pendingPremiumRequests.length} pending review
            </p>
          </div>
        </div>
      )}

      {/* Admin Room Edit Modal */}
      {selectedRoomForAdminEdit && (
        <AdminRoomEditModal
          room={selectedRoomForAdminEdit}
          chowks={chowks}
          features={features}
          isOpen={Boolean(selectedRoomForAdminEdit)}
          onClose={() => setSelectedRoomForAdminEdit(null)}
          onSave={adminUpdateRoom}
          onDelete={async (id) => {
            await deleteRoom(id);
            showAlert('success', 'Room listing deleted successfully.');
          }}
        />
      )}

      {/* Admin User Edit Modal */}
      {selectedUserForAdminEdit && (
        <AdminUserEditModal
          user={selectedUserForAdminEdit}
          userRooms={rooms.filter((r) => r.ownerId === selectedUserForAdminEdit.uid)}
          isOpen={Boolean(selectedUserForAdminEdit)}
          onClose={() => setSelectedUserForAdminEdit(null)}
          onSave={handleSaveUser}
          onDeleteUser={handleDeleteUser}
          onMessageUser={handleMessageUser}
        />
      )}

      {/* Edit Review Inspection Modal */}
      {selectedEditReviewRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-base text-slate-900 font-heading">
                Inspect Submitted Edits for "{selectedEditReviewRoom.title}"
              </h3>
              <button
                onClick={() => setSelectedEditReviewRoom(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="p-3 bg-indigo-50/60 rounded-xl text-xs text-indigo-900 font-medium">
                Review proposed modifications submitted by owner {selectedEditReviewRoom.ownerName}.
              </div>

              {selectedEditReviewRoom.pendingEdit && (
                <div className="space-y-2 text-xs">
                  {Object.entries(selectedEditReviewRoom.pendingEdit).map(([key, val]) => {
                    if (['submittedAt', 'submittedBy', 'submittedByName', 'submittedByEmail', 'changedFieldKeys', 'previousValues'].includes(key)) {
                      return null;
                    }
                    const prevVal = (selectedEditReviewRoom as any)[key];
                    if (JSON.stringify(prevVal) === JSON.stringify(val)) return null;

                    return (
                      <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="font-bold uppercase text-[10px] text-slate-400 block mb-1">{key}</span>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-rose-700 bg-rose-50 p-2 rounded-lg">
                            <span className="text-[9px] font-bold uppercase block text-rose-500">Current</span>
                            <span className="font-semibold">{JSON.stringify(prevVal)}</span>
                          </div>
                          <div className="text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                            <span className="text-[9px] font-bold uppercase block text-emerald-500">Proposed</span>
                            <span className="font-semibold">{JSON.stringify(val)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {isRejecting && (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold text-slate-700">Rejection Reason</label>
                  <input
                    type="text"
                    value={rejectReasonInput}
                    onChange={(e) => setRejectReasonInput(e.target.value)}
                    placeholder="Provide reason for rejection..."
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-rose-600"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 mt-4">
              <button
                type="button"
                onClick={() => setSelectedEditReviewRoom(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              {isRejecting ? (
                <button
                  type="button"
                  onClick={() => handleRejectEdit(selectedEditReviewRoom.id)}
                  disabled={processingEditAction}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                >
                  Confirm Reject
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold"
                >
                  Reject Edit
                </button>
              )}

              <button
                type="button"
                onClick={() => handleApproveEdit(selectedEditReviewRoom.id)}
                disabled={processingEditAction}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> Approve & Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal for Table Action */}
      {rejectingTableRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 font-heading">
                    Reject Listing: {rejectingTableRoom.title}
                  </h3>
                  <p className="text-[11px] text-slate-500">Owner: {rejectingTableRoom.ownerName}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectingTableRoom(null)}
                className="w-7 h-7 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-xs text-rose-900">
                <strong>Mandatory Rejection Reason:</strong> Provide a clear reason before completing rejection. This explanation will be saved and sent directly to {rejectingTableRoom.ownerName} in Notifications and Messages.
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1.5">
                  Quick Select Common Reasons:
                </label>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                  {[
                    'Please upload clearer and authentic photos of the room and amenities.',
                    'Electricity charge per unit information is missing or unclear.',
                    'Water availability schedule and source details need clarification.',
                    'The specified chowk or landmark address appears inaccurate.',
                    'Provided owner contact phone number appears unreachable or invalid.'
                  ].map((tmpl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTableRejectReason(tmpl);
                        setTableRejectError('');
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
                  value={tableRejectReason}
                  onChange={(e) => {
                    setTableRejectReason(e.target.value);
                    if (tableRejectError) setTableRejectError('');
                  }}
                  placeholder="Enter detailed reason for rejecting this room listing..."
                  className={`w-full p-3 text-xs rounded-xl border outline-none bg-slate-50/50 ${
                    tableRejectError ? 'border-rose-500 ring-1 ring-rose-200' : 'border-slate-200 focus:border-rose-600'
                  }`}
                />
                {tableRejectError && (
                  <p className="text-[11px] font-bold text-rose-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {tableRejectError}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 mt-5">
              <button
                type="button"
                onClick={() => setRejectingTableRoom(null)}
                disabled={submittingTableReject}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!tableRejectReason.trim()) {
                    setTableRejectError('Rejection reason is required.');
                    return;
                  }
                  setSubmittingTableReject(true);
                  try {
                    await rejectRoom(rejectingTableRoom.id, tableRejectReason.trim());
                    showAlert('success', `Room "${rejectingTableRoom.title}" rejected and owner notified with reason.`);
                    setRejectingTableRoom(null);
                  } catch (err: any) {
                    setTableRejectError(err.message || 'Failed to reject listing.');
                  } finally {
                    setSubmittingTableReject(false);
                  }
                }}
                disabled={submittingTableReject}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <XCircle className="w-4 h-4" />
                Confirm Rejection & Notify Owner
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Room Deletion Confirmation Dialog */}
      <ConfirmDeleteModal
        isOpen={Boolean(roomToDeleteForAdmin)}
        roomTitle={roomToDeleteForAdmin?.title || 'Room Listing'}
        isDeleting={isDeletingRoomForAdmin}
        isAdmin={true}
        onCancel={() => setRoomToDeleteForAdmin(null)}
        onConfirm={async () => {
          if (!roomToDeleteForAdmin) return;
          setIsDeletingRoomForAdmin(true);
          try {
            await deleteRoom(roomToDeleteForAdmin.id);
            showAlert('success', `Room "${roomToDeleteForAdmin.title}" deleted successfully.`);
            setRoomToDeleteForAdmin(null);
          } catch (err: any) {
            showAlert('error', err?.message || 'Failed to delete room listing.');
          } finally {
            setIsDeletingRoomForAdmin(false);
          }
        }}
      />
    </div>
  );
};
