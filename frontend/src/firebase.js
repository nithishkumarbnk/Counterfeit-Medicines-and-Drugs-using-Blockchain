// frontend/src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD-2ZsnwpDpLPDUzx9iaAyt7-B4AlUY73A",
  authDomain: "counterfiet-130f7.firebaseapp.com",
  projectId: "counterfiet-130f7",
  storageBucket: "counterfiet-130f7.firebasestorage.app",
  messagingSenderId: "87557682357",
  appId: "1:87557682357:web:293dcbc40dcf91895efafc",
  measurementId: "G-K5BJYL4FND",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore

export { auth, db };
