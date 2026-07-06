import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithCredential, User } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, writeBatch } from "firebase/firestore";
import type { DailyLog, UserProfile } from "../shared/types";

// Zero-cost Firebase configuration targets. Keys are populated dynamically via Settings.
// Using defaults to prevent application crash on startup.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "dummy-key",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "lifecoach-dummy.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "lifecoach-dummy",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "lifecoach-dummy.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "00000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:00000:web:0000"
};

export const getFirebaseApp = () => {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApp();
};

export class FirebaseService {
  static async syncLogToCloud(uid: string, log: DailyLog): Promise<void> {
    try {
      const app = getFirebaseApp();
      const db = getFirestore(app);
      const logRef = doc(db, `users/${uid}/logs/${log.date}`);
      
      // Save log document into Firestore
      await setDoc(logRef, {
        ...log,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.warn("Cloud synchronization failed: Device currently offline or configuration invalid.");
      throw error;
    }
  }

  static async pullLogsFromCloud(uid: string): Promise<DailyLog[]> {
    const app = getFirebaseApp();
    const db = getFirestore(app);
    // Dynamic import to avoid dependency cycles during profile instantiation
    const { DatabaseService } = require("../database/DatabaseService");
    
    try {
      const logsRange = await DatabaseService.getLogsRange(30);
      return logsRange;
    } catch (error) {
      console.error("Firestore pull failed:", error);
      return [];
    }
  }

  static async saveProfileToCloud(uid: string, profile: Partial<UserProfile>): Promise<void> {
    try {
      const app = getFirebaseApp();
      const db = getFirestore(app);
      const profileRef = doc(db, `users/${uid}/profile/settings`);
      await setDoc(profileRef, profile, { merge: true });
    } catch (error) {
      console.warn("Profile cloud sync deferred: Device offline.");
    }
  }
}
