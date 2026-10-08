import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { ChatMessage, Conversation } from '../types';

interface ChatContextType {
  conversations: Conversation[];
  activeConversationMessages: ChatMessage[];
  loadingChats: boolean;
  sendMessage: (conversationId: string, text: string, receiverId: string) => Promise<void>;
  startInquiry: (roomId: string, roomTitle: string, ownerId: string, ownerName: string, initialMessage: string) => Promise<string>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationMessages, setActiveConversationMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      setConversations([]);
      return;
    }

    const convRef = collection(db, 'inquiries');
    const unsubscribe = onSnapshot(convRef, (snapshot) => {
      const list: Conversation[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Conversation;
        if (data.seekerId === currentUser.uid || data.ownerId === currentUser.uid) {
          list.push({ id: doc.id, ...data });
        }
      });
      setConversations(list);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const sendMessage = async (conversationId: string, text: string, receiverId: string) => {
    if (!currentUser) return;
    const msgId = 'msg-' + Date.now();
    const newMsg: ChatMessage = {
      id: msgId,
      conversationId,
      senderId: currentUser.uid,
      receiverId,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      read: false
    };

    await setDoc(doc(db, 'inquiries', conversationId, 'messages', msgId), newMsg);
    await setDoc(doc(db, 'inquiries', conversationId), {
      lastMessage: text.trim(),
      lastMessageAt: new Date().toISOString()
    }, { merge: true });
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

  return (
    <ChatContext.Provider value={{
      conversations,
      activeConversationMessages,
      loadingChats,
      sendMessage,
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
