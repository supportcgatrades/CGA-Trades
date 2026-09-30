import { collection, doc, getDoc, getDocs, query, setDoc, where, serverTimestamp, updateDoc, addDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface DeviceInfo {
  id: string;
  userAgent: string;
  platform: string;
  lastLogin: any;
  ip?: string;
  isTrusted: boolean;
}

export const getDeviceFingerprint = () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const txt = 'TavariWaveNetworkSecurity';
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125,1,62,20);
    ctx.fillStyle = "#069";
    ctx.fillText(txt, 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText(txt, 4, 17);
  }
  const result = canvas.toDataURL();
  
  // Simple hashing for the fingerprint
  let hash = 0;
  for (let i = 0; i < result.length; i++) {
    const char = result.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return btoa(hash.toString() + navigator.userAgent + navigator.platform).substring(0, 32);
};

export const logAudit = async (userId: string, action: string, metadata: any = {}) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      user_id: userId,
      action,
      metadata,
      timestamp: serverTimestamp(),
      ip: 'detected-on-client',
      userAgent: navigator.userAgent,
      deviceId: getDeviceFingerprint()
    });
  } catch (err) {
    console.warn("Audit logging failed:", err);
  }
};

export const checkDeviceStatus = async (userId: string, deviceId: string) => {
  const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
  const snap = await getDoc(deviceRef);
  
  if (snap.exists()) {
    return snap.data() as DeviceInfo;
  }
  return null;
};

export const registerDevice = async (userId: string, deviceId: string) => {
  const deviceRef = doc(db, 'users', userId, 'devices', deviceId);
  await setDoc(deviceRef, {
    id: deviceId,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    lastLogin: serverTimestamp(),
    isTrusted: true,
    firstSeen: serverTimestamp()
  }, { merge: true });
};

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const sendOTP = async (email: string, otp: string) => {
  // In a real app, this would call a cloud function or backend API
  // to send an actual email via SendGrid, etc.
  // For this environment, we log it and potentially store it for verification.
  console.log(`[SECURITY ENFORCEMENT] Sending OTP ${otp} to ${email}`);
  
  // Store OTP in Firestore with expiration
  const otpRef = doc(collection(db, 'verification_codes'));
  await setDoc(otpRef, {
    email,
    code: otp,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
    used: false,
    created_at: serverTimestamp()
  });
  
  return true;
};

export const verifyOTP = async (email: string, code: string) => {
  const q = query(
    collection(db, 'verification_codes'),
    where('email', '==', email),
    where('code', '==', code),
    where('used', '==', false)
  );
  
  const snap = await getDocs(q);
  if (snap.empty) return false;
  
  const otpDoc = snap.docs[0];
  const data = otpDoc.data();
  
  if (data.expiresAt.toDate() < new Date()) {
    return false;
  }
  
  // Mark as used
  await updateDoc(otpDoc.ref, { used: true });
  return true;
};
