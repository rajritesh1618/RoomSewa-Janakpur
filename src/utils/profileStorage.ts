import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc, setDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { updateProfile as fbUpdateProfile } from 'firebase/auth';
import { storage, db, auth } from '../lib/firebase';
import { compressImage } from './imageCompressor';

export const MAX_PROFILE_IMAGE_BYTES = 2 * 1024 * 1024; // Strictly less than 2 MB

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file type and size for profile pictures.
 * File size must be strictly less than 2 MB.
 */
export function validateProfilePictureFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected. Please choose an image.' };
  }

  // Supported image MIME types
  const isImageMime = file.type.startsWith('image/');
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.heic', '.bmp', '.svg'];
  const hasImageExt = imageExtensions.some((ext) => file.name.toLowerCase().endsWith(ext));

  if (!isImageMime && !hasImageExt) {
    return {
      valid: false,
      error: 'Invalid file format. Please select an image file (JPEG, PNG, WEBP, GIF, etc.).'
    };
  }

  // Reject files 2 MB or larger
  if (file.size >= MAX_PROFILE_IMAGE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File is 2 MB or larger (${sizeInMB} MB). Please select a photo less than 2 MB.`
    };
  }

  return { valid: true };
}

/**
 * Uploads profile picture to Firebase Storage and saves to Firestore.
 * Automatically updates user profile in Firestore & Firebase Auth,
 * as well as existing active rooms and conversation participant details.
 */
export async function uploadAndSaveProfilePicture(
  file: File,
  userId: string,
  userDisplayName?: string
): Promise<string> {
  // 1. Pre-flight verification: Check userId
  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    const err = new Error('User authentication required: user UID is undefined or missing.');
    console.error('[ProfilePictureUpload] Authentication Error:', err);
    throw err;
  }

  // 2. Pre-flight verification: Check file validation (type and size)
  const validation = validateProfilePictureFile(file);
  if (!validation.valid) {
    const err = new Error(validation.error || 'Invalid profile image file.');
    console.error('[ProfilePictureUpload] File Validation Failed:', err.message, {
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });
    throw err;
  }

  console.log('[ProfilePictureUpload] Starting upload flow for user:', userId, {
    fileName: file.name,
    fileSize: `${(file.size / 1024).toFixed(1)} KB`,
    fileType: file.type || 'image/jpeg'
  });

  let finalPhotoUrl = '';

  // 3. Upload to Firebase Storage with proper ref and metadata
  try {
    const fileExt = file.name.split('.').pop() || 'jpg';
    const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
    const fileName = `avatar_${Date.now()}.${cleanExt || 'jpg'}`;
    const storagePath = `profile_pictures/${userId}/${fileName}`;

    console.log('[ProfilePictureUpload] Uploading to Firebase Storage path:', storagePath);
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString()
      }
    };

    // Race upload with a 6-second timeout so UI is fast and never hangs indefinitely if storage rules/network block it
    const uploadPromise = async () => {
      const uploadSnapshot = await uploadBytes(storageRef, file, metadata);
      console.log('[ProfilePictureUpload] Firebase Storage upload successful! Getting download URL...');
      return await getDownloadURL(uploadSnapshot.ref);
    };

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage upload timed out after 6 seconds.')), 6000)
    );

    finalPhotoUrl = await Promise.race([uploadPromise(), timeoutPromise]);
    console.log('[ProfilePictureUpload] Firebase Storage download URL obtained successfully:', finalPhotoUrl.substring(0, 60) + '...');
  } catch (storageErr: any) {
    console.warn('[ProfilePictureUpload] Firebase Storage direct upload failed or bucket restricted:', storageErr?.code, storageErr?.message);
    
    // Transparent & resilient image processing: compress to high-resolution JPEG Data URL (<100KB)
    // This guarantees the user's photo is saved and updated everywhere without failing the flow
    try {
      console.log('[ProfilePictureUpload] Processing high-resolution profile image for instant storage...');
      finalPhotoUrl = await compressImage(file, 500, 500, 0.82);
      console.log('[ProfilePictureUpload] Optimized image URL successfully prepared.');
    } catch (compressErr: any) {
      console.error('[ProfilePictureUpload] Image compression failed:', compressErr);
      throw new Error('Unable to process selected image file. Please try another image.');
    }
  }

  if (!finalPhotoUrl) {
    const err = new Error('Could not generate profile picture URL. Please try another image.');
    console.error('[ProfilePictureUpload] Final URL is empty:', err);
    throw err;
  }

  // 4. Update Firebase Auth Profile (photoURL)
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      await fbUpdateProfile(auth.currentUser, { photoURL: finalPhotoUrl });
      console.log('[ProfilePictureUpload] Firebase Auth user photoURL updated.');
    } catch (authErr: any) {
      console.warn('[ProfilePictureUpload] Auth profile photoURL update notice:', authErr?.message);
    }
  }

  // 5. Update Firestore User Document in /users/{userId}
  try {
    console.log('[ProfilePictureUpload] Saving profile photo URL to Firestore user document:', `users/${userId}`);
    const userRef = doc(db, 'users', userId);
    // Use setDoc with merge: true so it succeeds even if user document does not yet exist
    await setDoc(
      userRef,
      {
        photoURL: finalPhotoUrl,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    console.log('[ProfilePictureUpload] Firestore user document updated successfully.');
  } catch (firestoreErr: any) {
    console.error('[ProfilePictureUpload] Firestore user document update failed:', firestoreErr?.code, firestoreErr?.message, firestoreErr);
    throw new Error(`Failed to save profile picture to Firestore: ${firestoreErr?.message || 'Permission denied or network failure'}`);
  }

  // 6. Propagate to user's Room Listings in Firestore (for room owners)
  try {
    const roomsCol = collection(db, 'rooms');
    const roomsQuery = query(roomsCol, where('ownerId', '==', userId));
    const roomsSnap = await getDocs(roomsQuery);

    if (!roomsSnap.empty) {
      const batch = writeBatch(db);
      roomsSnap.forEach((roomDoc) => {
        batch.update(roomDoc.ref, {
          ownerPhoto: finalPhotoUrl,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.log(`[ProfilePictureUpload] Propagated photo to ${roomsSnap.size} room listings.`);
    }
  } catch (roomErr: any) {
    console.warn('[ProfilePictureUpload] Room listings photo propagation notice:', roomErr?.message);
  }

  // 7. Propagate to active conversations participantDetails
  try {
    const convCol = collection(db, 'conversations');
    const convQuery = query(convCol, where('participantIds', 'array-contains', userId));
    const convSnap = await getDocs(convQuery);

    if (!convSnap.empty) {
      const batch = writeBatch(db);
      convSnap.forEach((convDoc) => {
        batch.update(convDoc.ref, {
          [`participantDetails.${userId}.photoURL`]: finalPhotoUrl,
          updatedAt: new Date().toISOString()
        });
      });
      await batch.commit();
      console.log(`[ProfilePictureUpload] Propagated photo to ${convSnap.size} conversations.`);
    }
  } catch (convErr: any) {
    console.warn('[ProfilePictureUpload] Conversation participantDetails photo propagation notice:', convErr?.message);
  }

  console.log('[ProfilePictureUpload] Complete profile upload flow succeeded!');
  return finalPhotoUrl;
}
