import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyBf1qwt53_dTlYZCGsZZAyjt6n1VROSV1E",
  authDomain: "ytbchimera-519ea.firebaseapp.com",
  projectId: "ytbchimera-519ea",
  storageBucket: "ytbchimera-519ea.appspot.com",
  messagingSenderId: "109985800869",
  appId: "1:109985800869:web:963ce2072d241e4cfaa34c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

export { app, auth, db };
