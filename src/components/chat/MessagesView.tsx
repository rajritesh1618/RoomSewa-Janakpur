import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Image,
  Mic,
  X,
  Search,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Crown,
  Phone,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Eye,
  Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useProfilePicture } from '../../context/ProfilePictureContext';
import { Conversation, RepliedMessagePreview, RoomListing } from '../../types';
import { MessageItem } from './MessageItem';
import { VoiceRecorder } from './VoiceRecorder';
import { PhotoViewerModal } from './PhotoViewerModal';
import { compressImage } from '../../utils/imageCompressor';

interface MessagesViewProps {
  initialConversationId?: string;
  onSelectRoom?: (room: RoomListing) => void;
  onSelectRoomById?: (roomId: string) => void;
  onOpenAuth?: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({
  initialConversationId,
  onSelectRoom,
  onSelectRoomById,
  onOpenAuth
}) => {
  const { currentUser, userProfile, isAdmin } = useAuth();
  const {
    conversations,
    activeConversation,
    activeMessages,
    loadingConversations,
    loadingMessages,
    totalUnreadCount,
    supportProfile,
    setActiveConversationId,
    selectConversation,
    startOrGetSupportConversation,
    sendMessage,
    markConversationAsRead
  } = useChat();
  const { openViewer, openMenu } = useProfilePicture();

  const [filterTab, setFilterTab] = useState<'all' | 'rooms' | 'support'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<RepliedMessagePreview | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-select initial conversation if provided
  useEffect(() => {
    if (initialConversationId) {
      selectConversation(initialConversationId);
    }
  }, [initialConversationId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages]);

  if (!currentUser) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900 font-heading">
          RoomSewa Janakpur Messages
        </h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Sign in to connect directly with room seekers, verified property owners, and RoomSewa Support desk.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold shadow-md transition-all"
        >
          Sign In to Access Messages
        </button>
      </div>
    );
  }

  // Handle Photo selection from device
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Compress and resize photo to stay well below Firestore 1MB document limit
      const compressed = await compressImage(file, 1000, 1000, 0.7);
      setSelectedImageBase64(compressed);
    } catch (err: any) {
      console.error('Photo compression error:', err);
      alert('Could not process this photo. Please try a different image.');
    } finally {
      e.target.value = '';
    }
  };

  // Send Text or Photo Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeConversation) return;
    if (!inputText.trim() && !selectedImageBase64) return;

    setSending(true);
    try {
      if (selectedImageBase64) {
        await sendMessage(activeConversation.id, inputText.trim(), {
          type: 'image',
          mediaUrl: selectedImageBase64,
          replyTo: replyingTo
        });
        setSelectedImageBase64(null);
      } else {
        await sendMessage(activeConversation.id, inputText.trim(), {
          type: 'text',
          replyTo: replyingTo
        });
      }
      setInputText('');
      setReplyingTo(null);
    } catch (err: any) {
      console.error('Failed to send message:', err);
      alert(err.message || 'Could not send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  // Send Voice Note
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
      console.error('Failed to send voice note:', err);
      alert(err.message || 'Could not send voice note.');
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter((c) => {
    if (filterTab === 'rooms' && c.type !== 'direct') return false;
    if (filterTab === 'support' && c.type !== 'support') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const otherParticipant = Object.values(c.participantDetails || {}).find(
        (p) => p.uid !== currentUser.uid
      );
      const nameMatch = otherParticipant?.name?.toLowerCase().includes(q);
      const roomMatch = c.roomTitle?.toLowerCase().includes(q) || c.roomChowk?.toLowerCase().includes(q);
      const lastMsgMatch = c.lastMessage?.toLowerCase().includes(q);
      return Boolean(nameMatch || roomMatch || lastMsgMatch);
    }

    return true;
  });

  // Check if support conversation already exists
  const hasSupportConversation = conversations.some((c) => c.type === 'support');

  // Helper to extract other participant
  const getOtherParticipant = (conv: Conversation) => {
    if (conv.type === 'support') {
      return {
        uid: 'support_admin',
        name: supportProfile.profileName || 'RoomSewa Janakpur Support',
        photoURL: supportProfile.photoURL,
        role: 'admin' as const,
        isSupport: true
      };
    }
    const other = Object.values(conv.participantDetails || {}).find((p) => p.uid !== currentUser.uid);
    return {
      uid: other?.uid || 'user',
      name: other?.name || 'Janakpur User',
      photoURL: other?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${other?.uid || 'user'}`,
      role: other?.role || 'seeker',
      isSupport: false
    };
  };

  const formatConversationTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 h-[calc(100vh-5rem)] min-h-[600px] flex flex-col">
      {/* Container Box */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* LEFT PANEL: Conversation List */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-slate-200 flex flex-col bg-slate-50/50 ${
            activeConversation ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 font-heading">
                  Messages
                </h1>
                {totalUnreadCount > 0 && (
                  <span className="px-2 py-0.5 text-xs font-extrabold rounded-full bg-rose-500 text-white animate-pulse">
                    {totalUnreadCount} new
                  </span>
                )}
              </div>

              {/* Start Support Button */}
              <button
                type="button"
                onClick={() => startOrGetSupportConversation()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors"
                title="Get help from RoomSewa Administration"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Support</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations, rooms..."
                className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-100/80 hover:bg-slate-100 focus:bg-white rounded-xl border border-transparent focus:border-indigo-400 outline-none transition-colors"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 mt-3 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('rooms')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'rooms'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Rooms
              </button>
              <button
                type="button"
                onClick={() => setFilterTab('support')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  filterTab === 'support'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Support
              </button>
            </div>
          </div>

          {/* Conversations Scroll Area */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {/* If no support conv yet, show a welcoming Support prompt card */}
            {!hasSupportConversation && (filterTab === 'all' || filterTab === 'support') && (
              <div
                onClick={() => startOrGetSupportConversation()}
                className="p-4 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center gap-3 bg-gradient-to-r from-indigo-50/40 via-white to-amber-50/30"
              >
                <div className="relative shrink-0">
                  <img
                    src={supportProfile.photoURL}
                    alt="Support"
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-200"
                  />
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full text-white">
                    <ShieldCheck className="w-3 h-3" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-extrabold text-slate-900 truncate">
                      {supportProfile.profileName}
                    </h2>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase">24/7 Desk</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    Click here to message RoomSewa Janakpur Helpdesk
                  </p>
                </div>
              </div>
            )}

            {loadingConversations ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading conversations...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-semibold">No conversations found</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Browse rooms in Janakpur and click "Message Owner" to start a chat!
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const other = getOtherParticipant(conv);
                const isActive = activeConversation?.id === conv.id;
                const unread = (currentUser && conv.unreadCounts?.[currentUser.uid]) || 0;

                return (
                  <div
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`p-3.5 sm:p-4 cursor-pointer transition-all flex items-start gap-3 relative ${
                      isActive
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    {/* Participant Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <img
                        src={other.photoURL}
                        alt={other.name}
                        className="w-11 h-11 rounded-2xl object-cover bg-slate-200 border border-slate-200"
                      />
                      {other.isSupport && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full text-white">
                          <ShieldCheck className="w-3 h-3" />
                        </span>
                      )}
                      {other.role === 'owner' && !other.isSupport && (
                        <span className="absolute -bottom-1 -right-1 p-0.5 bg-amber-500 rounded-full text-white">
                          <Crown className="w-3 h-3" />
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h2 className="text-xs font-extrabold text-slate-900 truncate">
                          {other.name}
                        </h2>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                          {formatConversationTime(conv.lastMessageTime || conv.updatedAt)}
                        </span>
                      </div>

                      {/* Room tag if direct conversation */}
                      {conv.roomId && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-50 border border-amber-200/60 rounded px-1.5 py-0.5 w-fit mb-1">
                          <Building2 className="w-2.5 h-2.5 text-amber-700" />
                          <span className="truncate max-w-[170px]">{conv.roomTitle}</span>
                        </div>
                      )}

                      {/* Last message preview */}
                      <p className={`text-xs truncate ${unread > 0 ? 'font-bold text-slate-900' : 'text-slate-500'}`}>
                        {conv.lastMessage || 'No messages yet'}
                      </p>
                    </div>

                    {/* Unread badge */}
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

        {/* RIGHT PANEL: Active Chat Window */}
        <div className={`flex-1 flex flex-col bg-white ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Chat Header */}
              {(() => {
                const other = getOtherParticipant(activeConversation);
                return (
                  <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
                    <div className="flex items-center gap-3">
                      {/* Mobile Back Button */}
                      <button
                        type="button"
                        onClick={() => setActiveConversationId(null)}
                        className="p-1.5 -ml-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      <div
                        onClick={() =>
                          openViewer({
                            uid: other.uid,
                            displayName: other.name,
                            photoURL: other.photoURL,
                            role: other.role
                          })
                        }
                        className="relative cursor-pointer group select-none shrink-0"
                        title={`Click to view ${other.name}'s profile picture`}
                      >
                        <img
                          src={other.photoURL}
                          alt={other.name}
                          className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200 group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center text-white transition-opacity">
                          <Eye className="w-4 h-4" />
                        </div>
                        {other.isSupport && (
                          <span className="absolute -bottom-1 -right-1 p-0.5 bg-indigo-600 rounded-full text-white">
                            <ShieldCheck className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-sm font-extrabold text-slate-900 font-heading">
                            {other.name}
                          </h2>
                          {other.isSupport && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                              Helpdesk
                            </span>
                          )}
                          {other.role === 'owner' && !other.isSupport && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800">
                              Room Owner
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {other.isSupport
                            ? supportProfile.activeHours || 'Active now'
                            : 'RoomSewa Janakpur Verified User'}
                        </p>
                      </div>
                    </div>

                    {/* Room Mini Context Preview in Header if present */}
                    {activeConversation.roomId && (
                      <div className="hidden sm:flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200 max-w-xs">
                        {activeConversation.roomImage && (
                          <img
                            src={activeConversation.roomImage}
                            alt="Room"
                            className="w-9 h-9 rounded-lg object-cover bg-slate-200"
                          />
                        )}
                        <div className="min-w-0 pr-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {activeConversation.roomTitle}
                          </p>
                          <p className="text-[10px] font-semibold text-emerald-700">
                            Rs {activeConversation.roomPrice?.toLocaleString()}/mo • {activeConversation.roomChowk}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Messages Scroll Body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 bg-gradient-to-b from-slate-50/50 to-white">
                {/* Notice header for Support chat */}
                {activeConversation.type === 'support' && (
                  <div className="mb-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-950 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-indigo-900">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      <span>{supportProfile.profileName}</span>
                    </div>
                    <p className="text-indigo-800 leading-relaxed text-[11px]">
                      {supportProfile.description}
                    </p>
                  </div>
                )}

                {/* Gesture hint on mobile */}
                <div className="text-center my-2">
                  <span className="text-[10px] text-slate-400 bg-white px-2.5 py-1 rounded-full border border-slate-200 inline-flex items-center gap-1 shadow-2xs">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Swipe right or long-press any message to reply
                  </span>
                </div>

                {loadingMessages ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    Loading messages...
                  </div>
                ) : activeMessages.length === 0 ? (
                  <div className="text-center py-12 text-slate-400">
                    <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30 text-indigo-500" />
                    <p className="text-xs font-semibold">Start the conversation</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Send a message, photo, or voice note below.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => (
                    <MessageItem
                      key={msg.id}
                      message={msg}
                      isCurrentUser={msg.senderId === currentUser.uid}
                      onReply={(rep) => setReplyingTo(rep)}
                      onOpenPhoto={(url) => setViewingPhotoUrl(url)}
                    />
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Bottom Composer Area */}
              <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
                {/* Replying Banner */}
                {replyingTo && (
                  <div className="mb-2.5 p-2.5 bg-indigo-50 border-l-4 border-indigo-600 rounded-xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-1">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1 font-bold text-indigo-950 text-[11px]">
                        <span>Replying to {replyingTo.senderName}</span>
                      </div>
                      <p className="text-indigo-800 text-[11px] truncate mt-0.5">
                        {replyingTo.type === 'image' && '📷 Photo'}
                        {replyingTo.type === 'voice' && '🎤 Voice note'}
                        {replyingTo.text || ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="p-1 rounded-lg text-indigo-600 hover:bg-indigo-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Selected Photo Preview Banner */}
                {selectedImageBase64 && (
                  <div className="mb-2.5 p-2 bg-slate-100 rounded-2xl flex items-center gap-3 w-fit border border-slate-200">
                    <img
                      src={selectedImageBase64}
                      alt="Preview"
                      className="w-14 h-14 rounded-xl object-cover"
                    />
                    <div className="pr-2">
                      <p className="text-xs font-bold text-slate-800">Photo attached</p>
                      <button
                        type="button"
                        onClick={() => setSelectedImageBase64(null)}
                        className="text-[11px] font-semibold text-rose-600 hover:underline mt-0.5"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}

                {/* Voice Recorder or Standard Input Bar */}
                {isRecordingVoice ? (
                  <VoiceRecorder
                    onSendVoice={handleSendVoice}
                    onCancel={() => setIsRecordingVoice(false)}
                  />
                ) : (
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    {/* Hidden file input for photos */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoSelect}
                    />

                    {/* Attach Photo Button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                      title="Attach photo"
                    >
                      <Image className="w-5 h-5" />
                    </button>

                    {/* Voice Record Toggle Button */}
                    <button
                      type="button"
                      onClick={() => setIsRecordingVoice(true)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                      title="Record voice note"
                    >
                      <Mic className="w-5 h-5" />
                    </button>

                    {/* Text Input */}
                    <div className="flex-1 relative">
                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={1}
                        placeholder={
                          selectedImageBase64
                            ? 'Add a caption for this photo...'
                            : 'Type message... (Enter to send)'
                        }
                        className="w-full px-4 py-2.5 text-sm bg-slate-100 focus:bg-white rounded-2xl border border-transparent focus:border-indigo-500 outline-none resize-none max-h-28 text-slate-900"
                      />
                    </div>

                    {/* Send Button */}
                    <button
                      type="submit"
                      disabled={sending || (!inputText.trim() && !selectedImageBase64)}
                      className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white shadow-sm transition-all active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            /* Empty State when no conversation selected */
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <div className="w-16 h-16 rounded-3xl bg-indigo-100/70 text-indigo-600 flex items-center justify-center mb-4 shadow-sm">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Select a Conversation
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Choose a direct chat with a room owner or open RoomSewa Support to resolve any inquiry.
              </p>
              <button
                type="button"
                onClick={() => startOrGetSupportConversation()}
                className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open RoomSewa Support Chat</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Lightbox */}
      <PhotoViewerModal
        imageUrl={viewingPhotoUrl}
        onClose={() => setViewingPhotoUrl(null)}
      />
    </div>
  );
};
