// استيراد مكتبات Firebase
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSy...", // ستحصل عليه من إعدادات مشروعك
  authDomain: "the-ego-tax.firebaseapp.com",
  projectId: "the-ego-tax",
  storageBucket: "the-ego-tax.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};

// تشغيل Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
