import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore } from "firebase/firestore"; 
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBzmxmQQB8ceuetD9guTQymxynIeH4kVBk",
  authDomain: "missing-pets-b175e.firebaseapp.com",
  projectId: "missing-pets-b175e",
  storageBucket: "missing-pets-b175e.firebasestorage.app",
  messagingSenderId: "147097427293",
  appId: "1:147097427293:web:d19a5027add382fad79cb4",
  measurementId: "G-MDYJG0D1Y5"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch (error) {
  auth = getAuth(app); 
}

let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
  });
} catch (error) {
  db = getFirestore(app);
}

export { db, auth };