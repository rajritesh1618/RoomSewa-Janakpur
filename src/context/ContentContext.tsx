import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  collection,
  deleteDoc,
  query,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  AppContentConfig,
  RoomFeature,
  AdminSettings,
  AppFaqItem,
  AppNoticeItem,
  AppFeatureControl,
  AppNavControl,
  PremiumConfig,
  PaymentMethodConfig,
  AdminNotification,
  PremiumBenefitItem
} from '../types';
import {
  DEFAULT_APP_CONTENT,
  DEFAULT_ROOM_FEATURES,
  DEFAULT_ADMIN_SETTINGS,
  DEFAULT_FEATURE_CONTROLS,
  DEFAULT_NAV_CONTROLS,
  DEFAULT_PREMIUM_CONFIG,
  DEFAULT_PAYMENT_METHODS
} from '../data/defaultContent';
import { sanitizeForFirestore } from '../utils/sanitizeFirestore';

interface ContentContextType {
  appContent: AppContentConfig;
  features: RoomFeature[];
  adminSettings: AdminSettings;
  featureControls: AppFeatureControl[];
  navControls: AppNavControl[];
  premiumConfig: PremiumConfig;
  paymentMethods: PaymentMethodConfig[];
  adminNotifications: AdminNotification[];
  unreadNotificationCount: number;
  unreadNotificationsCount: number;
  loadingContent: boolean;

  // Visibility & Permission Helpers
  isFeatureEnabled: (key: string, isAdmin?: boolean) => boolean;
  isFeatureVisible: (key: string, isAdmin?: boolean) => boolean;
  isNavVisible: (key: string, isAdmin?: boolean) => boolean;

  // App Content & Settings
  updateAppContent: (updates: Partial<AppContentConfig>) => Promise<void>;
  updateAdminSettings: (updates: Partial<AdminSettings>) => Promise<void>;

  // Room Amenities / Facilities & Custom Feature Builder
  addFeature: (feature: Omit<RoomFeature, 'id'>) => Promise<void>;
  updateFeature: (id: string, updates: Partial<RoomFeature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;
  toggleFeatureHidden: (id: string, currentHidden?: boolean) => Promise<void>;
  toggleFeatureDisabled: (id: string, currentDisabled?: boolean) => Promise<void>;
  reorderFeatures: (featureId: string, newOrder: number) => Promise<void>;
  resetFeaturesToDefault: () => Promise<void>;

  // FAQs & Notices
  addFaq: (faq: Omit<AppFaqItem, 'id'>) => Promise<void>;
  updateFaq: (id: string, updates: Partial<AppFaqItem>) => Promise<void>;
  deleteFaq: (id: string) => Promise<void>;
  addNotice: (notice: Omit<AppNoticeItem, 'id' | 'createdAt'>) => Promise<void>;
  updateNotice: (id: string, updates: Partial<AppNoticeItem>) => Promise<void>;
  deleteNotice: (id: string) => Promise<void>;

  // Feature Visibility & App Controls (Section 7)
  updateFeatureControl: (id: string, updates: Partial<AppFeatureControl>) => Promise<void>;
  addFeatureControl: (feature: Omit<AppFeatureControl, 'id' | 'updatedAt'>) => Promise<void>;
  deleteFeatureControl: (id: string) => Promise<void>;
  resetFeatureControls: () => Promise<void>;

  // Navigation / Menu Control (Section 8)
  updateNavControl: (id: string, updates: Partial<AppNavControl>) => Promise<void>;
  reorderNavControls: (newOrderList: AppNavControl[]) => Promise<void>;
  resetNavControls: () => Promise<void>;

  // Premium Management (Section 9)
  updatePremiumConfig: (updates: Partial<PremiumConfig>) => Promise<void>;
  addPremiumBenefit: (benefit: Omit<PremiumBenefitItem, 'id' | 'order'>) => Promise<void>;
  updatePremiumBenefit: (benefitId: string, updates: Partial<PremiumBenefitItem>) => Promise<void>;
  deletePremiumBenefit: (benefitId: string) => Promise<void>;
  reorderPremiumBenefits: (newBenefits: PremiumBenefitItem[]) => Promise<void>;

  // Payment Management (Section 10)
  addPaymentMethod: (method: Omit<PaymentMethodConfig, 'id' | 'updatedAt'>) => Promise<void>;
  updatePaymentMethod: (id: string, updates: Partial<PaymentMethodConfig>) => Promise<void>;
  deletePaymentMethod: (id: string) => Promise<void>;
  resetPaymentMethods: () => Promise<void>;

  // Notifications (Section 12)
  createAdminNotification: (notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
}

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [appContent, setAppContent] = useState<AppContentConfig>(DEFAULT_APP_CONTENT);
  const [features, setFeatures] = useState<RoomFeature[]>(DEFAULT_ROOM_FEATURES);
  const [adminSettings, setAdminSettings] = useState<AdminSettings>(DEFAULT_ADMIN_SETTINGS);
  const [featureControls, setFeatureControls] = useState<AppFeatureControl[]>(DEFAULT_FEATURE_CONTROLS);
  const [navControls, setNavControls] = useState<AppNavControl[]>(DEFAULT_NAV_CONTROLS);
  const [premiumConfig, setPremiumConfig] = useState<PremiumConfig>(DEFAULT_PREMIUM_CONFIG);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(DEFAULT_PAYMENT_METHODS);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);
  const [loadingContent, setLoadingContent] = useState(true);

  // 1. App Content Sync (Firestore /settings/appContent)
  useEffect(() => {
    const contentRef = doc(db, 'settings', 'appContent');
    const unsub = onSnapshot(
      contentRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setAppContent({ ...DEFAULT_APP_CONTENT, ...(docSnap.data() as AppContentConfig) });
        } else {
          try {
            await setDoc(contentRef, DEFAULT_APP_CONTENT);
          } catch {
            // Ignore for guest
          }
        }
        setLoadingContent(false);
      },
      () => {
        setAppContent(DEFAULT_APP_CONTENT);
        setLoadingContent(false);
      }
    );

    return () => unsub();
  }, []);

  // 2. Admin Settings Sync (Firestore /settings/adminSettings)
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'adminSettings');
    const unsub = onSnapshot(
      settingsRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setAdminSettings({ ...DEFAULT_ADMIN_SETTINGS, ...(docSnap.data() as AdminSettings) });
        } else {
          try {
            await setDoc(settingsRef, DEFAULT_ADMIN_SETTINGS);
          } catch {
            // Ignore
          }
        }
      },
      () => {
        setAdminSettings(DEFAULT_ADMIN_SETTINGS);
      }
    );

    return () => unsub();
  }, []);

  // 3. Room Features Sync (Firestore collection /features)
  useEffect(() => {
    const featuresCol = collection(db, 'features');
    const unsub = onSnapshot(
      featuresCol,
      async (snapshot) => {
        if (snapshot.empty) {
          try {
            for (const f of DEFAULT_ROOM_FEATURES) {
              const sanitized = sanitizeForFirestore({
                ...f,
                textConfig: f.textConfig ?? null,
                numberConfig: f.numberConfig ?? null,
                priceConfig: f.priceConfig ?? null,
                yesNoConfig: f.yesNoConfig ?? null,
                timeConfig: f.timeConfig ?? null,
                dateConfig: f.dateConfig ?? null,
                imageConfig: f.imageConfig ?? null,
                options: Array.isArray(f.options) ? f.options : []
              });
              await setDoc(doc(db, 'features', f.id), sanitized);
            }
          } catch {
            setFeatures(DEFAULT_ROOM_FEATURES);
          }
        } else {
          const list: RoomFeature[] = [];
          snapshot.forEach((d) => {
            const data = d.data() || {};
            list.push({
              ...data,
              id: d.id,
              name: data.name || 'Untitled Feature',
              inputType: data.inputType || (Array.isArray(data.options) && data.options.length > 0 ? 'checklist' : 'text'),
              options: Array.isArray(data.options)
                ? data.options.map((opt: any, i: number) => ({
                    id: opt?.id || `opt-${i + 1}`,
                    name: opt?.name || `Option ${i + 1}`,
                    description: opt?.description ?? '',
                    icon: opt?.icon ?? null,
                    order: opt?.order ?? (i + 1),
                    isHidden: Boolean(opt?.isHidden),
                    isDisabled: Boolean(opt?.isDisabled),
                    isDefault: Boolean(opt?.isDefault),
                    hasPriceInput: Boolean(opt?.hasPriceInput),
                    priceLabel: opt?.priceLabel ?? null,
                    currency: opt?.currency ?? null,
                    priceUnit: opt?.priceUnit ?? null,
                    priceRequired: Boolean(opt?.priceRequired),
                    defaultPrice: opt?.defaultPrice ?? null,
                    hasCustomTextInput: Boolean(opt?.hasCustomTextInput),
                    customTextLabel: opt?.customTextLabel ?? null,
                    customTextPlaceholder: opt?.customTextPlaceholder ?? null,
                    customTextRequired: Boolean(opt?.customTextRequired)
                  }))
                : [],
              order: data.order ?? 1,
              isHidden: Boolean(data.isHidden),
              isDisabled: Boolean(data.isDisabled),
              isRequired: Boolean(data.isRequired),
              category: data.category || 'basic',
              icon: data.icon || 'Layers',
              description: data.description || '',
              selectionType: data.selectionType || (data.inputType === 'single_select' ? 'single' : 'multiple'),
              allowCustomOption: Boolean(data.allowCustomOption),
              textConfig: data.textConfig ?? null,
              numberConfig: data.numberConfig ?? null,
              priceConfig: data.priceConfig ?? null,
              yesNoConfig: data.yesNoConfig ?? null,
              timeConfig: data.timeConfig ?? null,
              dateConfig: data.dateConfig ?? null,
              imageConfig: data.imageConfig ?? null
            } as RoomFeature);
          });
          list.sort((a, b) => (a.order || 0) - (b.order || 0));
          setFeatures(list);
        }
      },
      () => {
        setFeatures(DEFAULT_ROOM_FEATURES);
      }
    );

    return () => unsub();
  }, []);

  // 4. Feature Visibility Controls Sync (Firestore /settings/appControls)
  useEffect(() => {
    const controlsRef = doc(db, 'settings', 'appControls');
    const unsub = onSnapshot(
      controlsRef,
      async (docSnap) => {
        if (docSnap.exists() && docSnap.data().items) {
          setFeatureControls(docSnap.data().items as AppFeatureControl[]);
        } else {
          try {
            await setDoc(controlsRef, { items: DEFAULT_FEATURE_CONTROLS, updatedAt: new Date().toISOString() });
          } catch {
            // Ignore
          }
        }
      },
      () => {
        setFeatureControls(DEFAULT_FEATURE_CONTROLS);
      }
    );

    return () => unsub();
  }, []);

  // 5. Navigation Controls Sync (Firestore /settings/navControls)
  useEffect(() => {
    const navRef = doc(db, 'settings', 'navControls');
    const unsub = onSnapshot(
      navRef,
      async (docSnap) => {
        if (docSnap.exists() && docSnap.data().items) {
          const sorted = [...(docSnap.data().items as AppNavControl[])].sort((a, b) => a.order - b.order);
          setNavControls(sorted);
        } else {
          try {
            await setDoc(navRef, { items: DEFAULT_NAV_CONTROLS, updatedAt: new Date().toISOString() });
          } catch {
            // Ignore
          }
        }
      },
      () => {
        setNavControls(DEFAULT_NAV_CONTROLS);
      }
    );

    return () => unsub();
  }, []);

  // 6. Premium Config Sync (Firestore /settings/premiumConfig)
  useEffect(() => {
    const premRef = doc(db, 'settings', 'premiumConfig');
    const unsub = onSnapshot(
      premRef,
      async (docSnap) => {
        if (docSnap.exists()) {
          setPremiumConfig({ ...DEFAULT_PREMIUM_CONFIG, ...(docSnap.data() as PremiumConfig) });
        } else {
          try {
            await setDoc(premRef, DEFAULT_PREMIUM_CONFIG);
          } catch {
            // Ignore
          }
        }
      },
      () => {
        setPremiumConfig(DEFAULT_PREMIUM_CONFIG);
      }
    );

    return () => unsub();
  }, []);

  // 7. Payment Methods Sync (Firestore /settings/paymentMethods)
  useEffect(() => {
    const payRef = doc(db, 'settings', 'paymentMethods');
    const unsub = onSnapshot(
      payRef,
      async (docSnap) => {
        if (docSnap.exists() && docSnap.data().items) {
          const sorted = [...(docSnap.data().items as PaymentMethodConfig[])].sort((a, b) => a.order - b.order);
          setPaymentMethods(sorted);
        } else {
          try {
            await setDoc(payRef, { items: DEFAULT_PAYMENT_METHODS, updatedAt: new Date().toISOString() });
          } catch {
            // Ignore
          }
        }
      },
      () => {
        setPaymentMethods(DEFAULT_PAYMENT_METHODS);
      }
    );

    return () => unsub();
  }, []);

  // 8. Admin Notifications Sync (Firestore collection /adminNotifications)
  useEffect(() => {
    const notifsCol = collection(db, 'adminNotifications');
    const q = query(notifsCol, orderBy('createdAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: AdminNotification[] = [];
        snapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() } as AdminNotification);
        });
        setAdminNotifications(list);
      },
      () => {
        setAdminNotifications([]);
      }
    );

    return () => unsub();
  }, []);

  const unreadNotificationCount = useMemo(() => {
    return adminNotifications.filter((n) => !n.read).length;
  }, [adminNotifications]);

  // Visibility & Permission Helpers
  const isFeatureEnabled = (key: string, isAdmin?: boolean): boolean => {
    if (key === 'admin' || key === 'admin_panel') return true;
    if (isAdmin) return true;
    const feat = featureControls.find((f) => f.key === key);
    if (!feat) return true;
    return feat.enabled;
  };

  const isFeatureVisible = (key: string, isAdmin?: boolean): boolean => {
    if (key === 'admin' || key === 'admin_panel') return true;
    if (isAdmin) return true;
    const feat = featureControls.find((f) => f.key === key);
    if (!feat) return true;
    return feat.enabled && feat.visible;
  };

  const isNavVisible = (key: string, isAdmin?: boolean): boolean => {
    if (key === 'admin') return Boolean(isAdmin);
    if (isAdmin) return true;
    const nav = navControls.find((n) => n.key === key);
    if (!nav) return true;
    return nav.visible;
  };

  // Content actions
  const updateAppContent = async (updates: Partial<AppContentConfig>) => {
    const contentRef = doc(db, 'settings', 'appContent');
    const newContent = { ...appContent, ...updates };
    setAppContent(newContent);
    await setDoc(contentRef, newContent, { merge: true });
  };

  const updateAdminSettings = async (updates: Partial<AdminSettings>) => {
    const settingsRef = doc(db, 'settings', 'adminSettings');
    const newSettings = { ...adminSettings, ...updates };
    setAdminSettings(newSettings);
    await setDoc(settingsRef, newSettings, { merge: true });
  };

  const addFeature = async (feature: Omit<RoomFeature, 'id'>) => {
    const rawName = feature.name ? feature.name.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'custom';
    const cleanSlug = rawName.replace(/-+/g, '-').replace(/^-|-$/g, '') || 'feature';
    const featureId = `feat-${cleanSlug}-${Date.now()}`;

    const newFeature: RoomFeature = {
      id: featureId,
      name: feature.name ? feature.name.trim() : 'Untitled Feature',
      description: feature.description ? feature.description.trim() : '',
      icon: feature.icon || 'Layers',
      category: feature.category || 'basic',
      order: feature.order ?? (features.length + 1),
      isRequired: Boolean(feature.isRequired),
      isHidden: Boolean(feature.isHidden),
      isDisabled: Boolean(feature.isDisabled),
      inputType: feature.inputType || 'checklist',
      selectionType: feature.selectionType || (feature.inputType === 'single_select' ? 'single' : 'multiple'),
      allowCustomOption: Boolean(feature.allowCustomOption),
      options: Array.isArray(feature.options)
        ? feature.options.map((opt, i) => ({
            id: opt?.id || `opt-${Date.now()}-${i}`,
            name: opt?.name || `Option ${i + 1}`,
            description: opt?.description ?? null,
            icon: opt?.icon ?? null,
            order: opt?.order ?? (i + 1),
            isHidden: Boolean(opt?.isHidden),
            isDisabled: Boolean(opt?.isDisabled),
            isDefault: Boolean(opt?.isDefault),
            hasPriceInput: Boolean(opt?.hasPriceInput),
            priceLabel: opt?.hasPriceInput ? (opt?.priceLabel ?? 'Rate') : null,
            currency: opt?.hasPriceInput ? (opt?.currency ?? 'रु') : null,
            priceUnit: opt?.hasPriceInput ? (opt?.priceUnit ?? 'unit') : null,
            priceRequired: opt?.hasPriceInput ? Boolean(opt?.priceRequired) : false,
            defaultPrice:
              opt?.hasPriceInput && opt?.defaultPrice !== null && opt?.defaultPrice !== undefined && (opt?.defaultPrice as any) !== ''
                ? Number(opt.defaultPrice)
                : null,
            hasCustomTextInput: Boolean(opt?.hasCustomTextInput),
            customTextLabel: opt?.customTextLabel ?? null,
            customTextPlaceholder: opt?.customTextPlaceholder ?? null,
            customTextRequired: false
          }))
        : [],
      textConfig: feature.textConfig
        ? {
            label: feature.textConfig.label ?? '',
            placeholder: feature.textConfig.placeholder ?? '',
            maxCharacters: feature.textConfig.maxCharacters ?? 150
          }
        : null,
      numberConfig: feature.numberConfig
        ? {
            label: feature.numberConfig.label ?? '',
            placeholder: feature.numberConfig.placeholder ?? '',
            minValue: feature.numberConfig.minValue ?? 0,
            maxValue: feature.numberConfig.maxValue ?? null,
            allowDecimals: Boolean(feature.numberConfig.allowDecimals),
            unit: feature.numberConfig.unit ?? ''
          }
        : null,
      priceConfig: feature.priceConfig
        ? {
            currency: feature.priceConfig.currency ?? 'रु',
            priceLabel: feature.priceConfig.priceLabel ?? 'Price',
            minAmount: feature.priceConfig.minAmount ?? null,
            maxAmount: feature.priceConfig.maxAmount ?? null,
            unit: feature.priceConfig.unit ?? 'per month'
          }
        : null,
      yesNoConfig: feature.yesNoConfig
        ? {
            yesLabel: feature.yesNoConfig.yesLabel ?? 'Yes',
            noLabel: feature.yesNoConfig.noLabel ?? 'No'
          }
        : null,
      timeConfig: feature.timeConfig
        ? {
            label: feature.timeConfig.label ?? 'Time',
            format: feature.timeConfig.format ?? '12h'
          }
        : null,
      dateConfig: feature.dateConfig
        ? {
            label: feature.dateConfig.label ?? 'Date',
            minDate: feature.dateConfig.minDate ?? null
          }
        : null,
      imageConfig: feature.imageConfig
        ? {
            maxImages: feature.imageConfig.maxImages ?? 3,
            maxSizeMB: feature.imageConfig.maxSizeMB ?? 5
          }
        : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sanitized = sanitizeForFirestore(newFeature);
    await setDoc(doc(db, 'features', featureId), sanitized);
  };

  const updateFeature = async (id: string, updates: Partial<RoomFeature>) => {
    const cleanUpdates: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) {
        cleanUpdates[k] = null;
      } else {
        cleanUpdates[k] = v;
      }
    }
    if ('options' in updates) {
      cleanUpdates.options = Array.isArray(updates.options)
        ? updates.options.map((opt: any, i: number) => ({
            id: opt?.id || `opt-${Date.now()}-${i}`,
            name: opt?.name || `Option ${i + 1}`,
            description: opt?.description ?? null,
            icon: opt?.icon ?? null,
            order: opt?.order ?? (i + 1),
            isHidden: Boolean(opt?.isHidden),
            isDisabled: Boolean(opt?.isDisabled),
            isDefault: Boolean(opt?.isDefault),
            hasPriceInput: Boolean(opt?.hasPriceInput),
            priceLabel: opt?.hasPriceInput ? (opt?.priceLabel ?? 'Rate') : null,
            currency: opt?.hasPriceInput ? (opt?.currency ?? 'रु') : null,
            priceUnit: opt?.hasPriceInput ? (opt?.priceUnit ?? 'unit') : null,
            priceRequired: opt?.hasPriceInput ? Boolean(opt?.priceRequired) : false,
            defaultPrice:
              opt?.hasPriceInput && opt?.defaultPrice !== null && opt?.defaultPrice !== undefined && (opt?.defaultPrice as any) !== ''
                ? Number(opt.defaultPrice)
                : null,
            hasCustomTextInput: Boolean(opt?.hasCustomTextInput),
            customTextLabel: opt?.customTextLabel ?? null,
            customTextPlaceholder: opt?.customTextPlaceholder ?? null,
            customTextRequired: false
          }))
        : [];
    }
    if ('textConfig' in updates) {
      cleanUpdates.textConfig = updates.textConfig
        ? {
            label: updates.textConfig.label ?? '',
            placeholder: updates.textConfig.placeholder ?? '',
            maxCharacters: updates.textConfig.maxCharacters ?? 150
          }
        : null;
    }
    if ('numberConfig' in updates) {
      cleanUpdates.numberConfig = updates.numberConfig
        ? {
            label: updates.numberConfig.label ?? '',
            placeholder: updates.numberConfig.placeholder ?? '',
            minValue: updates.numberConfig.minValue ?? 0,
            maxValue: updates.numberConfig.maxValue ?? null,
            allowDecimals: Boolean(updates.numberConfig.allowDecimals),
            unit: updates.numberConfig.unit ?? ''
          }
        : null;
    }
    if ('priceConfig' in updates) {
      cleanUpdates.priceConfig = updates.priceConfig
        ? {
            currency: updates.priceConfig.currency ?? 'रु',
            priceLabel: updates.priceConfig.priceLabel ?? 'Price',
            minAmount: updates.priceConfig.minAmount ?? null,
            maxAmount: updates.priceConfig.maxAmount ?? null,
            unit: updates.priceConfig.unit ?? 'per month'
          }
        : null;
    }
    if ('yesNoConfig' in updates) {
      cleanUpdates.yesNoConfig = updates.yesNoConfig
        ? {
            yesLabel: updates.yesNoConfig.yesLabel ?? 'Yes',
            noLabel: updates.yesNoConfig.noLabel ?? 'No'
          }
        : null;
    }
    if ('timeConfig' in updates) {
      cleanUpdates.timeConfig = updates.timeConfig
        ? {
            label: updates.timeConfig.label ?? 'Time',
            format: updates.timeConfig.format ?? '12h'
          }
        : null;
    }
    if ('dateConfig' in updates) {
      cleanUpdates.dateConfig = updates.dateConfig
        ? {
            label: updates.dateConfig.label ?? 'Date',
            minDate: updates.dateConfig.minDate ?? null
          }
        : null;
    }
    if ('imageConfig' in updates) {
      cleanUpdates.imageConfig = updates.imageConfig
        ? {
            maxImages: updates.imageConfig.maxImages ?? 3,
            maxSizeMB: updates.imageConfig.maxSizeMB ?? 5
          }
        : null;
    }

    const sanitized = sanitizeForFirestore(cleanUpdates);
    await updateDoc(doc(db, 'features', id), sanitized);
  };

  const deleteFeature = async (id: string) => {
    await deleteDoc(doc(db, 'features', id));
  };

  const toggleFeatureHidden = async (id: string, currentHidden?: boolean) => {
    await updateDoc(doc(db, 'features', id), {
      isHidden: !currentHidden,
      updatedAt: new Date().toISOString()
    });
  };

  const toggleFeatureDisabled = async (id: string, currentDisabled?: boolean) => {
    await updateDoc(doc(db, 'features', id), {
      isDisabled: !currentDisabled,
      updatedAt: new Date().toISOString()
    });
  };

  const reorderFeatures = async (featureId: string, newOrder: number) => {
    await updateDoc(doc(db, 'features', featureId), {
      order: newOrder,
      updatedAt: new Date().toISOString()
    });
  };

  const resetFeaturesToDefault = async () => {
    for (const f of DEFAULT_ROOM_FEATURES) {
      const sanitized = sanitizeForFirestore({
        ...f,
        textConfig: f.textConfig ?? null,
        numberConfig: f.numberConfig ?? null,
        priceConfig: f.priceConfig ?? null,
        yesNoConfig: f.yesNoConfig ?? null,
        timeConfig: f.timeConfig ?? null,
        dateConfig: f.dateConfig ?? null,
        imageConfig: f.imageConfig ?? null,
        options: Array.isArray(f.options) ? f.options : []
      });
      await setDoc(doc(db, 'features', f.id), sanitized);
    }
  };

  const addFaq = async (faq: Omit<AppFaqItem, 'id'>) => {
    const newId = 'faq-' + Date.now();
    const currentFaqs = appContent.faqs || [];
    const updated = [...currentFaqs, { id: newId, ...faq, order: faq.order ?? currentFaqs.length + 1 }];
    await updateAppContent({ faqs: updated });
  };

  const updateFaq = async (id: string, updates: Partial<AppFaqItem>) => {
    const currentFaqs = appContent.faqs || [];
    const updated = currentFaqs.map((f) => (f.id === id ? { ...f, ...updates } : f));
    await updateAppContent({ faqs: updated });
  };

  const deleteFaq = async (id: string) => {
    const currentFaqs = appContent.faqs || [];
    const updated = currentFaqs.filter((f) => f.id !== id);
    await updateAppContent({ faqs: updated });
  };

  const addNotice = async (notice: Omit<AppNoticeItem, 'id' | 'createdAt'>) => {
    const newId = 'notice-' + Date.now();
    const currentNotices = appContent.notices || [];
    const updated = [
      { id: newId, ...notice, createdAt: new Date().toISOString(), isHidden: notice.isHidden ?? false },
      ...currentNotices
    ];
    await updateAppContent({ notices: updated });
  };

  const updateNotice = async (id: string, updates: Partial<AppNoticeItem>) => {
    const currentNotices = appContent.notices || [];
    const updated = currentNotices.map((n) => (n.id === id ? { ...n, ...updates } : n));
    await updateAppContent({ notices: updated });
  };

  const deleteNotice = async (id: string) => {
    const currentNotices = appContent.notices || [];
    const updated = currentNotices.filter((n) => n.id !== id);
    await updateAppContent({ notices: updated });
  };

  // Section 7: Feature Controls Actions
  const updateFeatureControl = async (id: string, updates: Partial<AppFeatureControl>) => {
    const updated = featureControls.map((f) =>
      f.id === id ? { ...f, ...updates, updatedAt: new Date().toISOString() } : f
    );
    setFeatureControls(updated);
    const controlsRef = doc(db, 'settings', 'appControls');
    await setDoc(controlsRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const addFeatureControl = async (feature: Omit<AppFeatureControl, 'id' | 'updatedAt'>) => {
    const newId = 'feat-' + feature.key.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now();
    const newFeat: AppFeatureControl = {
      ...feature,
      id: newId,
      updatedAt: new Date().toISOString()
    };
    const updated = [...featureControls, newFeat];
    setFeatureControls(updated);
    const controlsRef = doc(db, 'settings', 'appControls');
    await setDoc(controlsRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const deleteFeatureControl = async (id: string) => {
    const updated = featureControls.filter((f) => f.id !== id);
    setFeatureControls(updated);
    const controlsRef = doc(db, 'settings', 'appControls');
    await setDoc(controlsRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const resetFeatureControls = async () => {
    setFeatureControls(DEFAULT_FEATURE_CONTROLS);
    const controlsRef = doc(db, 'settings', 'appControls');
    await setDoc(controlsRef, { items: DEFAULT_FEATURE_CONTROLS, updatedAt: new Date().toISOString() });
  };

  // Section 8: Navigation Controls Actions
  const updateNavControl = async (id: string, updates: Partial<AppNavControl>) => {
    const updated = navControls.map((n) =>
      n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
    );
    setNavControls(updated);
    const navRef = doc(db, 'settings', 'navControls');
    await setDoc(navRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const reorderNavControls = async (newOrderList: AppNavControl[]) => {
    const updated = newOrderList.map((item, idx) => ({ ...item, order: idx + 1 }));
    setNavControls(updated);
    const navRef = doc(db, 'settings', 'navControls');
    await setDoc(navRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const resetNavControls = async () => {
    setNavControls(DEFAULT_NAV_CONTROLS);
    const navRef = doc(db, 'settings', 'navControls');
    await setDoc(navRef, { items: DEFAULT_NAV_CONTROLS, updatedAt: new Date().toISOString() });
  };

  // Section 9: Premium Management Actions
  const updatePremiumConfig = async (updates: Partial<PremiumConfig>) => {
    const updated: PremiumConfig = {
      ...premiumConfig,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    setPremiumConfig(updated);
    const premRef = doc(db, 'settings', 'premiumConfig');
    await setDoc(premRef, updated);
  };

  const addPremiumBenefit = async (benefit: Omit<PremiumBenefitItem, 'id' | 'order'>) => {
    const newId = 'benefit-' + Date.now();
    const currentBenefits = premiumConfig.benefits || [];
    const newBenefit: PremiumBenefitItem = {
      id: newId,
      ...benefit,
      order: currentBenefits.length + 1
    };
    await updatePremiumConfig({ benefits: [...currentBenefits, newBenefit] });
  };

  const updatePremiumBenefit = async (benefitId: string, updates: Partial<PremiumBenefitItem>) => {
    const currentBenefits = premiumConfig.benefits || [];
    const updated = currentBenefits.map((b) => (b.id === benefitId ? { ...b, ...updates } : b));
    await updatePremiumConfig({ benefits: updated });
  };

  const deletePremiumBenefit = async (benefitId: string) => {
    const currentBenefits = premiumConfig.benefits || [];
    const updated = currentBenefits.filter((b) => b.id !== benefitId);
    await updatePremiumConfig({ benefits: updated });
  };

  const reorderPremiumBenefits = async (newBenefits: PremiumBenefitItem[]) => {
    const updated = newBenefits.map((b, idx) => ({ ...b, order: idx + 1 }));
    await updatePremiumConfig({ benefits: updated });
  };

  // Section 10: Payment Management Actions
  const addPaymentMethod = async (method: Omit<PaymentMethodConfig, 'id' | 'updatedAt'>) => {
    const newId = 'pm-' + method.code + '-' + Date.now();
    const newMethod: PaymentMethodConfig = {
      id: newId,
      ...method,
      order: method.order ?? paymentMethods.length + 1,
      updatedAt: new Date().toISOString()
    };
    const updated = [...paymentMethods, newMethod];
    setPaymentMethods(updated);
    const payRef = doc(db, 'settings', 'paymentMethods');
    await setDoc(payRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const updatePaymentMethod = async (id: string, updates: Partial<PaymentMethodConfig>) => {
    const updated = paymentMethods.map((m) =>
      m.id === id ? { ...m, ...updates, updatedAt: new Date().toISOString() } : m
    );
    setPaymentMethods(updated);
    const payRef = doc(db, 'settings', 'paymentMethods');
    await setDoc(payRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const deletePaymentMethod = async (id: string) => {
    const updated = paymentMethods.filter((m) => m.id !== id);
    setPaymentMethods(updated);
    const payRef = doc(db, 'settings', 'paymentMethods');
    await setDoc(payRef, { items: updated, updatedAt: new Date().toISOString() });
  };

  const resetPaymentMethods = async () => {
    setPaymentMethods(DEFAULT_PAYMENT_METHODS);
    const payRef = doc(db, 'settings', 'paymentMethods');
    await setDoc(payRef, { items: DEFAULT_PAYMENT_METHODS, updatedAt: new Date().toISOString() });
  };

  // Section 12: Notifications Actions
  const createAdminNotification = async (notification: Omit<AdminNotification, 'id' | 'createdAt' | 'read'>) => {
    try {
      const notifsCol = collection(db, 'adminNotifications');
      await addDoc(notifsCol, {
        ...notification,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch {
      // Non-blocking
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'adminNotifications', id), { read: true });
    } catch {
      // Ignore
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = adminNotifications.filter((n) => !n.read);
    for (const notif of unread) {
      try {
        await updateDoc(doc(db, 'adminNotifications', notif.id), { read: true });
      } catch {
        // Continue
      }
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'adminNotifications', id));
    } catch {
      // Ignore
    }
  };

  return (
    <ContentContext.Provider
      value={{
        appContent,
        features,
        adminSettings,
        featureControls,
        navControls,
        premiumConfig,
        paymentMethods,
        adminNotifications,
        unreadNotificationCount,
        unreadNotificationsCount: unreadNotificationCount,
        loadingContent,

        isFeatureEnabled,
        isFeatureVisible,
        isNavVisible,

        updateAppContent,
        updateAdminSettings,
        addFeature,
        updateFeature,
        deleteFeature,
        toggleFeatureHidden,
        toggleFeatureDisabled,
        reorderFeatures,
        resetFeaturesToDefault,
        addFaq,
        updateFaq,
        deleteFaq,
        addNotice,
        updateNotice,
        deleteNotice,

        updateFeatureControl,
        addFeatureControl,
        deleteFeatureControl,
        resetFeatureControls,

        updateNavControl,
        reorderNavControls,
        resetNavControls,

        updatePremiumConfig,
        addPremiumBenefit,
        updatePremiumBenefit,
        deletePremiumBenefit,
        reorderPremiumBenefits,

        addPaymentMethod,
        updatePaymentMethod,
        deletePaymentMethod,
        resetPaymentMethods,

        createAdminNotification,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification
      }}
    >
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error('useContent must be used within a ContentProvider');
  }
  return context;
};
