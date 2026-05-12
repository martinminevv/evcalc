import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBeBWx4kC2FlG7sQ1xXI8rSa8HbMCIzcPs",
  authDomain: "evcalc-b71e4.firebaseapp.com",
  projectId: "evcalc-b71e4",
  storageBucket: "evcalc-b71e4.firebasestorage.app",
  messagingSenderId: "425224994431",
  appId: "1:425224994431:web:d90cccf96ea60b0d2f894a",
  measurementId: "G-17EJ3XY3RP"
};

export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);