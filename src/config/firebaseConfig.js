// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth"; 
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

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
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);