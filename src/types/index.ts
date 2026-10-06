export type UserRole = 'seeker' | 'owner' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  role: UserRole;
  photoURL?: string;
  isPremium?: boolean;
  premiumPurchasedAt?: string;
  premiumStatus?: 'none' | 'pending' | 'active' | 'rejected';
  rejectionReason?: string;
  rejectionDate?: string;
  reviewedAt?: string;
  rejectedBy?: string;
  rejectedPaymentMethod?: string;
  rejectedAmountNPR?: number;
  rejectedTransactionRef?: string;
  rejectedRequestId?: string;
  paymentReceiptUrl?: string;
  createdAt: string;
  bio?: string;
  hasUsedFreeListing?: boolean;
  lifetimeListingCount?: number;
  isDisabled?: boolean;
  welcomeMessageSent?: boolean;
  isNewSignup?: boolean;
  isEmailVerified?: boolean;
  emailVerified?: boolean;
}

export interface ChowkLocation {
  id: string;
  name: string;
  wardNo?: string;
  popularLandmark?: string;
  activeListingCount?: number;
  order?: number;
  isHidden?: boolean;
}

export type RoomType = 'Single Room' | 'Double Room' | '1BHK' | '2BHK' | 'Flat' | 'Hostel/Bed';

export type RoomStatus = 'available' | 'rented';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type EditApprovalStatus = 'none' | 'pending' | 'approved' | 'rejected';

export interface RoomEditableFields {
  title: string;
  description: string;
  chowk: string;
  wardNumber?: string;
  addressLine?: string;
  landmark?: string;
  rentPerMonth: number;
  negotiable?: boolean;
  roomType: RoomType;
  floor: string;
  studentsAllowed: boolean;
  roomFor?: 'Male' | 'Female' | 'Family' | 'Anyone' | 'Students';
  bestFor?: string;
  waterFacility: '24/7 Supply' | 'Morning/Evening' | 'Handpump / Boring' | 'Limited';
  electricityFacility: '24 Hours / Inverter' | 'Separate Meter' | 'Shared Bill' | 'Standard';
  wifiAvailable: boolean;
  wifiCharge?: number;
  kitchenAvailable?: boolean;
  parkingAvailable?: boolean;
  attachedBathroom?: boolean;
  balconyAvailable?: boolean;
  gateClosingTime?: string;
  guestPolicy?: string;
  facilities?: string[];
  rulesAndDetails?: string;
  photos: string[];
  status?: RoomStatus;
  ownerName?: string;
  ownerPhone?: string;
  ownerWhatsapp?: string;
  ownerEmail?: string;
  locationCoordinates?: { lat: number; lng: number };
  isHidden?: boolean;
  customFeatures?: Record<string, any>;
  electricityChargePerUnit?: number;
  electricityCharge?: number;
  electricityIncluded?: boolean;
  waterCharge?: number;
  waterIncluded?: boolean;
  waterAvailabilityType?: '24_hours' | 'custom_time';
  waterTimeSlots?: { id: string; from: string; to: string }[];
  waterSource?: 'Tap Only' | 'Handpump Only' | 'Tap and Handpump' | 'Other' | string;
  waterSourceCustom?: string;
  gateClosingType?: 'no_fixed' | 'fixed';
  rules?: string[];
  customRules?: string[];
}

export interface PendingEditPayload extends Partial<RoomEditableFields> {
  submittedAt: string;
  submittedBy: string;
  submittedByName?: string;
  submittedByEmail?: string;
  changedFieldKeys?: string[];
  previousValues?: Partial<RoomEditableFields>;
}

export interface RoomListing {
  id: string;
  title: string;
  description: string;
  chowk: string; // Chowk name e.g. "Bhanu Chowk", "Shiva Chowk"
  wardNumber?: string;
  addressLine?: string;
  landmark?: string;
  rentPerMonth: number;
  negotiable?: boolean;
  roomType: RoomType;
  floor: string; // e.g. "Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"
  studentsAllowed: boolean;
  roomFor?: 'Male' | 'Female' | 'Family' | 'Anyone' | 'Students';
  bestFor?: string;
  status: RoomStatus;
  approvalStatus: ApprovalStatus;
  
  // Edit approval fields
  editStatus?: EditApprovalStatus;
  pendingEdit?: PendingEditPayload | null;
  lastEditSubmittedAt?: string;
  lastEditReviewedAt?: string;
  lastEditRejectionReason?: string;
  
  // Rejection & Approval records
  rejectionReason?: string;
  rejectedAt?: string;
  approvedAt?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  
  // Facilities
  waterFacility: '24/7 Supply' | 'Morning/Evening' | 'Handpump / Boring' | 'Limited';
  electricityFacility: '24 Hours / Inverter' | 'Separate Meter' | 'Shared Bill' | 'Standard';
  wifiAvailable: boolean;
  kitchenAvailable?: boolean;
  parkingAvailable?: boolean;
  attachedBathroom?: boolean;
  balconyAvailable?: boolean;
  facilities?: string[];
  gateClosingTime?: string;
  guestPolicy?: string;

  // Additional rules
  rulesAndDetails?: string;

  // Photos
  photos: string[];

  // Owner reference
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerWhatsapp?: string;
  ownerPhoto?: string;
  isOwnerPremium?: boolean;

  // Location
  locationCoordinates?: { lat: number; lng: number };

  // Custom Feature Builder Dynamic Values
  customFeatures?: Record<string, any>;

  // Electricity (Simplified & Mandatory per unit)
  electricityChargePerUnit?: number;
  electricityCharge?: number;
  electricityIncluded?: boolean;

  // Water Charges
  waterCharge?: number;
  waterIncluded?: boolean;

  // Wi-Fi Charge
  wifiCharge?: number;

  // Water Availability & Source (Redesigned)
  waterAvailabilityType?: '24_hours' | 'custom_time';
  waterTimeSlots?: { id: string; from: string; to: string }[];
  waterSource?: 'Tap Only' | 'Handpump Only' | 'Tap and Handpump' | 'Other' | string;
  waterSourceCustom?: string;

  // Gate Closing Time
  gateClosingType?: 'no_fixed' | 'fixed';

  // Rules Checklist & Custom Rules
  rules?: string[];
  customRules?: string[];

  // Admin and visibility
  isHidden?: boolean;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  isFeatured?: boolean;
  viewsCount?: number;
}

export type FeatureInputType =
  | 'checklist'
  | 'single_select'
  | 'text'
  | 'number'
  | 'price'
  | 'price_unit'
  | 'yes_no'
  | 'time'
  | 'date'
  | 'image_upload'
  | 'custom';

export interface FeatureOption {
  id: string;
  name: string;
  description?: string | null;
  icon?: string | null;
  order: number;
  isHidden?: boolean;
  isDisabled?: boolean;
  isDefault?: boolean; // Mark rule as default
  // Conditional Price Input Settings
  hasPriceInput?: boolean;
  priceLabel?: string | null;
  currency?: string | null; // 'रु' | 'NPR'
  priceUnit?: string | null; // e.g. 'per unit', 'per month', 'per room'
  priceRequired?: boolean;
  defaultPrice?: number | null;
  // Conditional Custom Text Input Settings (e.g. for "Other" option)
  hasCustomTextInput?: boolean;
  customTextLabel?: string | null;
  customTextPlaceholder?: string | null;
  customTextRequired?: boolean;
}

export interface CustomFieldCondition {
  whenOptionId: string; // option id or option name
  action: 'show_price' | 'show_text';
  label?: string | null;
  unit?: string | null;
  currency?: string | null;
  placeholder?: string | null;
  required?: boolean;
}

export interface RoomFeature {
  id: string;
  name: string;
  icon?: string | null;
  category?: 'basic' | 'comfort' | 'safety' | 'utility' | 'pricing' | 'rules';
  description?: string | null;
  order: number;
  isRequired?: boolean;
  isHidden?: boolean;
  isDisabled?: boolean;
  inputType: FeatureInputType;
  selectionType?: 'single' | 'multiple'; // For single select vs multiple selection checklist
  allowCustomOption?: boolean; // Allow owner to add custom option / custom rule

  // Options for checklist, single_select, price_unit
  options?: FeatureOption[];

  // Configurations specific to input types:
  textConfig?: {
    label?: string;
    placeholder?: string;
    maxCharacters?: number;
  } | null;

  numberConfig?: {
    label?: string;
    placeholder?: string;
    minValue?: number;
    maxValue?: number | null;
    allowDecimals?: boolean;
    unit?: string;
  } | null;

  priceConfig?: {
    currency?: string; // रु / NPR
    priceLabel?: string;
    minAmount?: number | null;
    maxAmount?: number | null;
    unit?: string;
  } | null;

  yesNoConfig?: {
    yesLabel?: string;
    noLabel?: string;
  } | null;

  timeConfig?: {
    label?: string;
    format?: '12h' | '24h';
  } | null;

  dateConfig?: {
    label?: string;
    minDate?: string | null;
  } | null;

  imageConfig?: {
    maxImages?: number;
    maxSizeMB?: number;
  } | null;

  conditions?: CustomFieldCondition[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AppFaqItem {
  id: string;
  question: string;
  answer: string;
  order?: number;
}

export interface AppNoticeItem {
  id: string;
  title: string;
  content: string;
  targetAudience?: 'all' | 'seekers' | 'owners';
  isUrgent?: boolean;
  createdAt?: string;
  isHidden?: boolean;
}

export interface AppContentConfig {
  appName: string;
  tagline: string;
  logoUrl?: string;
  bannerText?: string;
  bannerActive?: boolean;
  bannerLink?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroBadge?: string;
  aboutHeading?: string;
  aboutStory?: string;
  aboutMission?: string;
  helplinePhone?: string;
  supportEmail?: string;
  whatsAppNumber?: string;
  officeAddress?: string;
  operatingHours?: string;
  rulesText?: string;
  termsText?: string;
  privacyText?: string;
  noticeText?: string;
  faqs?: AppFaqItem[];
  notices?: AppNoticeItem[];
}

export interface AdminSettings {
  adminDisplayName: string;
  adminEmail: string;
  adminPhone: string;
  supportPhone: string;
  supportEmail: string;
  supportWhatsApp: string;
  officeAddress: string;
  lifetimeFreeListingQuota: number;
  premiumFeeNPR: number;
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  allowDirectRegistration: boolean;
  autoApproveVerifiedOwners: boolean;
  esewaId?: string;
  khaltiId?: string;
  bankDetails?: string;
}

export interface InterestedInquiry {
  id: string;
  roomId: string;
  roomTitle: string;
  roomChowk: string;
  roomRent: number;
  ownerId: string;
  seekerId: string;
  seekerName: string;
  seekerPhone: string;
  seekerEmail: string;
  message: string;
  createdAt: string;
  status: 'new' | 'contacted' | 'resolved';
}

export interface AppFeatureControl {
  id: string;
  key: string;
  name: string;
  description: string;
  category: 'core' | 'discovery' | 'communication' | 'account' | 'interactive' | 'custom';
  enabled: boolean;
  visible: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface AppNavControl {
  id: string;
  key: string;
  label: string;
  icon?: string;
  visible: boolean;
  order: number;
  requireAuth?: boolean;
  allowedRoles?: UserRole[];
  updatedAt?: string;
}

export interface PremiumBenefitItem {
  id: string;
  text: string;
  icon?: string;
  active: boolean;
  order: number;
}

export interface PremiumConfig {
  enabled: boolean;
  visible: boolean;
  priceNPR: number;
  title: string;
  subtitle: string;
  durationText: string;
  rulesText: string;
  benefits: PremiumBenefitItem[];
  updatedAt?: string;
}

export interface PaymentMethodConfig {
  id: string;
  code: 'esewa' | 'khalti' | 'bank' | 'custom';
  name: string;
  accountNumber: string;
  accountHolder: string;
  phoneNumber?: string;
  bankName?: string;
  branch?: string;
  qrCodeUrl?: string;
  qrCodeStoragePath?: string;
  instructions?: string;
  notes?: string;
  order: number;
  enabled: boolean;
  visible: boolean;
  updatedAt?: string;
}

export interface AdminNotification {
  id: string;
  type: 'new_room' | 'room_edit' | 'premium_payment' | 'new_user' | 'new_message' | 'system';
  title: string;
  message: string;
  targetTab?: 'overview' | 'rooms' | 'edits' | 'payments' | 'users' | 'support' | 'chowks' | 'features' | 'appControls' | 'navControls' | 'paymentSettings' | 'premiumSettings' | 'content' | 'settings';
  relatedId?: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

export interface PremiumRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  paymentMethod: 'eSewa' | 'Khalti' | 'Bank Transfer' | 'Cash/Direct' | string;
  paymentMethodId?: string;
  amountNPR?: number;
  transactionReference?: string;
  proofImageUrl?: string;
  senderName?: string;
  senderPhone?: string;
  adminNotes?: string;
  rejectionReason?: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface SavedRoomRecord {
  id: string;
  userId: string;
  roomId: string;
  savedAt: string;
}

// ---------------- Messaging System Types ----------------

export type MessageType = 'text' | 'image' | 'voice' | 'notice';

export interface RepliedMessagePreview {
  messageId: string;
  senderName: string;
  senderId: string;
  text?: string;
  type: MessageType;
  mediaUrl?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  senderRole?: UserRole;
  sender?: string;
  receiver?: string;
  receiverId?: string;
  paymentRequestId?: string;
  rejectionReason?: string;
  messageText?: string;
  messageType?: string;
  text: string;
  type: MessageType;
  mediaUrl?: string;
  audioDuration?: number; // duration in seconds
  replyTo?: RepliedMessagePreview | null;
  readBy: string[];
  createdAt: string;
  isNotice?: boolean;
}

export type ConversationType = 'direct' | 'support';

export interface ConversationParticipant {
  uid: string;
  name: string;
  role: UserRole;
  photoURL?: string;
  email?: string;
}

export interface StartDirectConversationParams {
  targetUser?: {
    uid: string;
    name?: string;
    displayName?: string;
    photoURL?: string;
    role?: UserRole;
    email?: string;
    phone?: string;
  };
  targetUserId?: string;
  targetUserName?: string;
  targetUserRole?: UserRole;
  targetUserPhoto?: string;
  targetUserEmail?: string;
  roomId?: string;
  roomTitle?: string;
  roomChowk?: string;
  roomPrice?: number;
  roomImage?: string;
  room?: RoomListing;
  initialMessage?: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  participantIds?: string[];
  participants: string[];
  participantDetails: Record<string, ConversationParticipant>;
  roomId?: string;
  roomTitle?: string;
  roomChowk?: string;
  roomPrice?: number;
  roomImage?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  lastSenderId?: string;
  lastMessageType?: MessageType;
  unreadCounts: Record<string, number>;
  createdAt: string;
  updatedAt: string;
  status?: 'active' | 'resolved' | 'archived';
  supportTopic?: string;
}

export interface AdminSupportProfile {
  profileName: string;
  adminDisplayName: string;
  photoURL: string;
  description: string;
  welcomeMessage?: string;
  activeHours?: string;
  updatedAt?: string;
}

export interface AdminNotice {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
  authorName: string;
  targetAudience: 'all' | 'seekers' | 'owners';
  isUrgent?: boolean;
  active?: boolean;
}

