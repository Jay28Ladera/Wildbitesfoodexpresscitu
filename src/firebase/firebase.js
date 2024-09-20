// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

export const auth = getAuth();
export const db = getFirestore(app);
export default app;