export interface RoomListing {
  id: string;
  title: string;
  description: string;
  chowk: string;
  address: string;
  rent: number;
  roomType: 'single' | 'double' | '1bhk' | '2bhk' | 'flat' | 'commercial';
  available: boolean;
  facilities: string[];
  images: string[];
  ownerId: string;
  ownerName: string;
  ownerPhone?: string; // Optional phone number
  isPremium?: boolean;
  createdAt: string;
  approved?: boolean;
  floor?: string;
  waterSupply?: string;
  electricityMeter?: string;
  includedCharges?: string[];
}

export interface AmenityFeature {
  id: string;
  name: string;
  icon?: string;
  category?: 'essential' | 'comfort' | 'utilities' | 'rules';
  isActive: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone?: string; // Strictly optional
  role: 'seeker' | 'owner' | 'admin';
  avatarUrl?: string;
  savedRooms?: string[];
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  roomId: string;
  roomTitle: string;
  seekerId: string;
  seekerName: string;
  ownerId: string;
  ownerName: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount?: number;
}
