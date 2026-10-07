// Same Firebase project as the MotoLog iOS app. These web config values are public by design;
// access is protected by Firestore security rules (owner-only) and Firebase Auth.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const app = initializeApp({
  apiKey: "AIzaSyBBDFaoSQaQi78w5hVM-jRVtpKpDSQUW9k",
  authDomain: "motolog-e34b1.firebaseapp.com",
  projectId: "motolog-e34b1",
  storageBucket: "motolog-e34b1.firebasestorage.app",
  messagingSenderId: "862460839200",
  appId: "1:862460839200:web:9142d03d6a861a081fc345",
});

export const auth = getAuth(app);
export const db = getFirestore(app);
