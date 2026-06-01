import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1) Create a Firebase project at https://console.firebase.google.com
// 2) Add a Web App and paste your config below.
// 3) Enable Firestore Database and Google Authentication.
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'PASTE_API_KEY_HERE',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'PASTE_AUTH_DOMAIN_HERE',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'PASTE_PROJECT_ID_HERE',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'PASTE_STORAGE_BUCKET_HERE',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 'PASTE_MESSAGING_SENDER_ID_HERE',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'PASTE_APP_ID_HERE'
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
