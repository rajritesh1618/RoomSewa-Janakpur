import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
  Edit,
  Home,
  UserPlus,
  MessageSquare,
  Trash2,
  ExternalLink,
  ShieldAlert,
  CheckCheck
} from 'lucide-react';
import { useContent } from '../../context/ContentContext';
import { AdminNotification } from '../../types';

interface AdminNotificationCenterProps {
  onNavigateTab: (tab: any, relatedId?: string) => void;
}

export const AdminNotificationCenter: React.FC<AdminNotificationCenterProps> = ({
  onNavigateTab
}) => {
  const {
    adminNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    deleteNotification
  } = useContent();

  const [filter, setFilter] = useState<'all' | 'unread' | 'room' | 'payment' | 'message'>('all');

  const filteredNotifs = adminNotifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'room') return n.type === 'new_room' || n.type === 'room_edit';
    if (filter === 'payment') return n.type === 'premium_payment';
    if (filter === 'message') return n.type === 'new_message';
    return true;
  });

  const unreadCount = adminNotifications.filter((n) => !n.read).length;

  const handleClickNotification = async (n: AdminNotification) => {
    if (!n.read) {
      await markNotificationRead(n.id);
    }
    if (n.targetTab) {
      onNavigateTab(n.targetTab, n.relatedId);
    }
  };

  const getIcon = (type: AdminNotification['type']) => {
    switch (type) {
      case 'new_room':
        return <Home className="w-4 h-4 text-emerald-600" />;
      case 'room_edit':
        return <Edit className="w-4 h-4 text-amber-600" />;
      case 'premium_payment':
        return <Sparkles className="w-4 h-4 text-purple-600" />;
      case 'new_user':
        return <UserPlus className="w-4 h-4 text-blue-600" />;
      case 'new_message':
        return <MessageSquare className="w-4 h-4 text-indigo-600" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold mb-3">
              <Bell className="w-3.5 h-3.5" />
              Live System Activity & Alerts
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-heading tracking-tight">
              Admin Notifications Center
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Real-time alerts for new room listings, submitted owner edits, digital wallet payments, inquiries, and customer support tickets. Click any alert to jump directly to the item.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllNotificationsRead}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read ({unreadCount})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Activity ({adminNotifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === 'unread' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('payment')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === 'payment' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Payments
        </button>
        <button
          onClick={() => setFilter('room')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === 'room' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Rooms & Edits
        </button>
        <button
          onClick={() => setFilter('message')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
            filter === 'message' ? 'bg-amber-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Messages & Support
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
        {filteredNotifs.map((n) => (
          <div
            key={n.id}
            className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-all cursor-pointer ${
              !n.read ? 'bg-indigo-50/40 hover:bg-indigo-50/70 font-semibold' : 'hover:bg-slate-50/60'
            }`}
            onClick={() => handleClickNotification(n)}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                  !n.read ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {getIcon(n.type)}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-bold text-slate-900 font-heading">
                    {n.title}
                  </h4>
                  {!n.read && (
                    <span className="w-2 h-2 rounded-full bg-indigo-600 ring-4 ring-indigo-100" />
                  )}
                  <span className="text-[10px] text-slate-400 font-normal">
                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} •{' '}
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {n.message}
                </p>

                {n.targetTab && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-indigo-600 font-bold hover:underline mt-2">
                    Open in {n.targetTab} tab
                    <ExternalLink className="w-3 h-3" />
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(n.id);
                }}
                className="p-1.5 text-slate-300 hover:text-rose-600 rounded-lg transition-all"
                title="Dismiss"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {filteredNotifs.length === 0 && (
          <div className="text-center py-16 p-8">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 font-heading">No notifications found</h3>
            <p className="text-xs text-slate-500 mt-1">
              You are completely caught up with RoomSewa Janakpur activity.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
