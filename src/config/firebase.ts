// src/config/firebase.ts
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyBnZkSH2oc5hVg6XbGLVbgfFPOgX31-XzY",
  authDomain: "isaraya-store.firebaseapp.com",
  projectId: "isaraya-store",
  storageBucket: "isaraya-store.firebasestorage.app",
  messagingSenderId: "712061028669",
  appId: "1:712061028669:web:a370e7041e477f607e1d54",
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);
