// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
  // Basic sanity check (keys here are public anyway in a web app)
  const missing = Object.entries(firebaseConfig).filter(([_, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.warn('[FirebaseConfig] Missing env vars:', missing.join(', '));
  }
  console.log('[FirebaseConfig] projectId:', firebaseConfig.projectId, 'storageBucket:', firebaseConfig.storageBucket);
}
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
export const storage = getStorage(app);




