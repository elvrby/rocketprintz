// firebase/config.ts

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBW0KHrko1QM6CzIAkdLOiYVAcHuHtV7L0",
  authDomain: "rocketprintz.firebaseapp.com",
  projectId: "rocketprintz",
  storageBucket: "rocketprintz.firebasestorage.app",
  messagingSenderId: "751814859054",
  appId: "1:751814859054:web:234904c34cbe415599c2bf",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);