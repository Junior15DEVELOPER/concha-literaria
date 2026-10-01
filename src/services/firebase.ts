import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Default / environment Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemoConchaLiterariaKeyForOfflineFirst2026",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "concha-literaria.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "concha-literaria",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "concha-literaria.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1029384756",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1029384756:web:abcdef123456"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enable offline persistence when supported
if (typeof window !== 'undefined') {
  try {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.info('Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.info('Current browser does not support offline persistence');
      }
    });
  } catch {
    // Ignore in non-supported environments
  }
}

export default app;
