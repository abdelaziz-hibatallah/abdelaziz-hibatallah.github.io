// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA0E4YmwONbnFdVUGErQjjqO2onIUkfGI8",
  authDomain: "the-ego-taxtech.firebaseapp.com",
  projectId: "the-ego-taxtech",
  storageBucket: "the-ego-taxtech.firebasestorage.app",
  messagingSenderId: "42792102209",
  appId: "1:42792102209:web:e27de237be4c9eca5399c0",
  measurementId: "G-K3B75Z3CNX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
