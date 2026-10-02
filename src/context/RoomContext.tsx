import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db, auth, isSuperAdminEmail } from '../lib/firebase';
import {
  RoomListing,
  RoomEditableFields,
  PendingEditPayload,
  ChowkLocation,
  InterestedInquiry,
  PremiumRequest,
  SavedRoomRecord,
  ApprovalStatus,
  RoomStatus
} from '../types';
import { DEFAULT_CHOWKS, INITIAL_ROOMS_DATA } from '../data/mockData';
import { useAuth } from './AuthContext';
import { useContent } from './ContentContext';
import { sanitizeForFirestore, cleanCustomFeatures } from '../utils/sanitizeFirestore';

interface RoomContextType {
  rooms: RoomListing[];
  chowks: ChowkLocation[];
  savedRoomIds: string[];
  inquiries: InterestedInquiry[];
  premiumRequests: PremiumRequest[];
  loadingRooms: boolean;
  loadingChowks: boolean;

  // Room Actions
  addRoom: (room: Omit<RoomListing, 'id' | 'createdAt' | 'updatedAt' | 'approvalStatus'>) => Promise<string>;
  updateRoom: (id: string, updates: Partial<RoomListing>) => Promise<void>;
  submitRoomEdit: (roomId: string, editedFields: RoomEditableFields) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  toggleRoomStatus: (id: string, currentStatus: 'available' | 'rented') => Promise<void>;
  incrementRoomView: (id: string) => Promise<void>;

  // Admin Room Actions
  approveRoom: (id: string) => Promise<void>;
  rejectRoom: (id: string, reason: string) => Promise<void>;
  approveRoomEdit: (roomId: string) => Promise<void>;
  rejectRoomEdit: (roomId: string, reason: string) => Promise<void>;
  adminUpdateRoom: (id: string, updates: Partial<RoomListing>) => Promise<void>;
  toggleRoomHidden: (id: string, currentHidden?: boolean) => Promise<void>;
  restoreRoom: (id: string) => Promise<void>;

  // Chowk Actions (Admin)
  addChowk: (name: string, wardNo?: string, popularLandmark?: string, order?: number, isHidden?: boolean) => Promise<void>;
  updateChowk: (id: string, updates: Partial<ChowkLocation>) => Promise<void>;
  deleteChowk: (id: string) => Promise<void>;
  toggleChowkHidden: (id: string, currentHidden?: boolean) => Promise<void>;
  reorderChowk: (id: string, newOrder: number) => Promise<void>;

  // Seeker Interactions
  toggleSaveRoom: (roomId: string) => Promise<void>;
  submitInquiry: (roomId: string, message: string) => Promise<void>;
  markInquiryContacted: (inquiryId: string) => Promise<void>;

  // Premium Actions
  requestPremium: (
    paymentMethod: PremiumRequest['paymentMethod'],
    transactionRef?: string,
    receiptUrl?: string,
    details?: {
      paymentMethodId?: string;
      amountNPR?: number;
      senderName?: string;
      senderPhone?: string;
    }
  ) => Promise<void>;
  approvePremiumRequest: (requestId: string, targetUserId: string) => Promise<void>;
  rejectPremiumRequest: (requestId: string, reason?: string) => Promise<void>;
  setUserPremiumStatus: (targetUserId: string, isPremium: boolean) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, isAdmin, isPremium, updateUserProfile, loading: authLoading } = useAuth();
  const { premiumConfig } = useContent();
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [chowks, setChowks] = useState<ChowkLocation[]>([]);
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);
  const [inquiries, setInquiries] = useState<InterestedInquiry[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingChowks, setLoadingChowks] = useState(true);

  // 1. Listen to Chowks / Locations
  useEffect(() => {
    const chowksCol = collection(db, 'chowks');
    const unsubscribe = onSnapshot(chowksCol, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default Janakpur chowks if database collection is empty
        try {
          for (const ch of DEFAULT_CHOWKS) {
            await setDoc(doc(db, 'chowks', ch.id), ch);
          }
        } catch (e: any) {
          console.error("FIRESTORE ERROR:", {
            code: e?.code,
            message: e?.message,
            path: "chowks (seed)"
          });
          setChowks(DEFAULT_CHOWKS);
        }
      } else {
        const loaded: ChowkLocation[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as ChowkLocation);
        });
        setChowks(loaded);
      }
      setLoadingChowks(false);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "chowks"
      });
      setChowks(DEFAULT_CHOWKS);
      setLoadingChowks(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Listen to Rooms
  useEffect(() => {
    const roomsCol = collection(db, 'rooms');
    const unsubscribe = onSnapshot(roomsCol, async (snapshot) => {
      if (snapshot.empty) {
        // Seed initial Janakpur room listings so the platform has rich immediate utility
        try {
          for (const initial of INITIAL_ROOMS_DATA) {
            const newRef = doc(roomsCol);
            await setDoc(newRef, {
              ...initial,
              id: newRef.id
            });
          }
        } catch (e: any) {
          console.error("FIRESTORE ERROR:", {
            code: e?.code,
            message: e?.message,
            path: "rooms (seed)"
          });
          const fallback = INITIAL_ROOMS_DATA.map((r, i) => ({ ...r, id: `seed-room-${i}` } as RoomListing));
          setRooms(fallback);
        }
      } else {
        const loaded: RoomListing[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({ id: docSnap.id, ...docSnap.data() } as RoomListing);
        });
        // Sort: Premium & featured first, then newest
        loaded.sort((a, b) => {
          if (a.isOwnerPremium && !b.isOwnerPremium) return -1;
          if (!a.isOwnerPremium && b.isOwnerPremium) return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        setRooms(loaded);
      }
      setLoadingRooms(false);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "rooms"
      });
      const fallback = INITIAL_ROOMS_DATA.map((r, i) => ({ ...r, id: `seed-room-${i}` } as RoomListing));
      setRooms(fallback);
      setLoadingRooms(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Listen to Saved Rooms for current user (Wait for Auth)
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (authLoading || !uid) {
      setSavedRoomIds([]);
      return;
    }
    const savedCol = collection(db, 'savedRooms');
    const q = query(savedCol, where('userId', '==', uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ids: string[] = [];
      snapshot.forEach((docSnap) => {
        ids.push(docSnap.data().roomId);
      });
      setSavedRoomIds(ids);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "savedRooms"
      });
    });

    return () => unsubscribe();
  }, [authLoading, currentUser]);

  // 4. Listen to Inquiries (Seekers see their own, Owners see inquiries for their rooms, Admins see all)
  useEffect(() => {
    const uid = auth.currentUser?.uid || currentUser?.uid;
    if (authLoading || !uid) {
      setInquiries([]);
      return;
    }
    const inqCol = collection(db, 'inquiries');
    const unsubscribe = onSnapshot(inqCol, (snapshot) => {
      const loaded: InterestedInquiry[] = [];
      snapshot.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as InterestedInquiry);
      });
      loaded.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setInquiries(loaded);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "inquiries"
      });
    });

    return () => unsubscribe();
  }, [authLoading, currentUser]);

  // 5. Listen to Premium Requests (Admin view & user's own status)
  useEffect(() => {
    if (!currentUser || authLoading) {
      setPremiumRequests([]);
      return;
    }
    const isAdmin = userProfile?.role === 'admin';
    const premCol = collection(db, 'premiumRequests');
    const premQuery = isAdmin
      ? premCol
      : query(premCol, where('userId', '==', currentUser.uid));

    const unsubscribe = onSnapshot(premQuery, (snapshot) => {
      const loaded: PremiumRequest[] = [];
      snapshot.forEach((d) => {
        loaded.push({ id: d.id, ...d.data() } as PremiumRequest);
      });
      loaded.sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
      setPremiumRequests(loaded);
    }, (error) => {
      console.error("FIRESTORE ERROR:", {
        code: (error as any)?.code,
        message: error?.message,
        path: "premiumRequests"
      });
    });

    return () => unsubscribe();
  }, [currentUser, authLoading, userProfile?.role]);

  // 6. Auto-sync lifetime listing status for owners with pre-existing rooms
  useEffect(() => {
    if (!currentUser || authLoading || !userProfile) return;
    const userOwnedRooms = rooms.filter((r) => r.ownerId === currentUser.uid);
    if (userOwnedRooms.length > 0) {
      const needsSync = !userProfile.hasUsedFreeListing || (userProfile.lifetimeListingCount || 0) < userOwnedRooms.length;
      if (needsSync) {
        const userRef = doc(db, 'users', currentUser.uid);
        const newCount = Math.max(userOwnedRooms.length, userProfile.lifetimeListingCount || 0, 1);
        updateDoc(userRef, {
          hasUsedFreeListing: true,
          lifetimeListingCount: newCount,
          updatedAt: new Date().toISOString()
        }).catch((err) => console.warn('Sync lifetime listing count notice:', err));
        if (updateUserProfile) {
          updateUserProfile({
            hasUsedFreeListing: true,
            lifetimeListingCount: newCount
          });
        }
      }
    }
  }, [currentUser, authLoading, userProfile, rooms, updateUserProfile]);

  // Helper to send owner notifications and support messages on approval/rejection
  const sendOwnerApprovalNotification = async ({
    ownerId,
    type,
    title,
    message,
    roomId
  }: {
    ownerId: string;
    type: 'room_approved' | 'room_rejected' | 'room_edit_approved' | 'room_edit_rejected';
    title: string;
    message: string;
    roomId: string;
  }) => {
    if (!ownerId) return;
    const now = new Date().toISOString();

    // 1. Send user notification (seen in notification bell)
    try {
      await addDoc(collection(db, 'userNotifications'), {
        userId: ownerId,
        type,
        title,
        message,
        roomId,
        read: false,
        createdAt: now
      });
    } catch (err) {
      console.warn('Could not post user notification:', err);
    }

    // 2. Send support message into owner conversation (seen in Messages)
    try {
      const convId = `support_${ownerId}`;
      const convRef = doc(db, 'conversations', convId);
      await setDoc(
        convRef,
        {
          id: convId,
          type: 'support',
          participantIds: [ownerId, 'admin'],
          participants: [ownerId, 'admin'],
          lastMessage: message,
          lastMessageAt: now,
          lastMessageTime: now,
          lastSenderId: 'admin',
          lastMessageType: 'notice',
          unreadCounts: {
            [ownerId]: 1,
            admin: 0
          },
          updatedAt: now,
          status: 'active'
        },
        { merge: true }
      );

      const msgsCol = collection(db, 'conversations', convId, 'messages');
      await addDoc(msgsCol, {
        conversationId: convId,
        roomId,
        sender: 'Admin',
        senderId: 'admin',
        senderName: 'RoomSewa Admin',
        senderRole: 'admin',
        receiver: 'Owner',
        receiverId: ownerId,
        text: `${title}\n\n${message}`,
        messageText: `${title}\n\n${message}`,
        type: 'notice',
        messageType: 'system/admin',
        readBy: ['admin'],
        createdAt: now
      });
    } catch (msgErr) {
      console.warn('Could not post support chat notification:', msgErr);
    }
  };

  // Actions: Add Room
  // STRICT RULE: An owner gets ONLY ONE FREE ROOM LISTING EVER based on lifetime listing history
  // Listing status for new rooms created by owners = Pending Approval
  const addRoom = async (roomData: Omit<RoomListing, 'id' | 'createdAt' | 'updatedAt' | 'approvalStatus'>) => {
    const currentUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUid) {
      throw new Error('Please sign in to list a room on RoomSewa Janakpur.');
    }

    const userRef = doc(db, 'users', currentUid);
    let userData = userProfile;
    try {
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        userData = userSnap.data() as any;
      }
    } catch (e) {
      console.warn('Could not read user profile for listing check:', e);
    }

    const isUserAdmin = isAdmin || userData?.role === 'admin';
    const isUserPremium = isPremium || userData?.isPremium === true;
    const hasUsedFree = Boolean(
      userData?.hasUsedFreeListing === true ||
      (userData?.lifetimeListingCount && userData.lifetimeListingCount >= 1) ||
      rooms.some((r) => r.ownerId === currentUid)
    );

    // Premium restrictions apply ONLY when Premium System is active (ON)
    const isPremiumSystemActive = Boolean(premiumConfig?.enabled);

    // If Premium System is ON, check if not admin, not premium, and has already used their 1 lifetime free listing
    if (isPremiumSystemActive && !isUserAdmin && !isUserPremium && hasUsedFree) {
      throw new Error('Your free room listing has already been used. Premium is required to list another room.');
    }

    const roomsCol = collection(db, 'rooms');
    const newDocRef = doc(roomsCol);
    const now = new Date().toISOString();
    
    // NEW ROOMS MUST BE PENDING APPROVAL (Unless Admin creates directly)
    const approvalStatus: ApprovalStatus = isUserAdmin ? 'approved' : 'pending';

    const cleanFeatures = roomData.customFeatures
      ? cleanCustomFeatures(roomData.customFeatures)
      : undefined;

    const fullRoom: RoomListing = {
      ...roomData,
      ownerId: currentUid,
      ...(cleanFeatures ? { customFeatures: cleanFeatures } : {}),
      id: newDocRef.id,
      approvalStatus,
      status: 'available',
      createdAt: now,
      updatedAt: now,
      viewsCount: 0
    };

    // STRICT REQUIREMENT: Recursively sanitize and remove all undefined values before setDoc
    await setDoc(newDocRef, sanitizeForFirestore(fullRoom));

    // Permanently record that this owner has used their one free listing and increment lifetime count
    const prevCount = userData?.lifetimeListingCount || 0;
    const nextCount = Math.max(1, prevCount + 1);
    try {
      await updateDoc(userRef, sanitizeForFirestore({
        hasUsedFreeListing: true,
        lifetimeListingCount: nextCount,
        updatedAt: now
      }));
      if (updateUserProfile) {
        updateUserProfile({
          hasUsedFreeListing: true,
          lifetimeListingCount: nextCount
        });
      }
    } catch (profileErr) {
      console.warn('Could not update user lifetime listing count:', profileErr);
    }

    // Create Admin notification for new listing waiting for approval
    try {
      await addDoc(collection(db, 'adminNotifications'), sanitizeForFirestore({
        type: 'new_room_pending',
        title: 'New room listing submitted for approval',
        message: `New room listing "${fullRoom.title}" (${fullRoom.chowk}) submitted by ${fullRoom.ownerName} is waiting for admin approval.`,
        targetTab: 'rooms',
        relatedId: newDocRef.id,
        read: false,
        createdAt: now
      }));
    } catch {
      // Non-blocking
    }

    return newDocRef.id;
  };

  // Update Room (Generic or direct update)
  const updateRoom = async (id: string, updates: Partial<RoomListing>) => {
    const roomRef = doc(db, 'rooms', id);
    const safeUpdates: Partial<RoomListing> = { ...updates };
    if (safeUpdates.customFeatures !== undefined) {
      safeUpdates.customFeatures = cleanCustomFeatures(safeUpdates.customFeatures);
    }
    await updateDoc(roomRef, sanitizeForFirestore({
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    }));
  };

  // Submit Room Edit:
  // 1. If an already-approved room is publicly listed and the Owner edits ANY listing information:
  //    - Previously approved/public version remains intact and visible to seekers.
  //    - Changes saved into pendingEdit payload and editStatus set to 'pending'.
  // 2. If the room was previously rejected, the owner is correcting the listing:
  //    - Update the room fields directly and transition approvalStatus back to 'pending'!
  // 3. If Admin is editing, changes apply immediately.
  const submitRoomEdit = async (roomId: string, editedFields: RoomEditableFields) => {
    const currentUid = auth.currentUser?.uid || currentUser?.uid;
    if (!currentUid) {
      throw new Error('Please sign in to update this room listing.');
    }

    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) {
      throw new Error('Room listing not found.');
    }

    // Security check: Owner can edit ONLY their own listing, unless Admin
    if (!isAdmin && targetRoom.ownerId !== currentUid) {
      throw new Error('Permission denied: You can edit ONLY your own room listings.');
    }

    const now = new Date().toISOString();

    const safeEditedFields = { ...editedFields };
    if (safeEditedFields.customFeatures !== undefined) {
      safeEditedFields.customFeatures = cleanCustomFeatures(safeEditedFields.customFeatures);
    }

    // If Admin is editing, Admin changes apply immediately without needing self-approval
    if (isAdmin) {
      await updateRoom(roomId, {
        ...safeEditedFields,
        approvalStatus: 'approved',
        editStatus: 'none',
        pendingEdit: null,
        updatedAt: now
      });
      return;
    }

    // Case A: Correcting a previously rejected listing -> transition back to 'pending'
    if (targetRoom.approvalStatus === 'rejected') {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, sanitizeForFirestore({
        ...safeEditedFields,
        approvalStatus: 'pending',
        rejectionReason: '',
        rejectedAt: null,
        editStatus: 'none',
        pendingEdit: null,
        updatedAt: now
      }));

      // Notify Admin about resubmitted listing
      try {
        await addDoc(collection(db, 'adminNotifications'), sanitizeForFirestore({
          type: 'new_room_pending',
          title: 'Resubmitted Room Listing for Approval',
          message: `Owner ${targetRoom.ownerName} corrected and resubmitted "${safeEditedFields.title || targetRoom.title}" for approval.`,
          targetTab: 'rooms',
          relatedId: roomId,
          read: false,
          createdAt: now
        }));
      } catch {}
      return;
    }

    // Case B: Updating a listing that is already pending initial approval
    if (targetRoom.approvalStatus === 'pending') {
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, sanitizeForFirestore({
        ...safeEditedFields,
        updatedAt: now
      }));
      return;
    }

    // Case C: Editing an already APPROVED room!
    // Check if an edit is already pending
    if (targetRoom.editStatus === 'pending') {
      throw new Error('An edit is already pending approval by the Admin. Please wait for the current review to complete before submitting further changes.');
    }

    // Identify changed fields and previous values
    const changedFieldKeys: string[] = [];
    const previousValues: Partial<RoomEditableFields> = {};

    (Object.keys(safeEditedFields) as (keyof RoomEditableFields)[]).forEach((key) => {
      const oldVal = (targetRoom as any)[key];
      const newVal = safeEditedFields[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changedFieldKeys.push(key);
        (previousValues as any)[key] = oldVal;
      }
    });

    const pendingEditPayload: PendingEditPayload = sanitizeForFirestore({
      ...safeEditedFields,
      submittedAt: now,
      submittedBy: currentUid,
      submittedByName: userProfile?.displayName || currentUser?.displayName || targetRoom.ownerName,
      submittedByEmail: currentUser?.email || targetRoom.ownerEmail,
      changedFieldKeys,
      previousValues
    });

    // Keep existing public version intact!
    // Set editStatus = 'pending', listing approvalStatus stays 'approved'
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, sanitizeForFirestore({
      editStatus: 'pending',
      pendingEdit: pendingEditPayload,
      lastEditSubmittedAt: now,
      lastEditRejectionReason: '',
      updatedAt: now
    }));

    // Create Admin notification for room edit
    try {
      await addDoc(collection(db, 'adminNotifications'), {
        type: 'room_edit',
        title: 'Room Edit Submitted for Approval',
        message: `Owner ${targetRoom.ownerName} submitted edits for "${targetRoom.title}". Review proposed changes.`,
        targetTab: 'rooms',
        relatedId: roomId,
        read: false,
        createdAt: now
      });
    } catch {
      // Non-blocking
    }
  };

  // Admin approves new room:
  // Changes status to Approved / Active, becomes publicly visible, notifies Owner
  const approveRoom = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Permission denied: Only Admin can approve room listings.');
    }

    const targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) {
      throw new Error('Room listing not found.');
    }

    const now = new Date().toISOString();
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, sanitizeForFirestore({
      approvalStatus: 'approved',
      rejectionReason: '',
      approvedAt: now,
      status: 'available',
      updatedAt: now
    }));

    // Send Owner notification & support chat message
    await sendOwnerApprovalNotification({
      ownerId: targetRoom.ownerId,
      type: 'room_approved',
      title: 'Room Listing Approved! 🎉',
      message: 'Your room listing has been approved and is now visible to the public.',
      roomId: id
    });
  };

  // Admin rejects new room:
  // Requires rejection reason, status = Rejected, saves reason, notifies Owner
  const rejectRoom = async (id: string, reason: string) => {
    if (!isAdmin) {
      throw new Error('Permission denied: Only Admin can reject room listings.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required before rejecting a room listing.');
    }

    const targetRoom = rooms.find((r) => r.id === id);
    if (!targetRoom) {
      throw new Error('Room listing not found.');
    }

    const cleanReason = reason.trim();
    const now = new Date().toISOString();
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, sanitizeForFirestore({
      approvalStatus: 'rejected',
      rejectionReason: cleanReason,
      rejectedAt: now,
      updatedAt: now
    }));

    // Send Owner notification & support chat message
    await sendOwnerApprovalNotification({
      ownerId: targetRoom.ownerId,
      type: 'room_rejected',
      title: 'Room Listing Rejected',
      message: `Your room listing "${targetRoom.title}" was rejected by Admin.\n\nReason:\n${cleanReason}\n\nPlease edit your listing to correct the issue and submit for approval again.`,
      roomId: id
    });
  };

  // Admin approves pending edit:
  // Applies changes to public listing, updates status back to Approved / Active, removes pending-change state, notifies Owner
  const approveRoomEdit = async (roomId: string) => {
    if (!isAdmin) {
      throw new Error('Permission denied: Only Admin can approve room edits.');
    }

    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom || !targetRoom.pendingEdit) {
      throw new Error('No pending edit found for this room.');
    }

    const pending = targetRoom.pendingEdit;
    const now = new Date().toISOString();

    // Clean payload without metadata keys
    const {
      submittedAt,
      submittedBy,
      submittedByName,
      submittedByEmail,
      changedFieldKeys,
      previousValues,
      ...cleanUpdates
    } = pending;

    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, sanitizeForFirestore({
      ...cleanUpdates,
      approvalStatus: 'approved',
      editStatus: 'approved',
      pendingEdit: null,
      lastEditReviewedAt: now,
      lastEditRejectionReason: '',
      updatedAt: now
    }));

    // Send Owner notification & support chat message
    await sendOwnerApprovalNotification({
      ownerId: targetRoom.ownerId,
      type: 'room_edit_approved',
      title: 'Room Changes Approved! 🎉',
      message: 'Your room listing changes have been approved and are now visible to the public.',
      roomId
    });
  };

  // Admin rejects pending edit:
  // Requires rejection reason, keeps previously approved version public and unchanged, notifies Owner
  const rejectRoomEdit = async (roomId: string, reason: string) => {
    if (!isAdmin) {
      throw new Error('Permission denied: Only Admin can reject room edits.');
    }
    if (!reason || !reason.trim()) {
      throw new Error('Rejection reason is required before rejecting room edits.');
    }

    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) {
      throw new Error('Room listing not found.');
    }

    const cleanReason = reason.trim();
    const now = new Date().toISOString();
    const roomRef = doc(db, 'rooms', roomId);
    await updateDoc(roomRef, sanitizeForFirestore({
      editStatus: 'rejected',
      pendingEdit: null,
      lastEditReviewedAt: now,
      lastEditRejectionReason: cleanReason,
      updatedAt: now
    }));

    // Send Owner notification & support chat message
    await sendOwnerApprovalNotification({
      ownerId: targetRoom.ownerId,
      type: 'room_edit_rejected',
      title: 'Room Update Rejected',
      message: `Your recent room listing changes were rejected.\n\nReason:\n${cleanReason}\n\nYour previous approved listing remains visible to the public. You can edit and resubmit your changes again.`,
      roomId
    });
  };

  // Toggle room availability status between 'available' and 'rented'
  // Reuses the existing updateRoom function to preserve Firestore schemas and prevent duplicate logic
  const toggleRoomStatus = async (id: string, currentStatus?: 'available' | 'rented') => {
    try {
      const targetRoom = rooms.find((r) => r.id === id);
      const effectiveCurrent = currentStatus || targetRoom?.status || 'available';
      const nextStatus: 'available' | 'rented' = effectiveCurrent === 'available' ? 'rented' : 'available';

      await updateRoom(id, {
        status: nextStatus
      });
    } catch (err: any) {
      console.error('FIRESTORE ERROR: Failed to toggle room status:', err);
      // Safe error handling so a Firestore failure does not crash the React application
      throw new Error(err?.message || 'Could not update room availability status. Please try again.');
    }
  };

  // Increment room view count safely
  const incrementRoomView = async (id: string) => {
    try {
      const room = rooms.find((r) => r.id === id);
      const currentViews = room?.viewsCount || 0;
      const roomRef = doc(db, 'rooms', id);
      await updateDoc(roomRef, {
        viewsCount: currentViews + 1
      });
    } catch (err) {
      console.warn('Could not increment room view count:', err);
    }
  };

  // Robust central deleteRoom function:
  // 1. Admin: Can delete ANY room on the platform.
  // 2. Owner: Can delete ONLY their own room listings (matching ownerId === user.uid).
  // 3. Immediately updates UI and removes room cleanly without throwing errors if already removed.
  const deleteRoom = async (roomId: string) => {
    const user = auth.currentUser || currentUser;
    if (!user) {
      throw new Error('You must be logged in to delete a room.');
    }

    const targetRoomInMemory = rooms.find((r) => r.id === roomId);
    const roomRef = doc(db, 'rooms', roomId);
    let roomData: Partial<RoomListing> | null = null;

    try {
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        roomData = roomSnap.data() as Partial<RoomListing>;
      }
    } catch (fetchErr) {
      console.warn('Could not read room doc from Firestore before deletion:', fetchErr);
    }

    // 1. Admin verification: Admins can delete ANY room regardless of owner
    let userIsAdmin = Boolean(
      isAdmin ||
      userProfile?.role === 'admin' ||
      isSuperAdminEmail(user.email)
    );

    if (!userIsAdmin) {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data()?.role === 'admin') {
          userIsAdmin = true;
        }
      } catch (err) {
        console.warn('Could not verify admin status in Firestore:', err);
      }
    }

    // 2. Owner verification: Owner can delete ONLY their own room (ownerId === user.uid)
    const effectiveOwnerId = roomData?.ownerId || targetRoomInMemory?.ownerId;
    const isOwner = Boolean(effectiveOwnerId && effectiveOwnerId === user.uid);

    if (!userIsAdmin && !isOwner) {
      throw new Error('Permission denied: You can delete only your own room listings.');
    }

    // 3. Perform Firestore deletion if document exists
    try {
      await deleteDoc(roomRef);
    } catch (delErr: any) {
      // If error is permission or network, rethrow with clear message
      console.error('Failed to delete room doc in Firestore:', delErr);
      throw new Error(delErr?.message || 'Failed to delete room document from database.');
    }

    // 4. Immediately remove from local state to refresh UI instantaneously
    setRooms((prev) => prev.filter((r) => r.id !== roomId));
    setSavedRoomIds((prev) => prev.filter((id) => id !== roomId));
  };

  // Admin restores a deleted room
  const restoreRoom = async (id: string) => {
    if (!isAdmin) {
      throw new Error('Permission denied: Only Admin can restore deleted room listings.');
    }
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, {
      isDeleted: false,
      approvalStatus: 'approved',
      status: 'available',
      updatedAt: new Date().toISOString()
    });
  };

  const adminUpdateRoom = async (id: string, updates: Partial<RoomListing>) => {
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleRoomHidden = async (id: string, currentHidden?: boolean) => {
    const roomRef = doc(db, 'rooms', id);
    await updateDoc(roomRef, {
      isHidden: !currentHidden,
      updatedAt: new Date().toISOString()
    });
  };

  // Chowk Actions
  const addChowk = async (name: string, wardNo?: string, popularLandmark?: string, order?: number, isHidden?: boolean) => {
    const id = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const chowkRef = doc(db, 'chowks', id);
    await setDoc(chowkRef, {
      id,
      name,
      wardNo: wardNo || '',
      popularLandmark: popularLandmark || '',
      order: order ?? chowks.length + 1,
      isHidden: isHidden ?? false
    });
  };

  const updateChowk = async (id: string, updates: Partial<ChowkLocation>) => {
    const chowkRef = doc(db, 'chowks', id);
    await updateDoc(chowkRef, updates);
  };

  const deleteChowk = async (id: string) => {
    const chowkRef = doc(db, 'chowks', id);
    await deleteDoc(chowkRef);
  };

  const toggleChowkHidden = async (id: string, currentHidden?: boolean) => {
    const chowkRef = doc(db, 'chowks', id);
    await updateDoc(chowkRef, {
      isHidden: !currentHidden
    });
  };

  const reorderChowk = async (id: string, newOrder: number) => {
    const chowkRef = doc(db, 'chowks', id);
    await updateDoc(chowkRef, {
      order: newOrder
    });
  };

  // Seeker Actions: Save / Wishlist
  const toggleSaveRoom = async (roomId: string) => {
    if (!currentUser) return;
    const isSaved = savedRoomIds.includes(roomId);
    const savedDocId = `${currentUser.uid}_${roomId}`;
    const docRef = doc(db, 'savedRooms', savedDocId);

    if (isSaved) {
      await deleteDoc(docRef);
      setSavedRoomIds(prev => prev.filter(id => id !== roomId));
    } else {
      const newSave: SavedRoomRecord = {
        id: savedDocId,
        userId: currentUser.uid,
        roomId,
        savedAt: new Date().toISOString()
      };
      await setDoc(docRef, newSave);
      setSavedRoomIds(prev => [...prev, roomId]);
    }
  };

  // Seeker inquiry
  const submitInquiry = async (roomId: string, message: string) => {
    if (!currentUser) throw new Error('Must be logged in to contact owner');
    const targetRoom = rooms.find(r => r.id === roomId);
    if (!targetRoom) throw new Error('Room not found');

    const inqCol = collection(db, 'inquiries');
    const newInquiry: Omit<InterestedInquiry, 'id'> = {
      roomId,
      roomTitle: targetRoom.title,
      roomChowk: targetRoom.chowk,
      roomRent: targetRoom.rentPerMonth,
      ownerId: targetRoom.ownerId,
      seekerId: currentUser.uid,
      seekerName: userProfile?.displayName || currentUser.displayName || 'Interested Seeker',
      seekerPhone: userProfile?.phoneNumber || '',
      seekerEmail: currentUser.email || '',
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    await addDoc(inqCol, newInquiry);
  };

  const markInquiryContacted = async (inquiryId: string) => {
    const ref = doc(db, 'inquiries', inquiryId);
    await updateDoc(ref, { status: 'contacted' });
  };

  // Premium Management
  const requestPremium = async (
    paymentMethod: PremiumRequest['paymentMethod'],
    transactionRef?: string,
    receiptUrl?: string,
    details?: {
      paymentMethodId?: string;
      amountNPR?: number;
      senderName?: string;
      senderPhone?: string;
    }
  ) => {
    if (!currentUser) throw new Error('Must be logged in to upgrade');
    const reqCol = collection(db, 'premiumRequests');
    const now = new Date().toISOString();
    const newReq: Omit<PremiumRequest, 'id'> = {
      userId: currentUser.uid,
      userName: details?.senderName || userProfile?.displayName || currentUser.displayName || 'User',
      userEmail: currentUser.email || '',
      userPhone: details?.senderPhone || userProfile?.phoneNumber || '',
      requestedAt: now,
      status: 'pending',
      paymentMethod,
      paymentMethodId: details?.paymentMethodId,
      amountNPR: details?.amountNPR || 200,
      transactionReference: transactionRef || '',
      proofImageUrl: receiptUrl || '',
      senderName: details?.senderName || userProfile?.displayName || currentUser.displayName || 'User',
      senderPhone: details?.senderPhone || userProfile?.phoneNumber || ''
    };
    const reqDoc = await addDoc(reqCol, newReq);

    // Update user profile status to pending
    const userRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userRef, { premiumStatus: 'pending' });

    // Notify Admin Desk
    try {
      await addDoc(collection(db, 'adminNotifications'), {
        type: 'premium_payment',
        title: 'New Premium Payment Request',
        message: `${newReq.userName} submitted Rs ${newReq.amountNPR} via ${paymentMethod} (Ref: ${transactionRef || 'Direct'})`,
        targetTab: 'payments',
        relatedId: reqDoc.id,
        read: false,
        createdAt: now
      });
    } catch {
      // Non-blocking
    }
  };

  const approvePremiumRequest = async (requestId: string, targetUserId?: string) => {
    if (!requestId) {
      throw new Error('Payment Request ID is required for approval.');
    }

    const reqRef = doc(db, 'premiumRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      throw new Error(`Payment request ${requestId} not found in database.`);
    }

    const reqData = reqSnap.data() as PremiumRequest;
    if (reqData.status === 'approved') {
      throw new Error('This payment request has already been approved.');
    }

    let finalUserId = (targetUserId || reqData.userId || '').trim();
    if (!finalUserId && reqData.userEmail) {
      try {
        const usersCol = collection(db, 'users');
        const qEmail = query(usersCol, where('email', '==', reqData.userEmail));
        const emailSnap = await getDocs(qEmail);
        if (!emailSnap.empty) {
          finalUserId = emailSnap.docs[0].id;
        }
      } catch (err) {
        console.warn('Error querying user by email:', err);
      }
    }

    if (!finalUserId) {
      const matchRoom = rooms.find(
        (r) =>
          (reqData.userEmail && r.ownerEmail === reqData.userEmail) ||
          (reqData.userName && r.ownerName === reqData.userName)
      );
      if (matchRoom) {
        finalUserId = matchRoom.ownerId;
      }
    }

    if (!finalUserId) {
      finalUserId = `owner_${requestId}`;
    }

    const now = new Date().toISOString();
    const reviewerName = currentUser?.displayName || currentUser?.email || 'Admin';

    // 1. Update Payment Request status
    await updateDoc(reqRef, {
      status: 'approved',
      reviewedAt: now,
      reviewedBy: reviewerName
    });

    // 2. Activate Premium permanently for that exact owner account
    const userRef = doc(db, 'users', finalUserId);
    await setDoc(userRef, {
      uid: finalUserId,
      isPremium: true,
      premiumStatus: 'active',
      premiumPurchasedAt: now,
      updatedAt: now
    }, { merge: true });

    // Also update any matching user by email if different
    if (reqData.userEmail) {
      try {
        const usersCol = collection(db, 'users');
        const qEmail = query(usersCol, where('email', '==', reqData.userEmail));
        const emailSnap = await getDocs(qEmail);
        for (const docSnap of emailSnap.docs) {
          if (docSnap.id !== finalUserId) {
            await setDoc(doc(db, 'users', docSnap.id), {
              isPremium: true,
              premiumStatus: 'active',
              premiumPurchasedAt: now,
              updatedAt: now
            }, { merge: true });
          }
        }
      } catch (emailSyncErr) {
        console.warn('Sync by email notice:', emailSyncErr);
      }
    }

    // 3. Update all room listings owned by this user
    const userRooms = rooms.filter(
      (r) => r.ownerId === finalUserId || (reqData.userEmail && r.ownerEmail === reqData.userEmail)
    );
    for (const r of userRooms) {
      try {
        await updateRoom(r.id, { isOwnerPremium: true });
      } catch (roomUpdateErr) {
        console.warn(`Failed to update premium badge for room ${r.id}:`, roomUpdateErr);
      }
    }

    // 4. Send Approval message to Owner's Messages section from Admin
    try {
      const convId = `support_${finalUserId}`;
      const convRef = doc(db, 'conversations', convId);
      const approvalMessage = `Your Premium payment has been approved! 👑\n\nYour Lifetime Gold Landlord status is now active. All your room listings have been highlighted with verified Gold badges.`;

      await setDoc(convRef, {
        id: convId,
        type: 'support',
        participantIds: [finalUserId, 'admin'],
        participants: [finalUserId, 'admin'],
        participantDetails: {
          [finalUserId]: {
            uid: finalUserId,
            name: reqData.userName || reqData.senderName || 'Owner',
            role: 'owner',
            email: reqData.userEmail || ''
          },
          admin: {
            uid: 'admin',
            name: 'Admin',
            role: 'admin',
            email: currentUser?.email || 'admin@roomsewa.com'
          }
        },
        lastMessage: 'Your Premium payment has been approved! 👑',
        lastMessageTime: now,
        lastSenderId: 'admin',
        lastMessageType: 'notice',
        unreadCounts: {
          [finalUserId]: 1,
          admin: 0
        },
        updatedAt: now,
        status: 'active'
      }, { merge: true });

      const msgsCol = collection(db, 'conversations', convId, 'messages');
      await addDoc(msgsCol, {
        conversationId: convId,
        paymentRequestId: requestId,
        sender: 'Admin',
        senderId: 'admin',
        senderName: 'Admin',
        senderRole: 'admin',
        receiver: 'Owner',
        receiverId: finalUserId,
        text: approvalMessage,
        messageText: approvalMessage,
        type: 'notice',
        messageType: 'system/admin',
        readBy: ['admin'],
        createdAt: now
      });
    } catch (msgErr) {
      console.warn('Failed to send approval message:', msgErr);
    }

    // 5. Create user notification
    try {
      await addDoc(collection(db, 'userNotifications'), {
        userId: finalUserId,
        type: 'premium_approved',
        title: 'Premium Payment Approved! 👑',
        message: 'Your payment has been approved! Lifetime Gold status is now active on your account.',
        paymentRequestId: requestId,
        read: false,
        createdAt: now
      });
    } catch (notifErr) {
      console.warn('Failed to send user notification:', notifErr);
    }

    // 6. Update local state immediately
    setPremiumRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: 'approved', reviewedAt: now, reviewedBy: reviewerName } : r)
    );

    // If target is current user, update userProfile immediately
    if (currentUser?.uid === finalUserId && updateUserProfile) {
      updateUserProfile({ isPremium: true, premiumStatus: 'active' });
    }
  };

  const rejectPremiumRequest = async (requestId: string, reason?: string) => {
    if (!requestId) {
      throw new Error('Payment Request ID is required for rejection.');
    }
    const trimmedReason = (reason || '').trim();
    if (!trimmedReason) {
      throw new Error('Please enter a reason for rejecting this payment.');
    }

    const reqRef = doc(db, 'premiumRequests', requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      throw new Error(`Payment request ${requestId} not found.`);
    }

    const reqData = reqSnap.data() as PremiumRequest;
    const finalUserId = reqData.userId;
    const now = new Date().toISOString();
    const reviewerName = currentUser?.displayName || currentUser?.email || 'Admin';

    // 1. Update Payment Request status and reasons
    await updateDoc(reqRef, {
      status: 'rejected',
      adminNotes: trimmedReason,
      rejectionReason: trimmedReason,
      reviewedAt: now,
      reviewedBy: reviewerName
    });

    // 2. Save rejected status and reason with exact user account in database
    if (finalUserId) {
      const userRef = doc(db, 'users', finalUserId);
      await setDoc(userRef, {
        uid: finalUserId,
        isPremium: false,
        premiumStatus: 'rejected',
        rejectionReason: trimmedReason,
        rejectionDate: now,
        reviewedAt: now,
        rejectedBy: reviewerName,
        rejectedPaymentMethod: reqData.paymentMethod,
        rejectedAmountNPR: reqData.amountNPR || 200,
        rejectedTransactionRef: reqData.transactionReference || '',
        rejectedRequestId: requestId,
        updatedAt: now
      }, { merge: true });
    }

    // 3. Create message in Owner's Messages section from Admin
    if (finalUserId) {
      try {
        const convId = `support_${finalUserId}`;
        const convRef = doc(db, 'conversations', convId);
        const rejectionMessage = `Your Premium payment was rejected.\n\nReason: ${trimmedReason}`;

        await setDoc(convRef, {
          id: convId,
          type: 'support',
          participantIds: [finalUserId, 'admin'],
          participants: [finalUserId, 'admin'],
          participantDetails: {
            [finalUserId]: {
              uid: finalUserId,
              name: reqData.userName || reqData.senderName || 'Owner',
              role: 'owner',
              email: reqData.userEmail || ''
            },
            admin: {
              uid: 'admin',
              name: 'Admin',
              role: 'admin',
              email: currentUser?.email || 'admin@roomsewa.com'
            }
          },
          lastMessage: `Your Premium payment was rejected. Reason: ${trimmedReason}`,
          lastMessageTime: now,
          lastSenderId: 'admin',
          lastMessageType: 'notice',
          unreadCounts: {
            [finalUserId]: 1,
            admin: 0
          },
          updatedAt: now,
          status: 'active'
        }, { merge: true });

        // Save Admin rejection message in database with all required fields:
        // conversation/user ID, payment request ID, sender = Admin, receiver = Owner,
        // message text, rejection reason, createdAt, message type = system/admin
        const msgsCol = collection(db, 'conversations', convId, 'messages');
        await addDoc(msgsCol, {
          conversationId: convId,
          paymentRequestId: requestId,
          sender: 'Admin',
          senderId: 'admin',
          senderName: 'Admin',
          senderRole: 'admin',
          receiver: 'Owner',
          receiverId: finalUserId,
          text: rejectionMessage,
          messageText: rejectionMessage,
          rejectionReason: trimmedReason,
          type: 'notice',
          messageType: 'system/admin',
          readBy: ['admin'],
          createdAt: now
        });
      } catch (chatErr) {
        console.warn('Failed to send rejection chat message:', chatErr);
      }

      // Also create a notification for the Owner
      try {
        await addDoc(collection(db, 'userNotifications'), {
          userId: finalUserId,
          type: 'premium_rejected',
          title: 'Premium Payment Rejected',
          message: `Your Premium payment was rejected. Reason: ${trimmedReason}`,
          rejectionReason: trimmedReason,
          paymentRequestId: requestId,
          read: false,
          createdAt: now
        });
      } catch (notifErr) {
        console.warn('Failed to send rejection notification:', notifErr);
      }
    }

    // 4. Update local state
    setPremiumRequests(prev =>
      prev.map(r => r.id === requestId ? {
        ...r,
        status: 'rejected',
        adminNotes: trimmedReason,
        rejectionReason: trimmedReason,
        reviewedAt: now,
        reviewedBy: reviewerName
      } : r)
    );

    // If target is current user, update userProfile immediately
    if (currentUser?.uid === finalUserId && updateUserProfile) {
      updateUserProfile({
        isPremium: false,
        premiumStatus: 'rejected',
        rejectionReason: trimmedReason,
        rejectionDate: now
      });
    }
  };

  // Direct manual grant/revoke by Admin
  const setUserPremiumStatus = async (targetUserId: string, isPremium: boolean) => {
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      isPremium,
      premiumStatus: isPremium ? 'active' : 'none',
      premiumPurchasedAt: isPremium ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    });

    // Update all rooms owned by this user
    const userRooms = rooms.filter((r) => r.ownerId === targetUserId);
    for (const r of userRooms) {
      await updateRoom(r.id, { isOwnerPremium: isPremium });
    }
  };

  return (
    <RoomContext.Provider
      value={{
        rooms,
        chowks,
        savedRoomIds,
        inquiries,
        premiumRequests,
        loadingRooms,
        loadingChowks,
        addRoom,
        updateRoom,
        submitRoomEdit,
        deleteRoom,
        toggleRoomStatus,
        incrementRoomView,
        approveRoom,
        rejectRoom,
        approveRoomEdit,
        rejectRoomEdit,
        adminUpdateRoom,
        toggleRoomHidden,
        restoreRoom,
        addChowk,
        updateChowk,
        deleteChowk,
        toggleChowkHidden,
        reorderChowk,
        toggleSaveRoom,
        submitInquiry,
        markInquiryContacted,
        requestPremium,
        approvePremiumRequest,
        rejectPremiumRequest,
        setUserPremiumStatus
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRooms must be used within a RoomProvider');
  }
  return context;
};
