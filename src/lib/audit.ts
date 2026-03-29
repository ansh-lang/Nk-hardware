import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export const logAction = async (action: string, details: string = '') => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Simple way to get some device info
    const device = `${navigator.platform} - ${navigator.userAgent.slice(0, 50)}...`;
    
    // IP is hard to get client-side without external service, 
    // but we can try to get it from an API if needed.
    // For now, we'll just log that an action occurred.
    
    await addDoc(collection(db, 'audit_logs'), {
      userId: user.uid,
      userEmail: user.email,
      action,
      details,
      device,
      createdAt: serverTimestamp(),
      // We could add IP here if we had a reliable client-side way or a cloud function
    });
  } catch (error) {
    console.error("Failed to log action:", error);
  }
};
