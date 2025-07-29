import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCGfO3tHnv9EXv-pEQRzn3mVw2o3Gkm7-A",
  authDomain: "rwsa-fee-tracker.firebaseapp.com",
  projectId: "rwsa-fee-tracker",
  storageBucket: "rwsa-fee-tracker.firebasestorage.app",
  messagingSenderId: "1026724723870",
  appId: "1:1026724723870:web:fb13361c54ef8f9be60f8f",
  measurementId: "G-V5E5LRFEF5"
};

// Initialize Firebase
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };