import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AmenityFeature, 
  AppNavControl, 
  AppFeatureControl,
  AdminNotification, 
  PaymentMethodConfig, 
  PremiumConfig, 
  PremiumBenefitItem 
} from '../types';

export interface ContentContextType {
  features: AmenityFeature[];
  activeFeatures: AmenityFeature[];
  loadingFeatures: boolean;
  addFeature: (name: string, category?: string, icon?: string) => Promise<void>;
  editFeature: (id: string, updates: Partial<AmenityFeature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;
  toggleFeatureStatus: (id: string, isActive: boolean) => Promise<void>;
  isFeatureVisible: (featureName: string) => boolean;

  // Feature controls (AdminFeaturesControlManager)
  featureControls: AppFeatureControl[];
  updateFeatureControl: (key: string, updates: Partial<AppFeatureControl>) => Promise<void>;
  addFeatureControl: (ctrl: AppFeatureControl) => Promise<void>;
  deleteFeatureControl: (id: string) => Promise<void>;
  resetFeatureControls: () => Promise<void>;

  // Nav controls
  navControls: AppNavControl[];
  updateNavControl: (key: string, updates: Partial<AppNavControl>) => Promise<void>;
  reorderNavControls: (controls: AppNavControl[]) => Promise<void>;
  resetNavControls: () => Promise<void>;

  // Admin Notifications
  adminNotifications: AdminNotification[];
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;

  // Payment methods
  paymentMethods: PaymentMethodConfig[];
  addPaymentMethod: (method: PaymentMethodConfig) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  resetPaymentMethods: () => Promise<void>;

  // Premium config
  premiumConfig: PremiumConfig;
  updatePremiumConfig: (config: Partial<PremiumConfig>) => Promise<void>;
  addPremiumBenefit: (benefit: PremiumBenefitItem) => Promise<void>;
  updatePremiumBenefit: (id: string, updates: Partial<PremiumBenefitItem>) => Promise<void>;
  deletePremiumBenefit: (id: string) => Promise<void>;
}

const defaultFeatures: AmenityFeature[] = [
  { id: 'wifi', name: 'High-Speed Wi-Fi', category: 'essential', isActive: true, icon: 'Wifi' },
  { id: 'water', name: '24/7 Water Supply', category: 'essential', isActive: true, icon: 'Droplets' },
  { id: 'parking', name: 'Bike/Car Parking', category: 'comfort', isActive: true, icon: 'Car' },
  { id: 'bathroom', name: 'Attached Bathroom', category: 'comfort', isActive: true, icon: 'Bath' },
  { id: 'kitchen', name: 'Separate Kitchen', category: 'comfort', isActive: true, icon: 'Utensils' },
  { id: 'balcony', name: 'Balcony / Terrace', category: 'comfort', isActive: true, icon: 'Sun' },
  { id: 'cctv', name: 'CCTV Security', category: 'essential', isActive: true, icon: 'ShieldCheck' }
];

const defaultFeatureControls: AppFeatureControl[] = [
  { id: 'fc-1', key: 'chat', name: 'In-app Chat', enabled: true, description: 'Direct messaging between tenant and owner' },
  { id: 'fc-2', key: 'premium', name: 'Premium Badges', enabled: true, description: 'Paid promotion for listings' }
];

const defaultNavControls: AppNavControl[] = [
  { id: 'nav-home', key: 'home', label: 'Home', path: '/', visible: true },
  { id: 'nav-listings', key: 'listings', label: 'Find Rooms', path: '/listings', visible: true },
  { id: 'nav-chowks', key: 'chowks', label: 'Chowks', path: '/chowks', visible: true },
  { id: 'nav-premium', key: 'premium', label: 'Premium', path: '/premium', visible: true }
];

const defaultPaymentMethods: PaymentMethodConfig[] = [
  { id: 'esewa', code: 'esewa', name: 'eSewa Mobile Wallet', accountNumber: '9844012345', isActive: true },
  { id: 'khalti', code: 'khalti', name: 'Khalti Digital Wallet', accountNumber: '9807123456', isActive: true },
  { id: 'fonepay', code: 'fonepay', name: 'Fonepay QR Payment', accountNumber: 'RoomSewa Janakpur', isActive: true }
];

const defaultPremiumConfig: PremiumConfig = {
  enabled: true,
  planName: 'Verified Premium',
  pricePerMonth: 499,
  features: ['Top priority placement', 'Gold verification badge', 'Direct WhatsApp calling'],
  benefits: [
    { id: 'b1', title: 'Top search ranking in Janakpur', description: 'Be the first property seekers see', enabled: true },
    { id: 'b2', title: 'Direct Call & WhatsApp clicks', description: 'Tenants reach your phone immediately', enabled: true }
  ]
};

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<AmenityFeature[]>(defaultFeatures);
  const [loadingFeatures, setLoadingFeatures] = useState(true);
  const [featureControls, setFeatureControls] = useState<AppFeatureControl[]>(defaultFeatureControls);
  const [navControls, setNavControls] = useState<AppNavControl[]>(defaultNavControls);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(defaultPaymentMethods);
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>(defaultPremiumConfig);

  useEffect(() => {
    const featuresCol = collection(db, 'features');
    const unsubscribe = onSnapshot(featuresCol, (snapshot) => {
      if (!snapshot.empty) {
        const list: AmenityFeature[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as AmenityFeature);
        });
        setFeatures(list);
      } else {
        defaultFeatures.forEach(async (feat) => {
          await setDoc(doc(db, 'features', feat.id), feat).catch(console.error);
        });
        setFeatures(defaultFeatures);
      }
      setLoadingFeatures(false);
    }, () => setLoadingFeatures(false));

    return () => unsubscribe();
  }, []);

  const addFeature = async (name: string, category: string = 'comfort', icon: string = 'Check') => {
    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newFeature: AmenityFeature = {
      id,
      name: name.trim(),
      category: category as any,
      icon,
      isActive: true
    };
    await setDoc(doc(db, 'features', id), newFeature);
  };

  const editFeature = async (id: string, updates: Partial<AmenityFeature>) => {
    await updateDoc(doc(db, 'features', id), updates);
  };

  const deleteFeature = async (id: string) => {
    await deleteDoc(doc(db, 'features', id));
  };

  const toggleFeatureStatus = async (id: string, isActive: boolean) => {
    await updateDoc(doc(db, 'features', id), { isActive });
  };

  const isFeatureVisible = (featureName: string): boolean => {
    const found = features.find(f => f.name.toLowerCase() === featureName.toLowerCase() || f.id === featureName);
    return found ? found.isActive : true;
  };

  const updateFeatureControl = async (key: string, updates: Partial<AppFeatureControl>) => {
    setFeatureControls(prev => prev.map(f => f.key === key || f.id === key ? { ...f, ...updates } : f));
  };

  const addFeatureControl = async (ctrl: AppFeatureControl) => {
    setFeatureControls(prev => [...prev, ctrl]);
  };

  const deleteFeatureControl = async (id: string) => {
    setFeatureControls(prev => prev.filter(f => f.id !== id && f.key !== id));
  };

  const resetFeatureControls = async () => {
    setFeatureControls(defaultFeatureControls);
  };

  const updateNavControl = async (key: string, updates: Partial<AppNavControl>) => {
    setNavControls(prev => prev.map(n => n.key === key || n.id === key ? { ...n, ...updates } : n));
  };

  const reorderNavControls = async (controls: AppNavControl[]) => {
    setNavControls(controls);
  };

  const resetNavControls = async () => {
    setNavControls(defaultNavControls);
  };

  const markNotificationRead = async (id: string) => {
    setAdminNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async () => {
    setAdminNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const deleteNotification = async (id: string) => {
    setAdminNotifications(prev => prev.filter(n => n.id !== id));
  };

  const addPaymentMethod = async (method: PaymentMethodConfig) => {
    setPaymentMethods(prev => [...prev, method]);
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethodConfig>) => {
    setPaymentMethods(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deletePaymentMethod = async (id: string) => {
    setPaymentMethods(prev => prev.filter(m => m.id !== id));
  };

  const resetPaymentMethods = async () => {
    setPaymentMethods(defaultPaymentMethods);
  };

  const updatePremiumConfig = async (config: Partial<PremiumConfig>) => {
    setPremiumConfig(prev => ({ ...prev, ...config }));
  };

  const addPremiumBenefit = async (benefit: PremiumBenefitItem) => {
    setPremiumConfig(prev => ({ ...prev, benefits: [...(prev.benefits || []), benefit] }));
  };

  const updatePremiumBenefit = async (id: string, updates: Partial<PremiumBenefitItem>) => {
    setPremiumConfig(prev => ({
      ...prev,
      benefits: (prev.benefits || []).map(b => b.id === id ? { ...b, ...updates } : b)
    }));
  };

  const deletePremiumBenefit = async (id: string) => {
    setPremiumConfig(prev => ({
      ...prev,
      benefits: (prev.benefits || []).filter(b => b.id !== id)
    }));
  };

  const activeFeatures = features.filter(f => f.isActive);

  return (
    <ContentContext.Provider value={{
      features,
      activeFeatures,
      loadingFeatures,
      addFeature,
      editFeature,
      deleteFeature,
      toggleFeatureStatus,
      isFeatureVisible,
      featureControls,
      updateFeatureControl,
      addFeatureControl,
      deleteFeatureControl,
      resetFeatureControls,
      navControls,
      updateNavControl,
      reorderNavControls,
      resetNavControls,
      adminNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      paymentMethods,
      addPaymentMethod,
      updatePaymentMethod,
      deletePaymentMethod,
      resetPaymentMethods,
      premiumConfig,
      updatePremiumConfig,
      addPremiumBenefit,
      updatePremiumBenefit,
      deletePremiumBenefit
    }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) throw new Error('useContent must be used within ContentProvider');
  return context;
};
