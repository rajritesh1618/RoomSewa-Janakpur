import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Search,
  Send,
  Image,
  Mic,
  X,
  ShieldCheck,
  Bell,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowLeft,
  User,
  Settings,
  Plus,
  RefreshCw,
  Phone,
  Mail
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Conversation, RepliedMessagePreview } from '../../types';
import { MessageItem } from '../chat/MessageItem';
import { VoiceRecorder } from '../chat/VoiceRecorder';
import { PhotoViewerModal } from '../chat/PhotoViewerModal';
import { AdminSupportProfileSettings } from './AdminSupportProfileSettings';

interface AdminSupportDeskProps {
  initialSubTab?: 'chats' | 'notices' | 'settings';
}

export const AdminSupportDesk: React.FC<AdminSupportDeskProps> = ({
  initialSubTab = 'chats'
}) => {
  const { currentUser } = useAuth();
  const {
    adminSupportConversations,
    activeConversation,
    activeMessages,
    loadingMessages,
    adminUnreadSupportCount,
    supportProfile,
    notices,
    selectConversation,
    sendMessage,
    broadcastNotice,
    deleteNotice
  } = useChat();

  const [subTab, setSubTab] = useState<'chats' | 'notices' | 'settings'>(initialSubTab);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnreadOnly, setFilterUnreadOnly] = useState(false);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<RepliedMessagePreview | null>(null);
  const [selectedPhotoBase64, setSelectedPhotoBase64] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // Broadcast notice form state
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeAudience, setNoticeAudience] = useState<'all' | 'seekers' | 'owners'>('all');
  const [noticeIsUrgent, setNoticeIsUrgent] = useState(false);
  const [noticeSuccess, setNoticeSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync initialSubTab if prop updates
  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  // Auto-select first conversation on desktop if none selected
  useEffect(() => {
    if (!activeConversation && adminSupportConversations.length > 0 && window.innerWidth >= 768) {
      selectConversation(adminSupportConversations[0]);
    }
  }, [adminSupportConversations, activeConversation]);

  // Filter support conversations
  const filteredConversations = adminSupportConversations.filter((c) => {
    const unread = c.unreadCounts?.['admin'] || 0;
    if (filterUnreadOnly && unread === 0) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const userParticipant = Object.values(c.participantDetails || {}).find(
        (p) => p.uid !== 'admin'
      );
      const nameMatch = userParticipant?.name?.toLowerCase().includes(q);
      const emailMatch = userParticipant?.email?.toLowerCase().includes(q);
      const lastMsgMatch = c.lastMessage?.toLowerCase().includes(q);
      return Boolean(nameMatch || emailMatch || lastMsgMatch);
    }
    return true;
  });

  const getUserDetails = (conv: Conversation) => {
    const user = Object.values(conv.participantDetails || {}).find((p) => p.uid !== 'admin');
    return {
      name: user?.name || 'Janakpur User',
      email: user?.email || '',
      photoURL: user?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.uid || 'user'}`,
      role: user?.role || 'seeker',
      uid: user?.uid || ''
    };
  };

  const handleSelectConv = (conv: Conversation) => {
    selectConversation(conv);
    setMobileView('chat');
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedPhotoBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendAdminMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation) return;
    if (!inputText.trim() && !selectedPhotoBase64) return;

    setSending(true);
    try {
      if (selectedPhotoBase64) {
        await sendMessage(activeConversation.id, inputText.trim(), {
          type: 'image',
          mediaUrl: selectedPhotoBase64,
          replyTo: replyingTo
        });
        setSelectedPhotoBase64(null);
      } else {
        await sendMessage(activeConversation.id, inputText.trim(), {
          type: 'text',
          replyTo: replyingTo
        });
      }
      setInputText('');
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Error sending support reply:', err);
      alert(err.message || 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendVoice = async (audioDataUrl: string, durationSeconds: number) => {
    if (!activeConversation) return;
    setSending(true);
    try {
      await sendMessage(activeConversation.id, '', {
        type: 'voice',
        mediaUrl: audioDataUrl,
        audioDuration: durationSeconds,
        replyTo: replyingTo
      });
      setIsRecordingVoice(false);
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Failed to send voice reply:', err);
    } finally {
      setSending(false);
    }
  };

  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    try {
      await broadcastNotice(noticeTitle, noticeContent, noticeAudience, noticeIsUrgent);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeSuccess(true);
      setTimeout(() => setNoticeSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to broadcast notice');
    }
  };

  const handleQuickTemplate = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Subtabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-extrabold text-slate-900 font-heading">
              Support Center & Live Inquiries
            </h2>
            {adminUnreadSupportCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                {adminUnreadSupportCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time inquiries from seekers and owners. Replying as{' '}
            <strong className="text-indigo-700">{supportProfile.profileName || 'RoomSewa Support'}</strong>.
          </p>
        </div>

        {/* Subtab Switcher */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            id="admin-support-live-chat-tab"
            onClick={() => {
              setSubTab('chats');
              setMobileView('list');
            }}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              subTab === 'chats'
                ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Live Chat</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                subTab === 'chats' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {adminSupportConversations.length}
            </span>
          </button>

          <button
            type="button"
            id="admin-support-notices-tab"
            onClick={() => setSubTab('notices')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              subTab === 'notices'
                ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Broadcast Notices</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                subTab === 'notices' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {notices.length}
            </span>
          </button>

          <button
            type="button"
            id="admin-support-settings-tab"
            onClick={() => setSubTab('settings')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              subTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Support Settings</span>
          </button>
        </div>
      </div>

      {subTab === 'settings' ? (
        /* SUPPORT DESK PROFILE & AUTO-REPLY SETTINGS */
        <AdminSupportProfileSettings />
      ) : subTab === 'notices' ? (
        /* NOTICES BROADCAST SUBTAB */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Create Notice Form */}
          <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Bell className="w-4 h-4 text-indigo-600" />
              <span>Broadcast New Notice / Announcement</span>
            </h3>
            <p className="text-xs text-slate-500">
              Notices appear instantly across the top banner of the application for all users in Janakpur.
            </p>

            {noticeSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Notice broadcasted successfully to all users!</span>
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder="e.g., Notice: New Rooms Added at Shiva Chowk"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Notice Message / Content *
                </label>
                <textarea
                  required
                  rows={3}
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder="Detailed information for users..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:border-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Audience
                  </label>
                  <select
                    value={noticeAudience}
                    onChange={(e: any) => setNoticeAudience(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="all">All Janakpur Users</option>
                    <option value="seekers">Seekers Only</option>
                    <option value="owners">Property Owners Only</option>
                  </select>
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-rose-700">
                    <input
                      type="checkbox"
                      checked={noticeIsUrgent}
                      onChange={(e) => setNoticeIsUrgent(e.target.checked)}
                      className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                    />
                    <span>Urgent / High Priority</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send Broadcast Notice</span>
              </button>
            </form>
          </div>

          {/* Active Notices List */}
          <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center justify-between">
              <span>Active Broadcast Notices ({notices.length})</span>
            </h3>

            {notices.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center">
                No active announcements right now.
              </p>
            ) : (
              <div className="space-y-3 overflow-y-auto max-h-[500px]">
                {notices.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 ${
                      n.isUrgent
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        {n.isUrgent && (
                          <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-rose-600 text-white uppercase">
                            Urgent
                          </span>
                        )}
                        <h4 className="text-xs font-extrabold text-slate-900">{n.title}</h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 whitespace-pre-line leading-relaxed">
                        {n.content}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        Target: <strong className="capitalize">{n.targetAudience}</strong> • Author: {n.authorName}
                      </p>
                    </div>

                    <button
                      onClick={() => deleteNotice(n.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-lg transition-colors shrink-0"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* LIVE SUPPORT CHATS SUBTAB */
        <div className="h-[650px] bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col md:flex-row">
          {/* Left Panel: Support Tickets List */}
          <div
            className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex-col bg-slate-50/50 ${
              mobileView === 'chat' && activeConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Search & Filter */}
            <div className="p-3 border-b border-slate-200 bg-white space-y-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user name or email..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 rounded-xl border-none outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 text-[11px] font-semibold">
                  <input
                    type="checkbox"
                    checked={filterUnreadOnly}
                    onChange={(e) => setFilterUnreadOnly(e.target.checked)}
                    className="rounded text-indigo-600 w-3.5 h-3.5"
                  />
                  <span>Unread only</span>
                </label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {filteredConversations.length} conversation(s)
                </span>
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  <MessageSquare className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold text-slate-600">No support tickets found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Inquiries from seekers and owners will appear here automatically.</p>
                </div>
              ) : (
                filteredConversations.map((conv) => {
                  const user = getUserDetails(conv);
                  const isSelected = activeConversation?.id === conv.id;
                  const unread = conv.unreadCounts?.['admin'] || 0;

                  return (
                    <div
                      key={conv.id}
                      onClick={() => handleSelectConv(conv)}
                      className={`p-3.5 cursor-pointer transition-all flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-indigo-50 border-l-4 border-indigo-600'
                          : 'hover:bg-slate-100/70'
                      }`}
                    >
                      <img
                        src={user.photoURL}
                        alt={user.name}
                        className="w-10 h-10 rounded-xl object-cover bg-slate-200 border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-extrabold text-slate-900 truncate">
                            {user.name}
                          </h4>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {conv.lastMessageTime
                              ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 capitalize">
                            {user.role}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {user.email}
                          </span>
                        </div>
                        <p className={`text-xs truncate mt-1 ${unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                          {conv.lastMessage || 'No messages'}
                        </p>
                      </div>

                      {unread > 0 && (
                        <span className="shrink-0 px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-rose-500 text-white self-center">
                          {unread}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Panel: Chat Thread */}
          <div
            className={`flex-1 flex-col bg-white ${
              mobileView === 'list' && !activeConversation ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activeConversation ? (
              <>
                {/* Active Support Header */}
                {(() => {
                  const user = getUserDetails(activeConversation);
                  return (
                    <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-white">
                      <div className="flex items-center gap-3">
                        {/* Mobile Back Button */}
                        <button
                          type="button"
                          onClick={() => setMobileView('list')}
                          className="md:hidden p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                          title="Back to conversation list"
                        >
                          <ArrowLeft className="w-5 h-5" />
                        </button>

                        <img
                          src={user.photoURL}
                          alt={user.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-slate-900">
                              {user.name}
                            </h3>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 capitalize">
                              {user.role}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2">
                            <span>{user.email || 'Janakpur Resident'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 hidden sm:block">
                        Replying as <strong className="text-indigo-600">{supportProfile.profileName || 'Support'}</strong>
                      </div>
                    </div>
                  );
                })()}

                {/* Messages Body */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/40">
                  {loadingMessages ? (
                    <div className="text-center py-8 text-xs text-slate-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                      <span>Loading messages...</span>
                    </div>
                  ) : activeMessages.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-400">
                      No messages in this inquiry yet. Send a greeting below!
                    </div>
                  ) : (
                    activeMessages.map((msg) => (
                      <MessageItem
                        key={msg.id}
                        message={msg}
                        isCurrentUser={msg.senderId === 'admin' || msg.senderRole === 'admin'}
                        onReply={(rep) => setReplyingTo(rep)}
                        onOpenPhoto={(url) => setViewingPhotoUrl(url)}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Response Chips */}
                <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Quick Reply:</span>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('Namaste! How may I assist you with rooms in Janakpur today?')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap transition-colors"
                  >
                    Greeting
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('Your room listing has been reviewed and approved. It is now live.')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap transition-colors"
                  >
                    Listing Approved
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTemplate('Please share your preferred chowk, room type, and monthly budget so we can help.')}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 whitespace-nowrap transition-colors"
                  >
                    Ask Details
                  </button>
                </div>

                {/* Bottom Composer */}
                <div className="p-3 border-t border-slate-200 bg-white">
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-indigo-50 border-l-4 border-indigo-600 rounded-xl flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-indigo-950 text-[11px]">
                          Replying to {replyingTo.senderName}
                        </span>
                        <p className="text-indigo-800 text-[11px] truncate">{replyingTo.text}</p>
                      </div>
                      <button onClick={() => setReplyingTo(null)} className="p-1 text-indigo-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {selectedPhotoBase64 && (
                    <div className="mb-2 p-2 bg-slate-100 rounded-xl flex items-center gap-3 w-fit border">
                      <img src={selectedPhotoBase64} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                      <button
                        onClick={() => setSelectedPhotoBase64(null)}
                        className="text-[11px] font-bold text-rose-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  {isRecordingVoice ? (
                    <VoiceRecorder
                      onSendVoice={handleSendVoice}
                      onCancel={() => setIsRecordingVoice(false)}
                    />
                  ) : (
                    <form onSubmit={handleSendAdminMessage} className="flex items-center gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoSelect}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Attach photo"
                      >
                        <Image className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsRecordingVoice(true)}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                        title="Record voice note"
                      >
                        <Mic className="w-5 h-5" />
                      </button>
                      <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Reply to user as RoomSewa Support..."
                        className="flex-1 px-4 py-2 text-sm bg-slate-100 rounded-xl border-none outline-none focus:ring-1 focus:ring-indigo-500 text-slate-900"
                      />
                      <button
                        type="submit"
                        disabled={sending || (!inputText.trim() && !selectedPhotoBase64)}
                        className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-xs transition-colors flex items-center justify-center shrink-0"
                        title="Send reply"
                      >
                        {sending ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 border border-indigo-200 text-indigo-600 flex items-center justify-center mb-3 shadow-xs">
                  <MessageSquare className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-base font-extrabold text-slate-900 font-heading">
                  Live Chat Screen
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Select a user conversation from the left to view their inquiries and reply in real time.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <PhotoViewerModal
        imageUrl={viewingPhotoUrl}
        onClose={() => setViewingPhotoUrl(null)}
      />
    </div>
  );
};
