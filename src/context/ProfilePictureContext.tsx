import React, { createContext, useContext, useState, useRef } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from './AuthContext';

export interface ProfilePictureContextType {
  uploading: boolean;
  isUploading: boolean;
  uploadProfilePicture: (file: File) => Promise<string>;
  isMenuOpen: boolean;
  closeMenu: () => void;
  openMenu: (user?: any) => void;
  isViewerOpen: boolean;
  closeViewer: () => void;
  openViewer: (urlOrUser?: any) => void;
  isConfirmModalOpen: boolean;
  activeUser: any;
  selectedFile: File | null;
  previewUrl: string | null;
  fileError: string | null;
  successMessage: string | null;
  triggerFilePicker: () => void;
  confirmAndSave: () => Promise<void>;
  cancelSelection: () => void;
  clearSuccessMessage: () => void;
}

const ProfilePictureContext = createContext<ProfilePictureContextType | undefined>(undefined);

export const ProfilePictureProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const openMenu = (user?: any) => {
    setActiveUser(user || userProfile || currentUser);
    setIsMenuOpen(true);
  };

  const closeMenu = () => setIsMenuOpen(false);

  const openViewer = (urlOrUser?: any) => {
    if (typeof urlOrUser === 'string') {
      setActiveUser({ photoURL: urlOrUser, avatarUrl: urlOrUser, displayName: 'Photo' });
    } else if (urlOrUser) {
      setActiveUser(urlOrUser);
    } else {
      setActiveUser(userProfile || currentUser);
    }
    setIsViewerOpen(true);
    setIsMenuOpen(false);
  };

  const closeViewer = () => setIsViewerOpen(false);

  const triggerFilePicker = () => {
    closeMenu();
    if (!fileInputRef.current) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelected(file);
      };
      fileInputRef.current = input;
    }
    fileInputRef.current.click();
  };

  const handleFileSelected = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File size exceeds 5MB limit.');
      return;
    }
    setFileError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsConfirmModalOpen(true);
  };

  const cancelSelection = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setIsConfirmModalOpen(false);
  };

  const confirmAndSave = async () => {
    if (!selectedFile) return;
    try {
      await uploadProfilePicture(selectedFile);
      setSuccessMessage('Profile picture updated successfully!');
      cancelSelection();
    } catch (err: any) {
      setFileError(err?.message || 'Failed to upload image.');
    }
  };

  const clearSuccessMessage = () => setSuccessMessage(null);

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('Not logged in');
    setUploading(true);
    try {
      const storageRef = ref(storage, `avatars/${currentUser.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await updateUserProfile({ avatarUrl: url, photoURL: url });
      setUploading(false);
      return url;
    } catch (err) {
      setUploading(false);
      console.warn('Storage upload fallback:', err);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const dataUrl = e.target?.result as string;
          await updateUserProfile({ avatarUrl: dataUrl, photoURL: dataUrl });
          resolve(dataUrl);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <ProfilePictureContext.Provider value={{
      uploading,
      isUploading: uploading,
      uploadProfilePicture,
      isMenuOpen,
      closeMenu,
      openMenu,
      isViewerOpen,
      closeViewer,
      openViewer,
      isConfirmModalOpen,
      activeUser,
      selectedFile,
      previewUrl,
      fileError,
      successMessage,
      triggerFilePicker,
      confirmAndSave,
      cancelSelection,
      clearSuccessMessage
    }}>
      {children}
    </ProfilePictureContext.Provider>
  );
};

export const useProfilePicture = () => {
  const context = useContext(ProfilePictureContext);
  if (!context) throw new Error('useProfilePicture must be used within ProfilePictureProvider');
  return context;
};
