import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { uploadAndSaveProfilePicture, validateProfilePictureFile } from '../utils/profileStorage';
import { UserRole } from '../types';

export interface ProfileTargetUser {
  uid: string;
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: UserRole;
  isCurrentUser?: boolean;
}

interface ProfilePictureContextType {
  // Modal states
  isMenuOpen: boolean;
  isViewerOpen: boolean;
  isConfirmModalOpen: boolean;
  activeUser: ProfileTargetUser | null;

  // File and preview states
  selectedFile: File | null;
  previewUrl: string | null;
  fileError: string | null;
  isUploading: boolean;
  successMessage: string | null;

  // Actions
  openMenu: (user?: Partial<ProfileTargetUser>) => void;
  closeMenu: () => void;
  openViewer: (user?: Partial<ProfileTargetUser>) => void;
  closeViewer: () => void;
  triggerFilePicker: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  confirmAndSave: () => Promise<void>;
  cancelSelection: () => void;
  clearSuccessMessage: () => void;
}

const ProfilePictureContext = createContext<ProfilePictureContextType | undefined>(undefined);

export const ProfilePictureProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<ProfileTargetUser | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const resolveTargetUser = (user?: Partial<ProfileTargetUser>): ProfileTargetUser => {
    // Only resolve to current logged-in user if no target user was specified, or if user explicitly represents currentUser without an external photo
    const isSelf = !user || (!user.photoURL && (!user.uid || user.uid === currentUser?.uid));
    if (isSelf) {
      return {
        uid: currentUser?.uid || 'anonymous',
        displayName: userProfile?.displayName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User',
        email: currentUser?.email || undefined,
        photoURL: userProfile?.photoURL || currentUser?.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.uid || 'guest'}`,
        role: userProfile?.role || 'seeker',
        isCurrentUser: true
      };
    }

    return {
      uid: user.uid || 'external',
      displayName: user.displayName || 'User',
      email: user.email,
      photoURL: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid || 'user'}`,
      role: user.role || 'seeker',
      isCurrentUser: false
    };
  };

  const openMenu = (user?: Partial<ProfileTargetUser>) => {
    const target = resolveTargetUser(user);
    setActiveUser(target);
    setIsMenuOpen(true);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const openViewer = (user?: Partial<ProfileTargetUser>) => {
    const target = resolveTargetUser(user);
    setActiveUser(target);
    setIsMenuOpen(false);
    setIsViewerOpen(true);
  };

  const closeViewer = () => {
    setIsViewerOpen(false);
  };

  const triggerFilePicker = () => {
    if (isUploading) return; // Prevent multiple uploads while processing
    setIsMenuOpen(false);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isUploading) return; // Prevent opening while an upload is in flight
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const validation = validateProfilePictureFile(file);

    // Make sure activeUser is self
    setActiveUser(resolveTargetUser());

    if (!validation.valid) {
      setFileError(validation.error || 'Invalid file.');
      setSelectedFile(null);
      setPreviewUrl(null);
      setIsConfirmModalOpen(true); // Open modal to show clear error message
      return;
    }

    // Valid file: create object URL preview and open confirmation modal
    setFileError(null);
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setIsConfirmModalOpen(true);
  };

  const cancelSelection = () => {
    if (isUploading) return; // Disallow cancelling mid-upload
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    setIsConfirmModalOpen(false);
  };

  const confirmAndSave = async () => {
    if (!selectedFile || !currentUser || isUploading) return;

    setIsUploading(true);
    setFileError(null);

    try {
      // 1. Upload to Firebase Storage and silently update Firestore & Auth user document
      const newPhotoUrl = await uploadAndSaveProfilePicture(
        selectedFile,
        currentUser.uid,
        userProfile?.displayName
      );

      // 2. Silently update AuthContext state so the new picture is immediately visible everywhere
      await updateUserProfile({ photoURL: newPhotoUrl });

      // 3. Immediately display the new profile picture on activeUser
      setActiveUser(resolveTargetUser({ photoURL: newPhotoUrl }));

      setSuccessMessage('Profile picture updated successfully!');
      setTimeout(() => {
        setSuccessMessage(null);
      }, 4000);

      // Clean up file & close confirmation modal
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setSelectedFile(null);
      setPreviewUrl(null);
      setFileError(null);
      setIsConfirmModalOpen(false);
    } catch (err: any) {
      console.error('Error uploading profile picture:', err);
      // Keep the previous profile picture intact; show clear error message
      setFileError(err?.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      // Hide uploading state after complete operation finishes
      setIsUploading(false);
    }
  };

  const clearSuccessMessage = () => {
    setSuccessMessage(null);
  };

  return (
    <ProfilePictureContext.Provider
      value={{
        isMenuOpen,
        isViewerOpen,
        isConfirmModalOpen,
        activeUser,
        selectedFile,
        previewUrl,
        fileError,
        isUploading,
        successMessage,
        openMenu,
        closeMenu,
        openViewer,
        closeViewer,
        triggerFilePicker,
        handleFileChange,
        confirmAndSave,
        cancelSelection,
        clearSuccessMessage
      }}
    >
      {children}
      {/* Hidden file input for native device gallery and camera */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        aria-label="Upload profile picture"
        className="hidden"
        onChange={handleFileChange}
      />
    </ProfilePictureContext.Provider>
  );
};

export const useProfilePicture = () => {
  const context = useContext(ProfilePictureContext);
  if (!context) {
    throw new Error('useProfilePicture must be used within a ProfilePictureProvider');
  }
  return context;
};
