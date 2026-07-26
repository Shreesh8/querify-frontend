import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBEXbKfhSk58Z4jpXio9CMjEnJj6JjKEgg",
  authDomain: "querify-7120a.firebaseapp.com",
  projectId: "querify-7120a",
  storageBucket: "querify-7120a.firebasestorage.app",
  messagingSenderId: "417456665007",
  appId: "1:417456665007:web:dabb1dba92fa5d638ebf5a",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ── Auth helpers ──────────────────────────────────────────────
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

export const signInWithEmail = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const signUpWithEmail = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logOut = () => signOut(auth);

export const getCurrentToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

export type { User };
