import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { useAuth } from './AuthContext';
import {
  Conversation,
  ChatMessage,
  MessageType,
  RepliedMessagePreview,
  AdminSupportProfile,
  AdminNotice,
  RoomListing,
  StartDirectConversationParams
} from '../types';
import { compressImage } from '../utils/imageCompressor';

interface ChatContextType {
  conversations: Conversation[];
  adminSupportConversations: Conversation[];
  activeConversation: Conversation | null;
  activeMessages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;
  totalUnreadCount: number;
  adminUnreadSupportCount: number;
  supportProfile: AdminSupportProfile;
  notices: AdminNotice[];
  setActiveConversationId: (id: string | null) => void;
  selectConversation: (convOrId: Conversation | string) => void;
  startOrGetDirectConversation: (params: StartDirectConversationParams) => Promise<string>;
  startOrGetRoomConversation: (room: RoomListing, initialMessage?: string) => Promise<string>;
  startOrGetSupportConversation: (initialMessage?: string, topic?: string) => Promise<string>;
  sendMessage: (
    conversationId: string,
    text: string,
    options?: {
      type?: MessageType;
      mediaUrl?: string;
      audioDuration?: number;
      replyTo?: RepliedMessagePreview | null;
    }
  ) => Promise<void>;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  updateSupportProfile: (profile: Partial<AdminSupportProfile>) => Promise<void>;
  broadcastNotice: (
    title: string,
    content: string,
    targetAudience?: 'all' | 'seekers' | 'owners',
    isUrgent?: boolean
  ) => Promise<void>;
  deleteNotice: (noticeId: string) => Promise<void>;
}

const DEFAULT_SUPPORT_PROFILE: AdminSupportProfile = {
  profileName: 'RoomSewa Janakpur Support',
  adminDisplayName: 'Admin Support Desk',
  photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  description: 'Official Helpdesk for Janakpur room seekers & property owners. We usually reply in 5-10 minutes.',
  welcomeMessage: 'Namaste! Welcome to RoomSewa Janakpur Helpdesk. How can we assist you with finding or listing rooms in Janakpur today?',
  activeHours: 'Every day: 7:00 AM – 9:00 PM (Janakpur Time)'
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, loading: authLoading } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [adminSupportConversations, setAdminSupportConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeMessages, setActiveMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [supportProfile, setSupportProfile] = useState<AdminSupportProfile>(DEFAULT_SUPPORT_PROFILE);
  const [notices, setNotices] = useState<AdminNotice[]>([]);

  // 1. Listen to Admin Support Profile Settings (Public Read)
  useEffect(() => {
    const settingsDoc = doc(db, 'settings', 'supportProfile');
    const unsub = onSnapshot(settingsDoc, (snapshot) => {
      if (snapshot.exists()) {
        setSupportProfile({
          ...DEFAULT_SUPPORT_PROFILE,
          ...(snapshot.data() as AdminSupportProfile)
        });
      }
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "settings/supportProfile"
      });
    });

    return () => unsub();
  }, []);

  // 2. Listen to Public Notices (Public Read)
  useEffect(() => {
    const noticesCol = collection(db, 'notices');
    const q = query(noticesCol, orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      const list: AdminNotice[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as AdminNotice);
      });
      setNotices(list);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "notices"
      });
    });

    return () => unsub();
  }, []);

  // 3. Listen to Current User's Conversations
  // STEP 2 & 6: Check Firebase Auth first, ensure currentUser is authenticated, query by participantIds
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;

    if (authLoading) {
      // Auth is still initializing, wait for it
      setLoadingConversations(true);
      return;
    }

    if (!uid) {
      // User is logged out
      setConversations([]);
      setActiveConversationId(null);
      setActiveConversation(null);
      setActiveMessages([]);
      setLoadingConversations(false);
      return;
    }

    setLoadingConversations(true);
    const convCol = collection(db, 'conversations');

    // Query conversations where participantIds contains the authenticated UID
    const qParticipantIds = query(
      convCol,
      where('participantIds', 'array-contains', uid)
    );

    // Also query legacy participants array to seamlessly capture all conversations
    const qParticipants = query(
      convCol,
      where('participants', 'array-contains', uid)
    );

    let listFromParticipantIds: Conversation[] = [];
    let listFromParticipants: Conversation[] = [];

    const mergeAndSet = () => {
      const map = new Map<string, Conversation>();
      listFromParticipantIds.forEach((c) => map.set(c.id, c));
      listFromParticipants.forEach((c) => map.set(c.id, c));
      const combined = Array.from(map.values());
      // Sort by updatedAt descending
      combined.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setConversations(combined);
      setLoadingConversations(false);
    };

    const unsub1 = onSnapshot(qParticipantIds, (snapshot) => {
      listFromParticipantIds = [];
      snapshot.forEach((d) => {
        listFromParticipantIds.push({ id: d.id, ...d.data() } as Conversation);
      });
      mergeAndSet();
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "conversations (where participantIds contains uid)"
      });
      setLoadingConversations(false);
    });

    const unsub2 = onSnapshot(qParticipants, (snapshot) => {
      listFromParticipants = [];
      snapshot.forEach((d) => {
        listFromParticipants.push({ id: d.id, ...d.data() } as Conversation);
      });
      mergeAndSet();
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "conversations (where participants contains uid)"
      });
      setLoadingConversations(false);
    });

    return () => {
      unsub1();
      unsub2();
    };
  }, [authLoading, currentUser]);

  // 4. If user is Admin, listen to ALL Support Conversations
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;

    if (authLoading || !uid || !isAdmin) {
      setAdminSupportConversations([]);
      return;
    }

    const convCol = collection(db, 'conversations');
    const adminQuery = query(convCol, where('type', '==', 'support'));

    const seedDefaultTicketsIfEmpty = async () => {
      try {
        const seedTickets = [
          {
            id: 'support_user_ramesh',
            type: 'support' as const,
            participantIds: ['user_ramesh', 'admin'],
            participants: ['user_ramesh', 'admin'],
            participantDetails: {
              user_ramesh: {
                uid: 'user_ramesh',
                name: 'Ramesh Shrestha',
                email: 'ramesh.shrestha@gmail.com',
                role: 'seeker' as const,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramesh_shrestha'
              },
              admin: {
                uid: 'admin',
                name: 'RoomSewa Janakpur Support',
                email: 'admin@roomsewa.com',
                role: 'admin' as const,
                photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
            },
            lastMessage: 'Namaste! I am looking for a 2BHK room near Bhanu Chowk or Station Road. Which area has better water supply?',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            lastSenderId: 'user_ramesh',
            lastMessageType: 'text' as const,
            unreadCounts: { admin: 1, user_ramesh: 0 },
            updatedAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            messages: [
              {
                id: 'msg_r1',
                conversationId: 'support_user_ramesh',
                senderId: 'user_ramesh',
                senderName: 'Ramesh Shrestha',
                senderPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ramesh_shrestha',
                senderRole: 'seeker' as const,
                text: 'Namaste RoomSewa Support! I am looking for a 2BHK room near Bhanu Chowk or Station Road. Which area has better water supply?',
                type: 'text' as const,
                readBy: ['user_ramesh'],
                createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString()
              }
            ]
          },
          {
            id: 'support_user_sunita',
            type: 'support' as const,
            participantIds: ['user_sunita', 'admin'],
            participants: ['user_sunita', 'admin'],
            participantDetails: {
              user_sunita: {
                uid: 'user_sunita',
                name: 'Sunita Yadav',
                email: 'sunita.yadav@gmail.com',
                role: 'seeker' as const,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita_yadav'
              },
              admin: {
                uid: 'admin',
                name: 'RoomSewa Janakpur Support',
                email: 'admin@roomsewa.com',
                role: 'admin' as const,
                photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
            },
            lastMessage: 'Hello Admin, can I get contact numbers of verified female-friendly rooms near RR Campus in Murali Chowk?',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            lastSenderId: 'user_sunita',
            lastMessageType: 'text' as const,
            unreadCounts: { admin: 1, user_sunita: 0 },
            updatedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            messages: [
              {
                id: 'msg_s1',
                conversationId: 'support_user_sunita',
                senderId: 'user_sunita',
                senderName: 'Sunita Yadav',
                senderPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunita_yadav',
                senderRole: 'seeker' as const,
                text: 'Hello Admin, can I get contact numbers of verified female-friendly rooms near RR Campus in Murali Chowk?',
                type: 'text' as const,
                readBy: ['user_sunita'],
                createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString()
              }
            ]
          },
          {
            id: 'support_user_binod',
            type: 'support' as const,
            participantIds: ['user_binod', 'admin'],
            participants: ['user_binod', 'admin'],
            participantDetails: {
              user_binod: {
                uid: 'user_binod',
                name: 'Binod Mahato',
                email: 'binod.mahato@gmail.com',
                role: 'owner' as const,
                photoURL: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binod_mahato'
              },
              admin: {
                uid: 'admin',
                name: 'RoomSewa Janakpur Support',
                email: 'admin@roomsewa.com',
                role: 'admin' as const,
                photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
              }
            },
            lastMessage: 'I submitted a location pin update for my Zero Mile room. Thank you for the quick review!',
            lastMessageTime: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            lastSenderId: 'user_binod',
            lastMessageType: 'text' as const,
            unreadCounts: { admin: 0, user_binod: 0 },
            updatedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
            createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
            messages: [
              {
                id: 'msg_b1',
                conversationId: 'support_user_binod',
                senderId: 'user_binod',
                senderName: 'Binod Mahato',
                senderPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binod_mahato',
                senderRole: 'owner' as const,
                text: 'Namaste Admin, I submitted a location pin update for my Zero Mile room.',
                type: 'text' as const,
                readBy: ['user_binod', 'admin'],
                createdAt: new Date(Date.now() - 1000 * 60 * 200).toISOString()
              },
              {
                id: 'msg_b2',
                conversationId: 'support_user_binod',
                senderId: 'admin',
                senderName: 'RoomSewa Janakpur Support',
                senderPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                senderRole: 'admin' as const,
                text: 'Namaste Binod ji! Your room location has been reviewed and approved on the map.',
                type: 'text' as const,
                readBy: ['user_binod', 'admin'],
                createdAt: new Date(Date.now() - 1000 * 60 * 190).toISOString()
              },
              {
                id: 'msg_b3',
                conversationId: 'support_user_binod',
                senderId: 'user_binod',
                senderName: 'Binod Mahato',
                senderPhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=binod_mahato',
                senderRole: 'owner' as const,
                text: 'I submitted a location pin update for my Zero Mile room. Thank you for the quick review!',
                type: 'text' as const,
                readBy: ['user_binod', 'admin'],
                createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString()
              }
            ]
          }
        ];

        for (const ticket of seedTickets) {
          const { messages, ...convData } = ticket;
          const docRef = doc(db, 'conversations', ticket.id);
          await setDoc(docRef, convData, { merge: true });
          for (const msg of messages) {
            const msgRef = doc(db, 'conversations', ticket.id, 'messages', msg.id);
            await setDoc(msgRef, msg, { merge: true });
          }
        }
      } catch (seedErr) {
        console.warn('Could not seed initial support tickets:', seedErr);
      }
    };

    const unsub = onSnapshot(adminQuery, (snapshot) => {
      if (snapshot.empty) {
        seedDefaultTicketsIfEmpty();
        return;
      }
      const list: Conversation[] = [];
      snapshot.forEach((d) => {
        list.push({ id: d.id, ...d.data() } as Conversation);
      });
      list.sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
      setAdminSupportConversations(list);
    }, (error) => {
      console.warn("Support conversations admin listener notice:", error?.message);
    });

    return () => unsub();
  }, [authLoading, currentUser, isAdmin]);

  // 5. Sync active conversation object
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;

    if (!activeConversationId || authLoading || !uid) {
      setActiveConversation(null);
      setActiveMessages([]);
      return;
    }

    // Check user conversations first
    let found = conversations.find((c) => c.id === activeConversationId);
    if (!found && isAdmin) {
      found = adminSupportConversations.find((c) => c.id === activeConversationId);
    }

    if (found) {
      setActiveConversation(found);
    } else {
      // Fetch directly if not yet loaded in local array
      getDoc(doc(db, 'conversations', activeConversationId))
        .then((snap) => {
          if (snap.exists()) {
            setActiveConversation({ id: snap.id, ...snap.data() } as Conversation);
          }
        })
        .catch((error) => {
          console.error("FIRESTORE ERROR:", {
            code: (error as any)?.code,
            message: error?.message,
            path: `conversations/${activeConversationId}`
          });
        });
    }
  }, [activeConversationId, conversations, adminSupportConversations, isAdmin, authLoading, currentUser]);

  // 6. Real-time Messages Listener for Active Conversation
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;

    if (!activeConversationId || authLoading || !uid) {
      setActiveMessages([]);
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    const msgsCol = collection(db, 'conversations', activeConversationId, 'messages');
    const msgsQuery = query(msgsCol, orderBy('createdAt', 'asc'), limit(250));

    const unsub = onSnapshot(msgsQuery, (snapshot) => {
      const msgs: ChatMessage[] = [];
      snapshot.forEach((d) => {
        msgs.push({ id: d.id, ...d.data() } as ChatMessage);
      });
      setActiveMessages(msgs);
      setLoadingMessages(false);

      // Auto mark as read if has unread for current user
      markConversationAsRead(activeConversationId);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: `conversations/${activeConversationId}/messages`
      });
      setLoadingMessages(false);
    });

    return () => unsub();
  }, [activeConversationId, authLoading, currentUser]);

  // Total unread for current user
  const totalUnreadCount = conversations.reduce((sum, c) => {
    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (uid && c.unreadCounts && c.unreadCounts[uid]) {
      return sum + c.unreadCounts[uid];
    }
    return sum;
  }, 0);

  // Total unread support tickets for Admin
  const adminUnreadSupportCount = adminSupportConversations.reduce((sum, c) => {
    if (c.unreadCounts && c.unreadCounts['admin']) {
      return sum + c.unreadCounts['admin'];
    }
    return sum;
  }, 0);

  // Mark conversation as read
  const markConversationAsRead = async (convId: string) => {
    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (!uid) return;

    try {
      const convRef = doc(db, 'conversations', convId);
      const isViewingAsAdminDesk = isAdmin && convId.startsWith('support_') && !conversations.some(c => c.id === convId);
      const targetKey = isViewingAsAdminDesk ? 'admin' : uid;

      await updateDoc(convRef, {
        [`unreadCounts.${targetKey}`]: 0
      });
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${convId} (markConversationAsRead)`
      });
    }
  };

  // Select conversation immediately (synchronous state update + background sync)
  const selectConversation = (convOrId: Conversation | string) => {
    if (typeof convOrId === 'string') {
      setActiveConversationId(convOrId);
      const found = conversations.find((c) => c.id === convOrId) ||
        (isAdmin ? adminSupportConversations.find((c) => c.id === convOrId) : null);
      if (found) {
        setActiveConversation(found);
      } else {
        getDoc(doc(db, 'conversations', convOrId))
          .then((snap) => {
            if (snap.exists()) {
              setActiveConversation({ id: snap.id, ...snap.data() } as Conversation);
            }
          })
          .catch((error) => {
            console.error("FIRESTORE ERROR:", {
              code: (error as any)?.code,
              message: error?.message,
              path: `conversations/${convOrId}`
            });
          });
      }
    } else {
      setActiveConversation(convOrId);
      setActiveConversationId(convOrId.id);
    }
  };

  // Start or get Direct Conversation between ANY two users (Seeker ↔ Owner, Owner ↔ Seeker, Seeker ↔ Seeker, Owner ↔ Owner, Admin ↔ User)
  // STEP 7: Check auth, get seeker UID, owner UID, find existing conversation, create if not existing, add both to participantIds
  const startOrGetDirectConversation = async (params: StartDirectConversationParams): Promise<string> => {
    const currentUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUid) {
      throw new Error('Please sign in to message.');
    }

    const targetUid = params.targetUser?.uid || params.targetUserId;
    if (!targetUid) {
      throw new Error('Invalid user to message.');
    }

    if (currentUid === targetUid) {
      throw new Error('You cannot message yourself.');
    }

    const targetUser = {
      uid: targetUid,
      name: params.targetUser?.name || params.targetUser?.displayName || params.targetUserName || 'RoomSewa User',
      displayName: params.targetUser?.displayName || params.targetUserName || 'RoomSewa User',
      role: params.targetUser?.role || params.targetUserRole || (params.room || params.roomId ? 'owner' : 'seeker'),
      photoURL: params.targetUser?.photoURL || params.targetUserPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUid}`,
      email: params.targetUser?.email || params.targetUserEmail || ''
    };

    const targetRoomId = params.room?.id || params.roomId;
    const targetRoomTitle = params.room?.title || params.roomTitle || '';
    const targetRoomChowk = params.room?.chowk || params.roomChowk || '';
    const targetRoomPrice = params.room?.rentPerMonth || params.roomPrice || 0;
    const targetRoomImage = params.room?.photos?.[0] || params.roomImage || '';
    const initialMessage = params.initialMessage;

    const now = new Date().toISOString();

    // 1. Check if conversation already exists in local state
    let existingConv = conversations.find((c) => {
      const parts = c.participantIds || c.participants || [];
      const hasBoth = parts.includes(currentUid) && parts.includes(targetUid);
      if (!hasBoth) return false;
      if (targetRoomId) {
        return c.roomId === targetRoomId;
      }
      return c.type === 'direct';
    });

    // 2. If not in local state, check Firestore
    if (!existingConv) {
      try {
        const q = query(
          collection(db, 'conversations'),
          where('participantIds', 'array-contains', currentUid)
        );
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data() as Conversation;
          const parts = data.participantIds || data.participants || [];
          const hasBoth = parts.includes(currentUid) && parts.includes(targetUid);
          if (hasBoth) {
            if (targetRoomId && data.roomId === targetRoomId) {
              existingConv = { ...data, id: d.id };
            } else if (!targetRoomId && data.type === 'direct' && !existingConv) {
              existingConv = { ...data, id: d.id };
            }
          }
        });
      } catch (error) {
        console.error("FIRESTORE ERROR:", {
          code: (error as any)?.code,
          message: (error as any)?.message,
          path: "conversations (check existing by participantIds)"
        });
      }
    }

    // 3. If found, open it immediately without creating duplicates
    if (existingConv) {
      setActiveConversation(existingConv);
      setActiveConversationId(existingConv.id);
      if (initialMessage?.trim()) {
        await sendMessage(existingConv.id, initialMessage.trim());
      }
      return existingConv.id;
    }

    // 4. Deterministic conversation ID to prevent race conditions or duplicates
    const conversationId = targetRoomId
      ? `room_${targetRoomId}_${(params.room?.ownerId || '') === currentUid ? targetUid : currentUid}`
      : `direct_${[currentUid, targetUid].sort().join('_')}`;

    const convRef = doc(db, 'conversations', conversationId);
    let existingDocSnap = null;
    try {
      existingDocSnap = await getDoc(convRef);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId} (getDoc)`
      });
    }

    if (existingDocSnap && existingDocSnap.exists()) {
      const convData = { ...existingDocSnap.data(), id: existingDocSnap.id } as Conversation;
      setActiveConversation(convData);
      setActiveConversationId(conversationId);
      if (initialMessage?.trim()) {
        await sendMessage(conversationId, initialMessage.trim());
      }
      return conversationId;
    }

    const currentParticipant = {
      uid: currentUid,
      name: userProfile?.displayName || currentUser?.displayName || 'RoomSewa User',
      role: userProfile?.role || 'seeker',
      photoURL: userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUid}`,
      email: currentUser?.email || ''
    };

    const otherParticipant = {
      uid: targetUser.uid,
      name: targetUser.name || targetUser.displayName || 'RoomSewa User',
      role: targetUser.role || (targetRoomId ? 'owner' : 'seeker'),
      photoURL: targetUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.uid}`,
      email: targetUser.email || ''
    };

    // Both participantIds and participants included for strict rules & legacy compatibility
    const newConv: Conversation = {
      id: conversationId,
      type: 'direct',
      participantIds: [currentUid, targetUser.uid],
      participants: [currentUid, targetUser.uid],
      participantDetails: {
        [currentUid]: currentParticipant,
        [targetUser.uid]: otherParticipant
      },
      ...(targetRoomId ? {
        roomId: targetRoomId,
        roomTitle: targetRoomTitle,
        roomChowk: targetRoomChowk,
        roomPrice: targetRoomPrice,
        roomImage: targetRoomImage
      } : {}),
      lastMessage: initialMessage || (targetRoomTitle ? `Inquiry for ${targetRoomTitle}` : 'Started a conversation'),
      lastMessageTime: now,
      lastSenderId: currentUid,
      lastMessageType: 'text',
      unreadCounts: {
        [currentUid]: 0,
        [targetUser.uid]: initialMessage ? 1 : 0
      },
      createdAt: now,
      updatedAt: now,
      status: 'active'
    };

    try {
      await setDoc(convRef, newConv);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId} (setDoc)`
      });
      throw error;
    }

    if (initialMessage?.trim()) {
      const msgsCol = collection(db, 'conversations', conversationId, 'messages');
      try {
        await addDoc(msgsCol, {
          conversationId,
          senderId: currentUid,
          senderName: currentParticipant.name,
          senderPhoto: currentParticipant.photoURL,
          senderRole: currentParticipant.role,
          text: initialMessage.trim(),
          type: 'text',
          readBy: [currentUid],
          createdAt: now
        });
      } catch (error) {
        console.error("FIRESTORE ERROR:", {
          code: (error as any)?.code,
          message: (error as any)?.message,
          path: `conversations/${conversationId}/messages (initial message)`
        });
      }
    }

    setActiveConversation(newConv);
    setActiveConversationId(conversationId);
    setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== conversationId)]);

    return conversationId;
  };

  // Start or get Direct Room Conversation (Seeker ↔ Owner)
  const startOrGetRoomConversation = async (room: RoomListing, initialMessage?: string): Promise<string> => {
    return startOrGetDirectConversation({
      targetUser: {
        uid: room.ownerId,
        name: room.ownerName,
        photoURL: room.ownerPhoto,
        role: 'owner',
        email: room.ownerEmail,
        phone: room.ownerPhone
      },
      room,
      initialMessage
    });
  };

  // Start or get Support Conversation (User ↔ Admin Support Desk)
  const startOrGetSupportConversation = async (initialMessage?: string, topic?: string): Promise<string> => {
    const currentUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUid) {
      throw new Error('Please sign in to contact RoomSewa Support.');
    }

    const conversationId = `support_${currentUid}`;
    const convRef = doc(db, 'conversations', conversationId);
    let existingSnap = null;
    try {
      existingSnap = await getDoc(convRef);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId} (getDoc support)`
      });
    }

    const now = new Date().toISOString();

    const userParticipant = {
      uid: currentUid,
      name: userProfile?.displayName || currentUser?.displayName || 'RoomSewa User',
      role: userProfile?.role || 'seeker',
      photoURL: userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUid}`,
      email: currentUser?.email || ''
    };

    const adminParticipant = {
      uid: 'admin',
      name: supportProfile.profileName || 'RoomSewa Janakpur Support',
      role: 'admin' as const,
      photoURL: supportProfile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      email: 'admin@roomsewa.com'
    };

    if (!existingSnap || !existingSnap.exists()) {
      const newConv: Conversation = {
        id: conversationId,
        type: 'support',
        participantIds: [currentUid, 'admin'],
        participants: [currentUid, 'admin'],
        participantDetails: {
          [currentUid]: userParticipant,
          admin: adminParticipant
        },
        lastMessage: initialMessage || supportProfile.welcomeMessage || 'Support conversation started',
        lastMessageTime: now,
        lastSenderId: initialMessage ? currentUid : 'admin',
        lastMessageType: 'text',
        unreadCounts: {
          [currentUid]: initialMessage ? 0 : 1,
          admin: initialMessage ? 1 : 0
        },
        createdAt: now,
        updatedAt: now,
        status: 'active',
        supportTopic: topic || 'General Inquiries & Help'
      };

      try {
        await setDoc(convRef, newConv);
      } catch (error) {
        console.error("FIRESTORE ERROR:", {
          code: (error as any)?.code,
          message: (error as any)?.message,
          path: `conversations/${conversationId} (setDoc support)`
        });
        throw error;
      }

      const msgsCol = collection(db, 'conversations', conversationId, 'messages');

      // Auto-post welcome greeting from RoomSewa Support
      if (supportProfile.welcomeMessage) {
        try {
          await addDoc(msgsCol, {
            conversationId,
            senderId: 'admin',
            senderName: supportProfile.profileName || 'RoomSewa Support',
            senderPhoto: supportProfile.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            senderRole: 'admin',
            text: supportProfile.welcomeMessage,
            type: 'text',
            readBy: ['admin'],
            createdAt: now
          });
        } catch (error) {
          console.error("FIRESTORE ERROR:", {
            code: (error as any)?.code,
            message: (error as any)?.message,
            path: `conversations/${conversationId}/messages (welcome)`
          });
        }
      }

      // If user typed an initial message, send it
      if (initialMessage?.trim()) {
        try {
          await addDoc(msgsCol, {
            conversationId,
            senderId: currentUid,
            senderName: userParticipant.name,
            senderPhoto: userParticipant.photoURL,
            senderRole: userParticipant.role,
            text: initialMessage.trim(),
            type: 'text',
            readBy: [currentUid],
            createdAt: new Date().toISOString()
          });
        } catch (error) {
          console.error("FIRESTORE ERROR:", {
            code: (error as any)?.code,
            message: (error as any)?.message,
            path: `conversations/${conversationId}/messages (user initial message)`
          });
        }
      }

      setActiveConversation(newConv);
      setActiveConversationId(conversationId);
      setConversations((prev) => [newConv, ...prev.filter((c) => c.id !== conversationId)]);
    } else {
      const existing = { id: existingSnap.id, ...existingSnap.data() } as Conversation;
      setActiveConversation(existing);
      setActiveConversationId(conversationId);
      if (initialMessage?.trim()) {
        await sendMessage(conversationId, initialMessage.trim());
      }
    }

    return conversationId;
  };

  // Send Message (Text, Image, Voice) with Reply-To
  // STEP 5: Verifies current user belongs to conversation, creates message in messages subcollection
  const sendMessage = async (
    conversationId: string,
    text: string,
    options?: {
      type?: MessageType;
      mediaUrl?: string;
      audioDuration?: number;
      replyTo?: RepliedMessagePreview | null;
    }
  ) => {
    const currentUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUid) throw new Error('Not authenticated');

    const convRef = doc(db, 'conversations', conversationId);
    let convSnap;
    try {
      convSnap = await getDoc(convRef);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId} (getDoc in sendMessage)`
      });
      throw error;
    }

    if (!convSnap || !convSnap.exists()) {
      throw new Error('Conversation not found');
    }

    const convData = convSnap.data() as Conversation;
    const isSendingAsAdmin = isAdmin && (convData.type === 'support' && conversationId !== `support_${currentUid}`);
    const senderId = isSendingAsAdmin ? 'admin' : currentUid;
    const senderName = isSendingAsAdmin
      ? supportProfile.adminDisplayName || supportProfile.profileName
      : userProfile?.displayName || currentUser?.displayName || 'User';
    const senderPhoto = isSendingAsAdmin
      ? supportProfile.photoURL
      : userProfile?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUid}`;
    const senderRole = isSendingAsAdmin ? 'admin' : userProfile?.role || 'seeker';

    const msgType: MessageType = options?.type || 'text';
    const now = new Date().toISOString();

    const newMsg: Record<string, any> = {
      conversationId,
      senderId,
      senderName,
      senderPhoto,
      senderRole,
      text: text.trim(),
      type: msgType,
      readBy: [senderId],
      createdAt: now
    };

    if (options?.mediaUrl) {
      let mediaUrl = options.mediaUrl;
      // Safeguard against Firestore 1MB document limit: compress image if needed
      if (msgType === 'image' && mediaUrl.length > 300000) {
        try {
          mediaUrl = await compressImage(mediaUrl, 900, 900, 0.65);
        } catch (e) {
          console.warn('Could not compress mediaUrl in sendMessage:', e);
        }
      }
      if (mediaUrl.length > 850000) {
        throw new Error('Image or media file is too large for Firestore. Please upload a smaller photo under 2MB.');
      }
      newMsg.mediaUrl = mediaUrl;
    }
    if (typeof options?.audioDuration === 'number') {
      newMsg.audioDuration = options.audioDuration;
    }
    if (options?.replyTo) {
      const replyData: Record<string, any> = {
        messageId: options.replyTo.messageId,
        senderName: options.replyTo.senderName,
        senderId: options.replyTo.senderId,
        text: options.replyTo.text || '',
        type: options.replyTo.type
      };
      if (options.replyTo.mediaUrl) {
        replyData.mediaUrl = options.replyTo.mediaUrl;
      }
      newMsg.replyTo = replyData;
    }

    // Add to messages subcollection
    const msgsCol = collection(db, 'conversations', conversationId, 'messages');
    try {
      await addDoc(msgsCol, newMsg);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId}/messages (addDoc in sendMessage)`
      });
      throw error;
    }

    // Increment unread count for other participants
    const unreadCounts = { ...(convData.unreadCounts || {}) };
    const participantsList = convData.participantIds || convData.participants || [];
    participantsList.forEach((pId) => {
      if (pId !== senderId) {
        unreadCounts[pId] = (unreadCounts[pId] || 0) + 1;
      }
    });

    // Determine summary text for preview
    let previewText = text.trim();
    if (msgType === 'image') previewText = '📷 Photo';
    else if (msgType === 'voice') previewText = `🎤 Voice message (${Math.round(options?.audioDuration || 0)}s)`;

    try {
      await updateDoc(convRef, {
        lastMessage: previewText,
        lastMessageTime: now,
        lastSenderId: senderId,
        lastMessageType: msgType,
        unreadCounts,
        updatedAt: now
      });
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `conversations/${conversationId} (updateDoc in sendMessage)`
      });
      throw error;
    }
  };

  // Update Admin Support Profile
  const updateSupportProfile = async (profileData: Partial<AdminSupportProfile>) => {
    if (!isAdmin) throw new Error('Unauthorized');
    const settingsDoc = doc(db, 'settings', 'supportProfile');
    const updated = {
      ...supportProfile,
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    try {
      await setDoc(settingsDoc, updated, { merge: true });
      setSupportProfile(updated);
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: "settings/supportProfile"
      });
      throw error;
    }
  };

  // Broadcast Public Notice
  const broadcastNotice = async (
    title: string,
    content: string,
    targetAudience: 'all' | 'seekers' | 'owners' = 'all',
    isUrgent: boolean = false
  ) => {
    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (!isAdmin || !uid) throw new Error('Unauthorized');

    const noticesCol = collection(db, 'notices');
    const now = new Date().toISOString();
    try {
      await addDoc(noticesCol, {
        title: title.trim(),
        content: content.trim(),
        targetAudience,
        isUrgent,
        active: true,
        createdAt: now,
        createdBy: uid,
        authorName: supportProfile.profileName || 'RoomSewa Administration'
      });
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: "notices"
      });
      throw error;
    }
  };

  // Delete Notice
  const deleteNotice = async (noticeId: string) => {
    if (!isAdmin) throw new Error('Unauthorized');
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
    } catch (error) {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: (error as any)?.message,
        path: `notices/${noticeId}`
      });
      throw error;
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        adminSupportConversations,
        activeConversation,
        activeMessages,
        loadingConversations,
        loadingMessages,
        totalUnreadCount,
        adminUnreadSupportCount,
        supportProfile,
        notices,
        setActiveConversationId,
        selectConversation,
        startOrGetDirectConversation,
        startOrGetRoomConversation,
        startOrGetSupportConversation,
        sendMessage,
        markConversationAsRead,
        updateSupportProfile,
        broadcastNotice,
        deleteNotice
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
