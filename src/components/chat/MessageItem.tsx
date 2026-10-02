import React, { useState, useRef } from 'react';
import { Reply, Check, Clock, ShieldCheck, Crown } from 'lucide-react';
import { ChatMessage, RepliedMessagePreview } from '../../types';
import { AudioPlayer } from './AudioPlayer';
import { useProfilePicture } from '../../context/ProfilePictureContext';

interface MessageItemProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  onReply: (preview: RepliedMessagePreview) => void;
  onOpenPhoto: (url: string) => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isCurrentUser,
  onReply,
  onOpenPhoto
}) => {
  const { openViewer } = useProfilePicture();
  const [swipeOffset, setSwipeOffset] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const longPressTimer = useRef<any>(null);
  const isSwiping = useRef(false);

  const handleReplyClick = () => {
    onReply({
      messageId: message.id,
      senderName: message.senderName,
      senderId: message.senderId,
      text: message.text,
      type: message.type,
      mediaUrl: message.mediaUrl
    });
  };

  // Touch Handlers for Mobile: Right-swipe and Long-press
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    isSwiping.current = false;

    // Start long-press timer (500ms)
    longPressTimer.current = setTimeout(() => {
      if (!isSwiping.current) {
        if ('vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch (err) {
            // ignore
          }
        }
        handleReplyClick();
      }
    }, 500);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // If user is scrolling vertically, cancel reply
    if (Math.abs(deltaY) > 15) {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      setSwipeOffset(0);
      return;
    }

    // Right-swipe detected
    if (deltaX > 15) {
      isSwiping.current = true;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      const bounded = Math.min(deltaX, 70);
      setSwipeOffset(bounded);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    if (swipeOffset >= 45) {
      handleReplyClick();
    }
    setSwipeOffset(0);
    isSwiping.current = false;
  };

  const formatTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isSupportAdmin = message.senderRole === 'admin' || message.senderId === 'admin';

  return (
    <div
      className={`relative group flex gap-2.5 my-1.5 transition-transform select-none ${
        isCurrentUser ? 'flex-row-reverse' : 'flex-row'
      }`}
      style={{
        transform: swipeOffset > 0 ? `translateX(${swipeOffset}px)` : undefined
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Swipe Indicator */}
      {swipeOffset > 20 && (
        <div className="absolute left-[-30px] top-1/2 -translate-y-1/2 text-indigo-600 animate-pulse">
          <Reply className="w-5 h-5" />
        </div>
      )}

      {/* Sender Avatar */}
      {!isCurrentUser && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            openViewer({
              uid: message.senderId,
              displayName: message.senderName,
              photoURL: message.senderPhoto,
              role: message.senderRole
            });
          }}
          className="shrink-0 self-end mb-1 cursor-pointer group select-none"
          title={`Click to view ${message.senderName}'s profile picture`}
        >
          <img
            src={
              message.senderPhoto ||
              `https://api.dicebear.com/7.x/avataaars/svg?seed=${message.senderId}`
            }
            alt={message.senderName}
            className="w-7 h-7 rounded-full object-cover bg-slate-200 border border-slate-300 group-hover:scale-110 transition-transform shadow-2xs"
          />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Name if not current user */}
        {!isCurrentUser && (
          <div className="flex items-center gap-1.5 mb-1 ml-1 text-[11px] font-semibold text-slate-500">
            <span>{message.senderName}</span>
            {isSupportAdmin && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                <ShieldCheck className="w-2.5 h-2.5" />
                Support
              </span>
            )}
            {message.senderRole === 'owner' && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                <Crown className="w-2.5 h-2.5" />
                Owner
              </span>
            )}
          </div>
        )}

        {/* The Bubble */}
        <div
          className={`relative rounded-2xl p-3 shadow-xs transition-colors ${
            isCurrentUser
              ? 'bg-indigo-600 text-white rounded-br-xs'
              : isSupportAdmin
              ? 'bg-slate-900 text-white rounded-bl-xs'
              : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'
          }`}
        >
          {/* Replied Message Quote Header */}
          {message.replyTo && (
            <div
              className={`mb-2 p-2 rounded-xl text-xs border-l-3 transition-colors ${
                isCurrentUser
                  ? 'bg-indigo-700/70 border-amber-300 text-indigo-100'
                  : isSupportAdmin
                  ? 'bg-slate-800 border-indigo-400 text-slate-300'
                  : 'bg-slate-50 border-indigo-600 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-1 font-bold text-[11px] opacity-90">
                <Reply className="w-3 h-3 rotate-180" />
                <span>{message.replyTo.senderName}</span>
              </div>
              <p className="line-clamp-2 mt-0.5 text-[11px] opacity-80">
                {message.replyTo.type === 'image' && '📷 Photo'}
                {message.replyTo.type === 'voice' && '🎤 Voice note'}
                {message.replyTo.text || ''}
              </p>
            </div>
          )}

          {/* Photo Media */}
          {message.type === 'image' && message.mediaUrl && (
            <div className="mb-2 rounded-xl overflow-hidden cursor-pointer group/img">
              <img
                src={message.mediaUrl}
                alt="Chat attachment"
                onClick={() => onOpenPhoto(message.mediaUrl!)}
                className="max-h-64 sm:max-h-80 w-auto rounded-xl object-cover hover:opacity-95 transition-opacity"
              />
            </div>
          )}

          {/* Voice Note */}
          {message.type === 'voice' && message.mediaUrl && (
            <div className="my-1">
              <AudioPlayer
                src={message.mediaUrl}
                durationSeconds={message.audioDuration}
                isOutgoing={isCurrentUser}
              />
            </div>
          )}

          {/* Text Message */}
          {message.text && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {message.text}
            </p>
          )}

          {/* Timestamp and Delivery Status */}
          <div
            className={`flex items-center gap-1 mt-1 text-[10px] select-none ${
              isCurrentUser ? 'text-indigo-200 justify-end' : isSupportAdmin ? 'text-slate-400' : 'text-slate-400'
            }`}
          >
            <span>{formatTime(message.createdAt)}</span>
            {isCurrentUser && <Check className="w-3 h-3 text-indigo-300" />}
          </div>
        </div>

        {/* Hover / Action Bar (Desktop Reply button) */}
        <div
          className={`absolute top-2 hidden group-hover:flex items-center gap-1 bg-white/90 backdrop-blur shadow-md rounded-full px-2 py-1 border border-slate-200 transition-opacity z-10 ${
            isCurrentUser ? 'right-full mr-2' : 'left-full ml-2'
          }`}
        >
          <button
            type="button"
            onClick={handleReplyClick}
            className="text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center gap-1"
            title="Reply to this message"
          >
            <Reply className="w-3.5 h-3.5" />
            <span className="text-[10px]">Reply</span>
          </button>
        </div>
      </div>
    </div>
  );
};
