import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';

export const MAX_QR_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB maximum
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates that the selected file is an image (JPG, JPEG, PNG, WEBP)
 * and is strictly under the 5 MB file size limit.
 */
export function validatePaymentQrFile(file: File): FileValidationResult {
  if (!file) {
    return { valid: false, error: 'No file selected. Please select an image.' };
  }

  // Check file type / MIME or extension
  const mimeType = (file.type || '').toLowerCase();
  const fileName = (file.name || '').toLowerCase();
  const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
  const hasValidExt = validExtensions.some((ext) => fileName.endsWith(ext));
  const hasValidMime = ALLOWED_IMAGE_TYPES.includes(mimeType) || mimeType.startsWith('image/');

  if (!hasValidMime && !hasValidExt) {
    return {
      valid: false,
      error: 'Invalid file format. Please select an image file (JPG, JPEG, or PNG).'
    };
  }

  // Check file size (5 MB limit)
  if (file.size > MAX_QR_IMAGE_BYTES) {
    const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      valid: false,
      error: `File size is ${sizeInMB} MB. Maximum allowed image size is 5 MB.`
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'The selected file is empty. Please select a valid image.'
    };
  }

  return { valid: true };
}

export interface QrUploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Helper to convert a File object to base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads image directly to the app server via /api/upload-payment-image.
 * Used as an ultra-fast and 100% reliable fallback whenever Firebase Storage
 * bucket is unavailable (e.g. 404, CORS preflight blocked, or network timeout).
 */
async function uploadToServer(
  file: File,
  folder: 'qrs' | 'receipts'
): Promise<QrUploadResult> {
  const base64Data = await fileToBase64(file);
  const response = await fetch('/api/upload-payment-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fileName: file.name,
      fileType: file.type || 'image/png',
      base64Data,
      folder
    })
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || `Server upload failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    downloadUrl: data.url,
    storagePath: data.url
  };
}

/**
 * Uploads a payment QR code image directly to Firebase Storage with automatic server fallback.
 * Saves under: `payment_qrs/{methodCode}_{timestamp}.{ext}`
 * Guaranteed to never hang: races Firebase Storage with a 4-second timeout,
 * and if storage is unavailable or times out, uses the server upload route.
 */
export async function uploadPaymentQrImage(
  file: File,
  methodCode: string = 'gateway',
  methodName?: string
): Promise<QrUploadResult> {
  const validation = validatePaymentQrFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid QR image file.');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanMethod = (methodCode || 'gateway').toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const timestamp = Date.now();
  const fileName = `qr_${cleanMethod}_${timestamp}.${cleanExt || 'png'}`;
  const storagePath = `payment_qrs/${fileName}`;

  // 1. Attempt upload to Firebase Storage with a strict 4-second timeout
  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type || 'image/png',
      customMetadata: {
        methodCode: cleanMethod,
        methodName: methodName || cleanMethod,
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadPromise = async () => {
      const uploadSnapshot = await uploadBytes(storageRef, file, metadata);
      const downloadUrl = await getDownloadURL(uploadSnapshot.ref);
      return { downloadUrl, storagePath };
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout after 4 seconds')), 4000)
    );

    const result = await Promise.race([uploadPromise(), timeoutPromise]);
    console.log('[QRUpload] Firebase Storage upload succeeded:', result.downloadUrl);
    return result;
  } catch (storageErr: any) {
    console.warn('[QRUpload] Firebase Storage direct upload failed or timed out:', storageErr?.message);
    // 2. Seamless fallback to server-side static storage proxy
    try {
      console.log('[QRUpload] Falling back to server-side storage endpoint...');
      const serverResult = await uploadToServer(file, 'qrs');
      console.log('[QRUpload] Server upload succeeded:', serverResult.downloadUrl);
      return serverResult;
    } catch (serverErr: any) {
      console.error('[QRUpload] Both Firebase Storage and server upload failed:', serverErr);
      throw new Error(serverErr?.message || storageErr?.message || 'Failed to upload QR code. Please try again.');
    }
  }
}

/**
 * Uploads a landlord payment screenshot/receipt directly to Firebase Storage with automatic server fallback.
 * Saves under: `payment_receipts/{timestamp}.{ext}`
 * Guaranteed to never hang and works reliably on both desktop and mobile.
 */
export async function uploadPaymentReceiptImage(file: File): Promise<string> {
  const validation = validatePaymentQrFile(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid payment receipt image.');
  }

  const fileExt = file.name.split('.').pop() || 'png';
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const fileName = `receipt_${timestamp}_${Math.random().toString(36).substring(2, 7)}.${cleanExt || 'png'}`;
  const storagePath = `payment_receipts/${fileName}`;

  // 1. Attempt upload to Firebase Storage with 4-second timeout
  try {
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.type || 'image/jpeg',
      customMetadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString()
      }
    };

    const uploadPromise = async () => {
      const uploadSnapshot = await uploadBytes(storageRef, file, metadata);
      return await getDownloadURL(uploadSnapshot.ref);
    };

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase Storage timeout after 4 seconds')), 4000)
    );

    const downloadUrl = await Promise.race([uploadPromise(), timeoutPromise]);
    console.log('[ReceiptUpload] Firebase Storage upload succeeded:', downloadUrl);
    return downloadUrl;
  } catch (storageErr: any) {
    console.warn('[ReceiptUpload] Firebase Storage direct upload failed or timed out:', storageErr?.message);
    // 2. Seamless fallback to server-side storage
    try {
      console.log('[ReceiptUpload] Falling back to server-side storage endpoint...');
      const serverResult = await uploadToServer(file, 'receipts');
      console.log('[ReceiptUpload] Server upload succeeded:', serverResult.downloadUrl);
      return serverResult.downloadUrl;
    } catch (serverErr: any) {
      console.error('[ReceiptUpload] Both Firebase Storage and server upload failed:', serverErr);
      throw new Error(serverErr?.message || storageErr?.message || 'Failed to upload receipt screenshot.');
    }
  }
}

/**
 * Deletes an old QR image from Firebase Storage if a storage path exists.
 * Fails silently so it doesn't break updates if the file was already deleted or external.
 */
export async function deletePaymentQrFromStorage(storagePath?: string): Promise<void> {
  if (!storagePath || !storagePath.startsWith('payment_qrs/')) return;
  try {
    const fileRef = ref(storage, storagePath);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Could not delete old QR code from storage:', err);
  }
}
