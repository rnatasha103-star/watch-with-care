import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// 1) Create a Firebase project at https://console.firebase.google.com
// 2) Add a Web App and paste your config below.
// 3) Enable Firestore Database and Google Authentication.
export const firebaseConfig = {
  apiKey: "AIzaSyAInOrW-BvfhikeObjCVxJPwmvwRiXXwFs",
  authDomain: "watch-with-care.firebaseapp.com",
  projectId: "watch-with-care",
  storageBucket: "watch-with-care.firebasestorage.app",
  messagingSenderId: "562542656127",
  appId: "1:562542656127:web:9cca4e1189baabe320dd4a"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);
