// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAVlaAeXp5NSp-jW0vusg_bLYHZnv59KmA",
  authDomain: "wildbitesfoodexpress-citu.firebaseapp.com",
  projectId: "wildbitesfoodexpress-citu",
  storageBucket: "wildbitesfoodexpress-citu.appspot.com",
  messagingSenderId: "36838899652",
  appId: "1:36838899652:web:80a5092f26a113bf332e91",
  measurementId: "G-MDRVLZMF15"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication, Firestore, and Storage
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // Export Firebase storage

// Export the app instance as default
export default app;
