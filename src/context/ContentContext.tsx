import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AmenityFeature } from '../types';

interface ContentContextType {
  features: AmenityFeature[];
  activeFeatures: AmenityFeature[];
  loadingFeatures: boolean;
  addFeature: (name: string, category?: string, icon?: string) => Promise<void>;
  editFeature: (id: string, updates: Partial<AmenityFeature>) => Promise<void>;
  deleteFeature: (id: string) => Promise<void>;
  toggleFeatureStatus: (id: string, isActive: boolean) => Promise<void>;
  isFeatureVisible: (featureName: string) => boolean;
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

const ContentContext = createContext<ContentContextType | undefined>(undefined);

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<AmenityFeature[]>(defaultFeatures);
  const [loadingFeatures, setLoadingFeatures] = useState(true);

  // Firestore real-time listener for features
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
        // Seed default features in Firestore if empty
        defaultFeatures.forEach(async (feat) => {
          await setDoc(doc(db, 'features', feat.id), feat).catch(console.error);
        });
        setFeatures(defaultFeatures);
      }
      setLoadingFeatures(false);
    }, (err) => {
      console.warn('Error reading features real-time:', err);
      setLoadingFeatures(false);
    });

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
      isFeatureVisible
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
