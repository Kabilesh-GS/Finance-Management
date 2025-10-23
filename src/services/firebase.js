import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const Firebase_key = process.env.REACT_APP_FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: Firebase_key,
  authDomain: "finance-management-b5703.firebaseapp.com",
  projectId: "finance-management-b5703",
  storageBucket: "finance-management-b5703.firebasestorage.app",
  messagingSenderId: "775673232215",
  appId: "1:775673232215:web:eba527ce6b11a4d8c15c12",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
