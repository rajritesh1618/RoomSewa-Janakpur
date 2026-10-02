import { doc, getDoc, setDoc, addDoc, collection, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';

export const SEEKER_WELCOME_MESSAGE = (name: string) => `Namaste ${name}! 🙏 Welcome to RoomSewa Janakpur!

We are excited to help you find your ideal rental room, flat, or student hostel in Janakpurdham.

Here is how to get started:
🔍 Explore Rooms: Browse verified listings across all major Chowks (Bhanu Chowk, Ramanand Chowk, Shiva Chowk, Murali Chowk, etc.).
🗺️ Interactive Google Map: View the exact rooftop location and walking distances to Janaki Mandir, RR Campus, and Hospital Road.
💬 Inquire & Chat: Click "Inquire & Chat" on any listing to directly message verified property owners in real time.
❤️ Wishlist: Save your favorite rooms to compare them anytime.

Our Support Desk is always here to help. Reply here if you need any assistance finding a room! 🏠`;

export const OWNER_WELCOME_MESSAGE = (name: string) => `Namaste ${name}! 🙏 Welcome to RoomSewa Janakpur!

Thank you for joining our community of verified property owners in Janakpurdham.

Here is how to manage your rentals and attract quality tenants:
➕ List Your Room: Click "List a Room" to publish single rooms, flats, or commercial spaces in minutes.
📍 Precise Map Pin: Drag the Google Maps pin directly onto your building rooftop so seekers can easily find you.
💬 Instant Inquiries: Receive direct inquiries and chat messages from interested seekers right in your inbox.
👑 Gold Premium Plan: Upgrade to get verified owner badges, top-of-search placement, and direct WhatsApp connect.
⚡ Manage Listings: Mark rooms as rented or update prices anytime from your Owner Dashboard.

Our Support Desk is always here to assist with listing approvals or questions. Reply here anytime. Wishing you great rentals! 🏢`;

/**
 * Sends a role-based welcome message from RoomSewa Support to the user's chat.
 * Strictly guarantees it is sent only ONCE per user after signup.
 */
export async function sendWelcomeMessageOnce(userProfile: UserProfile): Promise<boolean> {
  if (!userProfile?.uid) return false;

  // 1. Guard against duplicate calls in memory
  if (userProfile.welcomeMessageSent) {
    return false;
  }

  const userRef = doc(db, 'users', userProfile.uid);
  try {
    const userDoc = await getDoc(userRef);
    if (userDoc.exists() && userDoc.data()?.welcomeMessageSent) {
      return false;
    }
  } catch (err) {
    console.warn('Could not read user welcomeMessageSent flag:', err);
  }

  const conversationId = `support_${userProfile.uid}`;
  const convRef = doc(db, 'conversations', conversationId);
  const now = new Date().toISOString();
  const userName = userProfile.displayName || 'Friend';
  const isOwner = userProfile.role === 'owner';
  const welcomeText = isOwner
    ? OWNER_WELCOME_MESSAGE(userName)
    : SEEKER_WELCOME_MESSAGE(userName);

  const adminParticipant = {
    uid: 'admin',
    name: 'RoomSewa Janakpur Support',
    role: 'admin',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    email: 'admin@roomsewa.com'
  };

  const userParticipant = {
    uid: userProfile.uid,
    name: userProfile.displayName || 'RoomSewa User',
    role: userProfile.role || 'seeker',
    photoURL: userProfile.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.uid}`,
    email: userProfile.email || ''
  };

  try {
    // 2. Ensure support conversation exists or create it
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      await setDoc(convRef, {
        id: conversationId,
        type: 'support',
        participantIds: [userProfile.uid, 'admin'],
        participants: [userProfile.uid, 'admin'],
        participantDetails: {
          [userProfile.uid]: userParticipant,
          admin: adminParticipant
        },
        lastMessage: welcomeText,
        lastMessageTime: now,
        lastSenderId: 'admin',
        lastMessageType: 'text',
        unreadCounts: {
          [userProfile.uid]: 1,
          admin: 0
        },
        createdAt: now,
        updatedAt: now,
        status: 'active',
        supportTopic: isOwner ? 'Owner Onboarding & Support' : 'Seeker Welcome & Room Finding'
      });
    } else {
      const currentUnreads = convSnap.data()?.unreadCounts || {};
      await updateDoc(convRef, {
        lastMessage: welcomeText,
        lastMessageTime: now,
        lastSenderId: 'admin',
        unreadCounts: {
          ...currentUnreads,
          [userProfile.uid]: (currentUnreads[userProfile.uid] || 0) + 1
        },
        updatedAt: now
      });
    }

    // 3. Add message to subcollection
    const msgsCol = collection(db, 'conversations', conversationId, 'messages');
    await addDoc(msgsCol, {
      conversationId,
      senderId: 'admin',
      senderName: 'RoomSewa Janakpur Support',
      senderPhoto: adminParticipant.photoURL,
      senderRole: 'admin',
      text: welcomeText,
      type: 'text',
      readBy: ['admin'],
      createdAt: now
    });

    // 4. Mark welcomeMessageSent: true in user document
    await updateDoc(userRef, {
      welcomeMessageSent: true,
      updatedAt: now
    });

    return true;
  } catch (error) {
    console.error('Failed to send support welcome message:', error);
    return false;
  }
}
