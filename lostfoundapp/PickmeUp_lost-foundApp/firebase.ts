import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDBeB1AQ4tE24Dn9JioM7uHaY86ywfQGpg",
  authDomain: "moneyapp-a4d5e.firebaseapp.com",
  projectId: "moneyapp-a4d5e",
  storageBucket: "moneyapp-a4d5e.firebasestorage.app",
  messagingSenderId: "747411315613",
  appId: "1:747411315613:web:d6a6ea450691cadd982d74",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

