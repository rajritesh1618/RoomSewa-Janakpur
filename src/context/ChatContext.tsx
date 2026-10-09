import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, query, orderBy, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { ChatMessage, Conversation, AdminSupportProfile } from '../types';

export interface ChatContextType {
  conversations: Conversation[];
  adminSupportConversations: Conversation[];
  activeConversation: Conversation | null;
  activeConversationMessages: ChatMessage[];
  activeMessages: ChatMessage[];
  loadingChats: boolean;
  loadingConversations: boolean;
  loadingMessages: boolean;
  totalUnreadCount: number;
  adminUnreadSupportCount: number;
  supportProfile: AdminSupportProfile | null;
  notices: any[];
  setActiveConversationId: (id: string | null) => void;
  selectConversation: (conv: any) => void;
  startOrGetSupportConversation: () => Promise<Conversation | null>;
  startOrGetRoomConversation: (room: any, ...rest: any[]) => Promise<Conversation | null>;
  markConversationAsRead: (id: string) => Promise<void>;
  sendMessage: (conversationId: any, textOrPayload: any, receiverIdOrOptions?: any, ...rest: any[]) => Promise<void>;
  updateSupportProfile: (profile: Partial<AdminSupportProfile>) => Promise<void>;
  broadcastNotice: (titleOrNotice: any, ...rest: any[]) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;
  startInquiry: (roomId: string, roomTitle: string, ownerId: string, ownerName: string, initialMessage: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [supportProfile, setSupportProfile] = useState<AdminSupportProfile | null>({
    name: 'RoomSewa Support',
    statusText: 'Official Janakpur Helpdesk',
    isOnline: true
  });
  const [notices, setNotices] = useState<any[]>([
    {
      id: 'n1',
      title: 'Janakpurdham Rental Guidelines',
      content: 'Always verify property details and meet owners directly in Janakpur.'
    }
  ]);

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      setActiveConversation(null);
      setActiveMessages([]);
      return;
    }

    const convRef = collection(db, 'inquiries');
    const unsubscribe = onSnapshot(convRef, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Conversation;
        if (data.seekerId === currentUser.uid || data.ownerId === currentUser.uid || currentUser.email === 'admin@roomsewa.com') {
          list.push({ id: doc.id, ...data });
        }
      });
      setConversations(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    if (!activeConversation) {
      setActiveMessages([]);
      return;
    }

    setLoadingMessages(true);
    const messagesRef = collection(db, 'inquiries', activeConversation.id, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      setActiveMessages(list);
      setLoadingMessages(false);
    }, (err) => {
      console.warn('Error loading messages:', err);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [activeConversation]);

  const selectConversation = (conv: any) => {
    if (typeof conv === 'string') {
      const found = conversations.find(c => c.id === conv);
      setActiveConversation(found || ({ id: conv } as any));
    } else {
      setActiveConversation(conv);
    }
  };

  const setActiveConversationId = (id: string | null) => {
    if (!id) {
      setActiveConversation(null);
      return;
    }
    const found = conversations.find(c => c.id === id);
    if (found) {
      setActiveConversation(found);
    } else {
      setActiveConversation({ id } as any);
    }
  };

  const markConversationAsRead = async (id: string) => {
    if (!id) return;
    try {
      await setDoc(doc(db, 'inquiries', id), { unreadCount: 0 }, { merge: true });
    } catch (e) {
      console.warn('Error marking conversation read:', e);
    }
  };

  const startOrGetSupportConversation = async (): Promise<Conversation | null> => {
    if (!currentUser) return null;
    const supportConvId = `support-${currentUser.uid}`;
    const supportConv: Conversation = {
      id: supportConvId,
      roomId: 'support',
      roomTitle: 'RoomSewa Helpdesk',
      seekerId: currentUser.uid,
      seekerName: currentUser.displayName || 'User',
      ownerId: 'admin-support',
      ownerName: 'RoomSewa Official Support',
      lastMessage: 'How can we help you in Janakpur today?',
      lastMessageAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'inquiries', supportConvId), supportConv, { merge: true });
    setActiveConversation(supportConv);
    return supportConv;
  };

  const startOrGetRoomConversation = async (room: any, ...rest: any[]): Promise<Conversation | null> => {
    if (!currentUser) return null;
    const convId = `inq-${room.id}-${currentUser.uid}`;
    const convData: Conversation = {
      id: convId,
      roomId: room.id,
      roomTitle: room.title || 'Room',
      seekerId: currentUser.uid,
      seekerName: currentUser.displayName || 'User',
      ownerId: room.ownerId || '',
      ownerName: room.ownerName || 'Owner',
      lastMessage: 'Interested in room',
      lastMessageAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'inquiries', convId), convData, { merge: true });
    setActiveConversation(convData);
    return convData;
  };

  const sendMessage = async (
    conversationId: any, 
    textOrPayload: any, 
    receiverIdOrOptions?: any,
    ...rest: any[]
  ) => {
    if (!currentUser) return;
    const convId = typeof conversationId === 'string' ? conversationId : conversationId?.id;
    if (!convId) return;

    const msgId = 'msg-' + Date.now();
    let text = typeof textOrPayload === 'string' ? textOrPayload : textOrPayload?.text || '';
    let payloadExtra = typeof textOrPayload === 'object' ? textOrPayload : {};
    let receiverId = typeof receiverIdOrOptions === 'string' ? receiverIdOrOptions : activeConversation?.ownerId || '';

    const newMsg: ChatMessage = {
      id: msgId,
      conversationId: convId,
      senderId: currentUser.uid,
      receiverId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false,
      ...payloadExtra
    };

    await setDoc(doc(db, 'inquiries', convId, 'messages', msgId), newMsg);
    await setDoc(doc(db, 'inquiries', convId), {
      lastMessage: text.trim() || 'Attachment',
      lastMessageAt: new Date().toISOString()
    }, { merge: true });
  };

  const updateSupportProfile = async (profile: Partial<AdminSupportProfile>) => {
    setSupportProfile(prev => ({ ...(prev || {}), ...profile }));
  };

  const broadcastNotice = async (titleOrNotice: any, ...rest: any[]) => {
    const id = 'notice-' + Date.now();
    const noticeObj = typeof titleOrNotice === 'string' 
      ? { id, title: titleOrNotice, content: rest[0] || '' } 
      : { id, ...titleOrNotice };
    setNotices(prev => [...prev, noticeObj]);
  };

  const deleteNotice = async (id: string) => {
    setNotices(prev => prev.filter(n => n.id !== id));
  };

  const startInquiry = async (
    roomId: string, 
    roomTitle: string, 
    ownerId: string, 
    ownerName: string, 
    initialMessage: string
  ): Promise<string> => {
    if (!currentUser) throw new Error('Must be logged in');
    const convId = `inq-${roomId}-${currentUser.uid}`;
    
    const convData: Conversation = {
      id: convId,
      roomId,
      roomTitle,
      seekerId: currentUser.uid,
      seekerName: currentUser.displayName || 'Room Seeker',
      ownerId,
      ownerName,
      lastMessage: initialMessage,
      lastMessageAt: new Date().toISOString()
    };

    await setDoc(doc(db, 'inquiries', convId), convData, { merge: true });
    await sendMessage(convId, initialMessage, ownerId);
    return convId;
  };

  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
  const adminSupportConversations = conversations.filter(c => c.roomId === 'support' || c.id.startsWith('support-'));
  const adminUnreadSupportCount = adminSupportConversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <ChatContext.Provider value={{
      conversations,
      adminSupportConversations,
      activeConversation,
      activeConversationMessages: activeMessages,
      activeMessages,
      loadingChats,
      loadingConversations: loadingChats,
      loadingMessages,
      totalUnreadCount,
      adminUnreadSupportCount,
      supportProfile,
      notices,
      setActiveConversationId,
      selectConversation,
      startOrGetSupportConversation,
      startOrGetRoomConversation,
      markConversationAsRead,
      sendMessage,
      updateSupportProfile,
      broadcastNotice,
      deleteNotice,
      startInquiry
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};
