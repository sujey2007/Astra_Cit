// Import the functions you need from the SDKs
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore"; // For Asset & Labor Logs
import { getAuth } from "firebase/auth";           // For Officer Login
import { getStorage } from "firebase/storage";     // For Invoice OCR Scanning

const firebaseConfig = {
  apiKey: "AIzaSyB1iorJLLUZ6qm8ykCbnviuIhQqsyE6FVw",
  authDomain: "astra-cit.firebaseapp.com",
  databaseURL: "https://astra-cit-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "astra-cit",
  storageBucket: "astra-cit.firebasestorage.app",
  messagingSenderId: "400585780584",
  appId: "1:400585780584:web:0b14e6998f88581c423add",
  measurementId: "G-9F27Y7SL1S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export the specific services AstraCIT needs
export const db = getFirestore(app);   // Database for 10,000+ assets [cite: 64]
export const auth = getAuth(app);       // Secure Role-Based login
export const storage = getStorage(app); // Storage for scanned physical bills [cite: 21]