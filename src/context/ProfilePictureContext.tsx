import React, { createContext, useContext, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface ProfilePictureContextType {
  uploading: boolean;
  uploadProfilePicture: (file: File) => Promise<string>;
}

const ProfilePictureContext = createContext<ProfilePictureContextType | undefined>(undefined);

export const ProfilePictureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('Not logged in');
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ avatarUrl: url });
      setUploading(false);
      return url;
    } catch (err) {
      setUploading(false);
      console.warn('Storage upload error, using local data URL fallback:', err);
      // Fallback data URL if storage bucket rule fails
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          await updateUserProfile({ avatarUrl: dataUrl });
          resolve(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <ProfilePictureContext.Provider value={{ uploading, uploadProfilePicture }}>
      {children}
    </ProfilePictureContext.Provider>
  );
};

export const useProfilePicture = () => {
  const context = useContext(ProfilePictureContext);
  if (!context) throw new Error('useProfilePicture must be used within ProfilePictureProvider');
  return context;
};
