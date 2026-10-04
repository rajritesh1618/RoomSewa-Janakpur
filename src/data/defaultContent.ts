import {
  RoomFeature,
  AppContentConfig,
  AdminSettings,
  AppFeatureControl,
  AppNavControl,
  PremiumConfig,
  PaymentMethodConfig
} from '../types';

export const DEFAULT_ROOM_FEATURES: RoomFeature[] = [
  {
    id: 'feature-electricity',
    name: 'Electricity',
    icon: 'Zap',
    category: 'basic',
    description: 'Electricity charge in NPR per unit (Mandatory)',
    order: 1,
    isRequired: true,
    isHidden: false,
    isDisabled: false,
    inputType: 'number',
    numberConfig: {
      label: 'Electricity Charge',
      unit: 'NPR per unit',
      minValue: 1,
      placeholder: 'e.g. 15'
    }
  },
  {
    id: 'feature-water',
    name: 'Water Availability',
    icon: 'Droplets',
    category: 'basic',
    description: 'Water availability schedule (24 Hours or Choose Time slots)',
    order: 2,
    isRequired: true,
    isHidden: false,
    isDisabled: false,
    inputType: 'single_select',
    selectionType: 'single',
    options: [
      {
        id: 'water-24h',
        name: '24 Hours',
        description: 'Water Available: 24 Hours continuously',
        icon: 'Droplets',
        order: 1,
        isDefault: true,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'water-time',
        name: 'Choose Time',
        description: 'Fixed schedule with From & To hours (e.g. 6:00 AM - 10:00 AM)',
        icon: 'Clock',
        order: 2,
        isHidden: false,
        isDisabled: false
      }
    ]
  },
  {
    id: 'feature-water-source',
    name: 'Water Source',
    icon: 'Droplets',
    category: 'basic',
    description: 'Select tap, handpump, or custom water source',
    order: 3,
    isRequired: true,
    isHidden: false,
    isDisabled: false,
    inputType: 'single_select',
    selectionType: 'single',
    allowCustomOption: true,
    options: [
      { id: 'ws-tap', name: 'Tap Only', order: 1, isHidden: false, isDisabled: false },
      { id: 'ws-handpump', name: 'Handpump Only', order: 2, isHidden: false, isDisabled: false },
      { id: 'ws-both', name: 'Tap and Handpump', order: 3, isHidden: false, isDisabled: false },
      {
        id: 'ws-other',
        name: 'Other',
        order: 4,
        isHidden: false,
        isDisabled: false,
        hasCustomTextInput: true,
        customTextLabel: 'Specify Water Source',
        customTextPlaceholder: 'e.g. Borewell / Filtered tanker'
      }
    ]
  },
  {
    id: 'feature-gate-time',
    name: 'Gate Closing Time',
    icon: 'Clock',
    category: 'rules',
    description: 'Night curfew or main boundary gate closing time',
    order: 4,
    isRequired: false,
    isHidden: false,
    isDisabled: false,
    inputType: 'single_select',
    selectionType: 'single',
    options: [
      { id: 'gt-none', name: 'No Fixed Closing Time', order: 1, isDefault: true, isHidden: false, isDisabled: false },
      { id: 'gt-fixed', name: 'Fixed Closing Time', order: 2, isHidden: false, isDisabled: false, description: 'Specify curfew time e.g. 10:00 PM' }
    ]
  },
  {
    id: 'feature-rules',
    name: 'House Rules',
    icon: 'CheckSquare',
    category: 'rules',
    description: 'House rules and tenant guidelines checklist',
    order: 5,
    isRequired: false,
    isHidden: false,
    isDisabled: false,
    inputType: 'checklist',
    selectionType: 'multiple',
    allowCustomOption: true,
    options: [
      { id: 'r-smoking', name: 'No Smoking', order: 1, isDefault: true, isHidden: false, isDisabled: false },
      { id: 'r-alcohol', name: 'No Alcohol', order: 2, isDefault: true, isHidden: false, isDisabled: false },
      { id: 'r-pets', name: 'No Pets', order: 3, isDefault: true, isHidden: false, isDisabled: false },
      { id: 'r-music', name: 'No Loud Music', order: 4, isDefault: true, isHidden: false, isDisabled: false },
      { id: 'r-veg', name: 'Vegetarian Only', order: 5, isHidden: false, isDisabled: false },
      { id: 'r-overnight', name: 'No Overnight Guests', order: 6, isHidden: false, isDisabled: false },
      { id: 'r-dayguests', name: 'Day Guests Only', order: 7, isHidden: false, isDisabled: false }
    ]
  },
  {
    id: 'feature-facilities',
    name: 'Facilities & Amenities',
    icon: 'Layers',
    category: 'comfort',
    description: 'Select all key amenities included with this room',
    order: 6,
    isRequired: false,
    isHidden: false,
    isDisabled: false,
    inputType: 'checklist',
    selectionType: 'multiple',
    allowCustomOption: true,
    options: [
      {
        id: 'opt-attached-bath',
        name: 'Attached Bathroom',
        description: 'Private western or eastern bathroom attached to the room',
        icon: 'Bath',
        order: 1,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'opt-kitchen',
        name: 'Kitchen',
        description: 'Dedicated slab with tap water & gas cylinder space',
        icon: 'Utensils',
        order: 2,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'opt-parking',
        name: 'Parking',
        description: 'Gated parking space for motorbikes and cycles',
        icon: 'Car',
        order: 3,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'opt-balcony',
        name: 'Balcony',
        description: 'Private open veranda with natural sunlight',
        icon: 'Sun',
        order: 4,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'opt-cctv',
        name: 'CCTV',
        description: '24/7 security surveillance cameras at premises',
        icon: 'Shield',
        order: 5,
        isHidden: false,
        isDisabled: false
      },
      {
        id: 'opt-wifi',
        name: 'Wi-Fi Internet',
        description: 'High-speed fiber connection included',
        icon: 'Wifi',
        order: 6,
        isHidden: false,
        isDisabled: false
      }
    ]
  },
  {
    id: 'feature-room-for',
    name: 'Room For',
    icon: 'CircleDot',
    category: 'rules',
    description: 'Specify preferred tenant type',
    order: 7,
    isRequired: true,
    isHidden: false,
    isDisabled: false,
    inputType: 'single_select',
    selectionType: 'single',
    options: [
      { id: 'rf-anyone', name: 'Anyone', order: 1, isHidden: false, isDisabled: false },
      { id: 'rf-male', name: 'Male', order: 2, isHidden: false, isDisabled: false },
      { id: 'rf-female', name: 'Female', order: 3, isHidden: false, isDisabled: false },
      { id: 'rf-family', name: 'Family', order: 4, isHidden: false, isDisabled: false },
      { id: 'rf-students', name: 'Students', order: 5, isHidden: false, isDisabled: false }
    ]
  }
];

export const DEFAULT_APP_CONTENT: AppContentConfig = {
  appName: 'RoomSewa Janakpur',
  tagline: "Janakpurdham's Premier Local Room, Flat & Hostel Rental Platform",
  logoUrl: '',
  bannerText: 'Welcome to RoomSewa Janakpur — Find verified rooms near Janaki Mandir, Ramanand Chowk & Station Road!',
  bannerActive: true,
  bannerLink: '#listings',
  heroTitle: 'Find Your Perfect Room or Flat in Janakpurdham',
  heroSubtitle: 'Connect directly with verified landlords across Bhanu Chowk, Shiva Chowk, Ramanand Chowk & all Janakpur wards with zero middleman commissions.',
  heroBadge: "Nepal's #1 Janakpur Local Rental Network",
  aboutHeading: 'Empowering Room Seekers & Property Owners in Mithila',
  aboutStory: 'RoomSewa Janakpur was founded to solve rental challenges in Janakpurdham. Whether you are a student attending RR Campus, a medical professional at Janakpur Zonal Hospital, or a local family looking for a spacious flat, RoomSewa provides direct landlord connections with transparent prices and verified amenities.',
  aboutMission: 'To make renting easy, transparent, and trustworthy across all 25 wards of Janakpurdham.',
  helplinePhone: '+9779844012345',
  supportEmail: 'support@roomsewa.com',
  whatsAppNumber: '+9779844012345',
  officeAddress: 'Station Road, Ward No. 4, Janakpurdham, Dhanusha, Nepal',
  operatingHours: 'Sunday to Friday, 8:00 AM - 8:00 PM NPT',
  rulesText: '1. Respect neighborhood tranquility and quiet hours after 10:00 PM.\n2. Timely rent payment via digital transfer (eSewa/Khalti) or cash as agreed with landlord.\n3. Conserve water; ensure taps and valves are closed properly.\n4. No unauthorized subletting or unapproved structural modifications.',
  termsText: 'RoomSewa Janakpur is a rental discovery and community platform connecting tenants with property owners in Janakpurdham. Users are responsible for verifying physical lease agreements and inspecting properties before making advance deposits.',
  privacyText: 'Your phone number and name are only shared with relevant landlords and verified seekers for contact purposes. We never sell your personal data to third-party marketing services.',
  faqs: [
    {
      id: 'faq-1',
      question: 'How do I contact a room owner?',
      answer: "Click 'Call Landlord' or 'Chat on WhatsApp' on any room card to connect directly with the owner without middleman charges.",
      order: 1
    },
    {
      id: 'faq-2',
      question: 'Is RoomSewa Janakpur free for room seekers?',
      answer: 'Yes! Searching, browsing, and contacting owners is 100% free for all students, professionals, and families looking for rooms.',
      order: 2
    },
    {
      id: 'faq-3',
      question: 'How do property owners list rooms?',
      answer: 'Property owners can register an Owner account, verify their Nepal mobile number, and post their first room listing completely free.',
      order: 3
    },
    {
      id: 'faq-4',
      question: 'What is Lifetime Gold Premium for owners?',
      answer: 'For a one-time fee of Rs 200, owners get unlimited room listings, a Verified Gold badge, and priority search ranking across all Janakpur chowks.',
      order: 4
    },
    {
      id: 'faq-5',
      question: 'How are room approvals handled?',
      answer: 'RoomSewa Janakpur administrators review every new room and submitted edit to verify genuine photos, accurate landmarks, and genuine contacts.',
      order: 5
    }
  ],
  notices: [
    {
      id: 'notice-welcome',
      title: 'Welcome to RoomSewa Janakpur',
      content: 'Browse hundreds of available rooms, flats, and student accommodations with direct phone contact.',
      targetAudience: 'all',
      isUrgent: false,
      createdAt: new Date().toISOString(),
      isHidden: false
    }
  ]
};

export const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  adminDisplayName: 'Janakpur Admin Desk',
  adminEmail: 'roomsewajanakpur@gmail.com',
  adminPhone: '+9779844012345',
  supportPhone: '+9779844012345',
  supportEmail: 'support@roomsewa.com',
  supportWhatsApp: '+9779844012345',
  officeAddress: 'Station Road, Janakpurdham, Nepal',
  lifetimeFreeListingQuota: 1,
  premiumFeeNPR: 200,
  maintenanceMode: false,
  maintenanceMessage: 'RoomSewa Janakpur is briefly upgrading its servers. We will be back online shortly!',
  allowDirectRegistration: true,
  autoApproveVerifiedOwners: false,
  esewaId: '9800000000 (RoomSewa Janakpur)',
  khaltiId: '9800000000 (RoomSewa Janakpur)',
  bankDetails: 'Nepal Bank Ltd, Janakpur Branch, A/C: 0123456789, Name: RoomSewa Janakpur'
};

export const DEFAULT_FEATURE_CONTROLS: AppFeatureControl[] = [
  {
    id: 'feat-room-listing',
    key: 'room_listing',
    name: 'Room & Flat Listing Creation',
    description: 'Allows landlords and owners to submit new room, flat, and hostel listings in Janakpur',
    category: 'core',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-premium',
    key: 'premium',
    name: 'Landlord Premium & Gold Badge',
    description: 'Enables paid lifetime gold pass, badge highlights, and priority ranking for owners',
    category: 'core',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-search',
    key: 'search',
    name: 'Search Bar & Keyword Lookup',
    description: 'Direct title, landmark, and ward keyword search in the hero section and listings view',
    category: 'discovery',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-filters',
    key: 'filters',
    name: 'Price & Facility Filters',
    description: 'Filter rooms by price range, room type, attached bathroom, water, and student-friendly rules',
    category: 'discovery',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-chowks',
    key: 'chowk_selection',
    name: 'Chowk & Ward Selection',
    description: 'Browsing rooms grouped by Janakpur chowks (Bhanu Chowk, Ramanand, Shiva, Murali, etc.)',
    category: 'discovery',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-chat',
    key: 'chat',
    name: 'Direct Messaging & Chat',
    description: 'Real-time in-app conversation between room seekers and landlords',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-owner-contact',
    key: 'owner_contact',
    name: 'Direct Landlord Phone Call',
    description: 'Display landlord mobile number for instant one-tap phone calls',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-whatsapp',
    key: 'whatsapp',
    name: 'WhatsApp Direct Chat',
    description: 'One-click WhatsApp chat link with prefilled room title and reference',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-profile',
    key: 'profile',
    name: 'User Profile & Account Hub',
    description: 'Allows users to manage account details, avatar, contact phone, and view listed properties',
    category: 'account',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-notifications',
    key: 'notifications',
    name: 'User Notifications & Alerts',
    description: 'System and room status notifications for seekers and property owners',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-favorites',
    key: 'favorites',
    name: 'Favorites & Saved Rooms',
    description: 'Allows room seekers to bookmark favorite rooms and view them in saved list',
    category: 'interactive',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-reviews',
    key: 'reviews',
    name: 'Tenant Reviews & Ratings',
    description: 'Community feedback, reviews, and ratings for landlord premises in Janakpur',
    category: 'interactive',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-map-location',
    key: 'map_location',
    name: 'Map / Geolocation Coordinates',
    description: 'Displays map coordinates and Google Maps direction links for room locations',
    category: 'discovery',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-support',
    key: 'support',
    name: 'Support Help Desk',
    description: 'Direct in-app support chat connecting users to Janakpur Admin Help Desk',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'feat-admin-messages',
    key: 'admin_messages',
    name: 'Admin Broadcast Notices',
    description: 'Official system announcements and broadcast banners displayed across the app',
    category: 'communication',
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  }
];

export const DEFAULT_NAV_CONTROLS: AppNavControl[] = [
  {
    id: 'nav-home',
    key: 'home',
    label: 'Home',
    icon: 'Home',
    visible: true,
    order: 1
  },
  {
    id: 'nav-listings',
    key: 'listings',
    label: 'Browse Rooms',
    icon: 'Search',
    visible: true,
    order: 2
  },
  {
    id: 'nav-chowks',
    key: 'chowks',
    label: 'Chowks',
    icon: 'MapPin',
    visible: true,
    order: 3
  },
  {
    id: 'nav-add-room',
    key: 'add-room',
    label: 'List Your Room',
    icon: 'PlusCircle',
    visible: true,
    order: 4
  },
  {
    id: 'nav-premium',
    key: 'premium',
    label: 'Gold Premium',
    icon: 'Crown',
    visible: true,
    order: 5
  },
  {
    id: 'nav-messages',
    key: 'messages',
    label: 'Messages',
    icon: 'MessageSquare',
    visible: true,
    order: 6,
    requireAuth: true
  },
  {
    id: 'nav-favorites',
    key: 'favorites',
    label: 'Saved Rooms',
    icon: 'Heart',
    visible: true,
    order: 7,
    requireAuth: true
  },
  {
    id: 'nav-profile',
    key: 'profile',
    label: 'My Account',
    icon: 'User',
    visible: true,
    order: 8,
    requireAuth: true
  },
  {
    id: 'nav-support',
    key: 'support',
    label: 'Help Desk',
    icon: 'LifeBuoy',
    visible: true,
    order: 9
  }
];

export const DEFAULT_PREMIUM_CONFIG: PremiumConfig = {
  enabled: true,
  visible: true,
  priceNPR: 200,
  title: 'RoomSewa Janakpur Lifetime Gold Pass',
  subtitle: 'Specifically tailored for property owners, landlords, and student hostel managers across Janakpurdham',
  durationText: 'Lifetime Access',
  rulesText: 'One-time registration fee for landlords to post unlimited verified rooms with permanent priority visibility.',
  benefits: [
    {
      id: 'benefit-1',
      text: 'Unlimited room listings (Free accounts are limited to 1 lifetime listing)',
      icon: 'Building',
      active: true,
      order: 1
    },
    {
      id: 'benefit-2',
      text: 'Verified Gold Landlord badge displayed on all room cards and profile',
      icon: 'Crown',
      active: true,
      order: 2
    },
    {
      id: 'benefit-3',
      text: 'Top Janakpur search results ranking (appears before standard listings)',
      icon: 'Sparkles',
      active: true,
      order: 3
    },
    {
      id: 'benefit-4',
      text: 'Priority admin review and approval within 1 hour',
      icon: 'Zap',
      active: true,
      order: 4
    },
    {
      id: 'benefit-5',
      text: 'Direct phone call & WhatsApp click-to-chat for instant tenant leads',
      icon: 'PhoneCall',
      active: true,
      order: 5
    }
  ],
  updatedAt: new Date().toISOString()
};

export const DEFAULT_PAYMENT_METHODS: PaymentMethodConfig[] = [
  {
    id: 'pm-esewa',
    code: 'esewa',
    name: 'eSewa Mobile Wallet',
    accountNumber: '9844012345',
    accountHolder: 'RoomSewa Janakpur Official',
    phoneNumber: '+9779844012345',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=eSewa:9844012345,Name:RoomSewaJanakpur,Amount:200',
    instructions: '1. Open your eSewa App.\n2. Tap "Scan & Pay" or send money to 9844012345.\n3. Enter Rs 200 and write your phone number/name in the remarks.\n4. Take a screenshot or copy the Transaction ID and paste below.',
    notes: 'Instant verification by Janakpur Admin desk within 1 hour.',
    order: 1,
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm-khalti',
    code: 'khalti',
    name: 'Khalti Digital Wallet',
    accountNumber: '9844012345',
    accountHolder: 'RoomSewa Janakpur',
    phoneNumber: '+9779844012345',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Khalti:9844012345,Name:RoomSewaJanakpur,Amount:200',
    instructions: '1. Open Khalti App.\n2. Tap "Send Money" or scan QR.\n3. Enter Khalti ID 9844012345 and amount Rs 200.\n4. Enter your room title or owner name in remarks.\n5. Copy transaction reference and submit.',
    notes: 'Khalti transfers are verified rapidly during business hours.',
    order: 2,
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pm-bank',
    code: 'bank',
    name: 'Bank Transfer (Nepal Bank / Nabil)',
    accountNumber: '01201017500123',
    accountHolder: 'RoomSewa Janakpur Official',
    bankName: 'Nepal Bank Limited',
    branch: 'Janakpurdham Main Branch, Station Road',
    phoneNumber: '+9779844012345',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=NepalBank:01201017500123,Name:RoomSewaJanakpur,Amount:200',
    instructions: '1. Log into your Mobile Banking (ConnectIPS, Fonepay, or bank app).\n2. Select Interbank Transfer or Nepal Bank.\n3. Enter Account No: 01201017500123, Account Name: RoomSewa Janakpur Official.\n4. Save transaction receipt and upload screenshot or reference number below.',
    notes: 'Applicable for any Nepalese commercial bank via Fonepay / ConnectIPS.',
    order: 3,
    enabled: true,
    visible: true,
    updatedAt: new Date().toISOString()
  }
];

