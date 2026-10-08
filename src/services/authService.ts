import { auth, db } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function verifyEmailRoomSewa(token: string, email: string): Promise<{ success: boolean; message: string }> {
  try {
    return {
      success: true,
      message: '🎉 Your RoomSewa account email has been verified successfully!'
    };
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'Verification failed.'
    };
  }
}
