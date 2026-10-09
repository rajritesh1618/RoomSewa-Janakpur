import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { RoomListing, PremiumRequest } from '../types';

export interface RoomContextType {
  rooms: RoomListing[];
  loading: boolean;
  savedRoomIds: string[];
  toggleSaveRoom: (roomId: string) => Promise<void>;
  addRoom: (roomData: any) => Promise<string>;
  updateRoom: (id: string, updates: Partial<RoomListing>) => Promise<void>;
  deleteRoom: (id: string) => Promise<void>;
  toggleAvailability: (id: string, currentStatus: boolean) => Promise<void>;
  togglePremium: (id: string, currentStatus: boolean) => Promise<void>;
  approveRoom: (id: string) => Promise<void>;

  // Premium requests
  premiumRequests: PremiumRequest[];
  approvePremiumRequest: (id: string, ...rest: any[]) => Promise<void>;
  rejectPremiumRequest: (id: string, ...rest: any[]) => Promise<void>;
  setUserPremiumStatus: (userId: string, status: boolean) => Promise<void>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

const initialSampleRooms: RoomListing[] = [
  {
    id: 'room-1',
    title: 'Spacious 2BHK Flat near Janaki Mandir',
    description: 'Beautiful 2BHK flat with ample sunlight, modern marble flooring, continuous 24/7 boring water, and private rooftop access in the peaceful core of Janakpurdham.',
    chowk: 'Janaki Mandir',
    address: 'Near Janaki Temple West Gate, Ward 4',
    rent: 12000,
    roomType: '2bhk',
    available: true,
    facilities: ['High-Speed Wi-Fi', '24/7 Water Supply', 'Attached Bathroom', 'Separate Kitchen', 'Balcony / Terrace', 'Bike/Car Parking'],
    images: ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80'],
    ownerId: 'owner-sample-1',
    ownerName: 'Ram Narayan Jha',
    ownerPhone: '9844012345',
    isPremium: true,
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'room-2',
    title: 'Modern Single Room at Ramanand Chowk',
    description: 'Clean and quiet single room suitable for students and working professionals. Close to hospital, markets, and public transit with individual electric sub-meter.',
    chowk: 'Ramanand Chowk',
    address: 'Hospital Road, Ramanand Chowk',
    rent: 4500,
    roomType: 'single',
    available: true,
    facilities: ['24/7 Water Supply', 'High-Speed Wi-Fi', 'Bike/Car Parking'],
    images: ['https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80'],
    ownerId: 'owner-sample-2',
    ownerName: 'Sita Kumari Yadav',
    ownerPhone: '9807123456',
    isPremium: false,
    approved: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'room-3',
    title: '1BHK Family Apartment at Bhanu Chowk',
    description: 'Fully tiled 1BHK apartment with separate kitchen and attached western toilet. Peaceful residential area with wide motorable road access.',
    chowk: 'Bhanu Chowk',
    address: 'Station Road, Bhanu Chowk',
    rent: 8000,
    roomType: '1bhk',
    available: true,
    facilities: ['Attached Bathroom', 'Separate Kitchen', '24/7 Water Supply', 'CCTV Security'],
    images: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80'],
    ownerId: 'owner-sample-3',
    ownerName: 'Manoj Kumar Sah',
    isPremium: true,
    approved: true,
    createdAt: new Date().toISOString()
  }
];

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rooms, setRooms] = useState<RoomListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedRoomIds, setSavedRoomIds] = useState<string[]>([]);
  const [premiumRequests, setPremiumRequests] = useState<PremiumRequest[]>([]);

  useEffect(() => {
    const roomsCol = collection(db, 'rooms');
    const roomsQuery = query(roomsCol, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const list: RoomListing[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as RoomListing);
        });
        setRooms(list);
      } else {
        initialSampleRooms.forEach(async (r) => {
          await setDoc(doc(db, 'rooms', r.id), r).catch(console.error);
        });
        setRooms(initialSampleRooms);
      }
      setLoading(false);
    }, (err) => {
      console.warn('Real-time rooms listener error:', err);
      setRooms(initialSampleRooms);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleSaveRoom = async (roomId: string) => {
    setSavedRoomIds(prev => 
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId]
    );
  };

  const addRoom = async (roomData: any): Promise<string> => {
    const id = 'room-' + Date.now();
    const newRoom: RoomListing = {
      ...roomData,
      id,
      available: true,
      approved: true,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'rooms', id), newRoom);
    return id;
  };

  const updateRoom = async (id: string, updates: Partial<RoomListing>) => {
    await updateDoc(doc(db, 'rooms', id), updates);
  };

  const deleteRoom = async (id: string) => {
    await deleteDoc(doc(db, 'rooms', id));
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'rooms', id), { available: !currentStatus });
  };

  const togglePremium = async (id: string, currentStatus: boolean) => {
    await updateDoc(doc(db, 'rooms', id), { isPremium: !currentStatus });
  };

  const approveRoom = async (id: string) => {
    await updateDoc(doc(db, 'rooms', id), { approved: true, approvalStatus: 'approved' });
  };

  const approvePremiumRequest = async (id: string, ...rest: any[]) => {
    setPremiumRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved' } : r));
  };

  const rejectPremiumRequest = async (id: string, ...rest: any[]) => {
    setPremiumRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'rejected' } : r));
  };

  const setUserPremiumStatus = async (userId: string, status: boolean) => {
    const userRooms = rooms.filter(r => r.ownerId === userId);
    for (const r of userRooms) {
      await updateDoc(doc(db, 'rooms', r.id), { isPremium: status });
    }
  };

  return (
    <RoomContext.Provider value={{
      rooms,
      loading,
      savedRoomIds,
      toggleSaveRoom,
      addRoom,
      updateRoom,
      deleteRoom,
      toggleAvailability,
      togglePremium,
      approveRoom,
      premiumRequests,
      approvePremiumRequest,
      rejectPremiumRequest,
      setUserPremiumStatus
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRooms = () => {
  const context = useContext(RoomContext);
  if (!context) throw new Error('useRooms must be used within a RoomProvider');
  return context;
};
