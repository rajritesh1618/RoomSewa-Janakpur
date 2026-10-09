export type UserRole = 'seeker' | 'owner' | 'admin' | string;

export interface ChowkLocation {
  id: string;
  name: string;
  wardNo?: string;
  popularLandmark?: string;
  [key: string]: any;
}

export type FeatureInputType = 'number' | 'boolean' | 'text' | 'select' | 'single_select' | 'price' | 'price_unit' | string;

export interface RoomFeatureOption {
  id?: string;
  name?: string;
  order?: number;
  isHidden?: boolean;
  isDisabled?: boolean;
  [key: string]: any;
}

export type FeatureOption = RoomFeatureOption;

export interface RoomFeature {
  id: string;
  name: string;
  icon?: string;
  category?: string;
  description?: string;
  order?: number;
  isRequired?: boolean;
  isHidden?: boolean;
  isDisabled?: boolean;
  inputType?: FeatureInputType;
  numberConfig?: {
    label?: string;
    unit?: string;
    min?: number;
    max?: number;
    defaultValue?: number;
    [key: string]: any;
  };
  options?: any[];
  hasPriceInput?: boolean;
  priceUnit?: string;
  priceConfig?: any;
  hasCustomTextInput?: boolean;
  allowCustomOption?: boolean;
  defaultValue?: any;
  [key: string]: any;
}

export interface AmenityFeature {
  id: string;
  name: string;
  icon?: string;
  category?: 'essential' | 'comfort' | 'utilities' | 'rules' | string;
  isActive: boolean;
  [key: string]: any;
}

export interface AppFeatureControl {
  id?: string;
  key?: string;
  name?: string;
  enabled?: boolean;
  description?: string;
  [key: string]: any;
}

export interface AppNavControl {
  id?: string;
  key?: string;
  label?: string;
  path?: string;
  visible?: boolean;
  [key: string]: any;
}

export interface AppFaqItem {
  id?: string;
  question: string;
  answer: string;
  order?: number;
  [key: string]: any;
}

export interface AppNoticeItem {
  id?: string;
  title: string;
  content?: string;
  active?: boolean;
  [key: string]: any;
}

export interface PremiumConfig {
  enabled?: boolean;
  planName?: string;
  pricePerMonth?: number;
  features?: string[];
  bannerText?: string;
  benefits?: PremiumBenefitItem[];
  [key: string]: any;
}

export interface PremiumBenefitItem {
  id?: string;
  title?: string;
  text?: string;
  description?: string;
  icon?: string;
  active?: boolean;
  enabled?: boolean;
  order?: number;
  [key: string]: any;
}

export interface PremiumRequest {
  id: string;
  userId: string;
  userName?: string;
  plan?: string;
  status?: 'pending' | 'approved' | 'rejected' | string;
  paymentMethod?: string;
  screenshotUrl?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type?: string;
  read?: boolean;
  createdAt?: string;
  [key: string]: any;
}

export interface PaymentMethodConfig {
  id?: string;
  code?: string;
  name?: string;
  accountNumber?: string;
  qrCodeUrl?: string;
  isActive?: boolean;
  [key: string]: any;
}

export interface AdminSettings {
  contactEmail?: string;
  supportPhone?: string;
  allowNewRegistrations?: boolean;
  maintenanceMode?: boolean;
  premiumConfig?: PremiumConfig;
  features?: AppFeatureControl[];
  navItems?: AppNavControl[];
  paymentMethods?: PaymentMethodConfig[];
  [key: string]: any;
}

export interface AppContentConfig {
  appName?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  noticeBanner?: string;
  chowks?: ChowkLocation[];
  features?: RoomFeature[];
  adminSettings?: AdminSettings;
  [key: string]: any;
}

export type RoomType = 'single' | 'double' | '1bhk' | '2bhk' | 'flat' | 'commercial' | 'Single Room' | 'Double Room' | '1BHK' | '2BHK' | 'Flat' | 'Commercial Space' | string;

export interface RoomListing {
  id: string;
  title: string;
  description: string;
  chowk: string;
  address?: string;
  addressLine?: string;
  wardNumber?: string;
  rent?: number;
  rentPerMonth?: number;
  negotiable?: boolean;
  roomType: RoomType;
  floor?: string;
  studentsAllowed?: boolean;
  kitchenAvailable?: boolean;
  status?: 'available' | 'occupied' | 'reserved' | 'rented' | string;
  approvalStatus?: 'approved' | 'pending' | 'rejected' | string;
  available?: boolean;
  approved?: boolean;
  facilities?: string[];
  images?: string[];
  ownerId?: string;
  ownerName?: string;
  ownerPhone?: string; // Strictly optional contact number
  isPremium?: boolean;
  createdAt?: string;

  // Utilities and pricing calculation fields
  electricityCharge?: number | string;
  electricityChargePerUnit?: number;
  electricityIncluded?: boolean;
  electricityFacility?: string;
  electricityMeter?: string;
  waterSupply?: string;
  waterCharge?: number | string;
  waterIncluded?: boolean;
  waterFacility?: string;
  waterAvailabilityType?: string;
  wifiCharge?: number | string;
  wifiAvailable?: boolean;
  wifiIncluded?: boolean;
  customFeatures?: Record<string, any>;
  includedCharges?: string[];
  [key: string]: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  name?: string;
  displayName?: string;
  phone?: string; // Strictly optional during signup
  phoneNumber?: string;
  role: UserRole;
  avatarUrl?: string;
  photoURL?: string;
  welcomeMessageSent?: boolean;
  savedRooms?: string[];
  createdAt?: string;
  [key: string]: any;
}

export interface AdminSupportProfile {
  name?: string;
  avatarUrl?: string;
  photoURL?: string;
  statusText?: string;
  isOnline?: boolean;
  [key: string]: any;
}

export interface RepliedMessagePreview {
  id?: string;
  messageId?: string;
  text?: string;
  senderName?: string;
  senderId?: string;
  type?: any;
  mediaUrl?: any;
  [key: string]: any;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text: string;
  createdAt: string;
  read: boolean;
  [key: string]: any;
}

export interface Conversation {
  id: string;
  roomId?: string;
  roomTitle?: string;
  roomChowk?: string;
  type?: string;
  seekerId?: string;
  seekerName?: string;
  ownerId?: string;
  ownerName?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  unreadCounts?: Record<string, number>;
  participantDetails?: Record<string, {
    uid?: string;
    name?: string;
    email?: string;
    photoURL?: string;
    role?: string;
    [k: string]: any;
  }>;
  [key: string]: any;
}
