// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// DELETE the line that says "import ... from 'firebase/analytics'"

// --- PASTE YOUR CONFIG HERE ---
const firebaseConfig = {
    apiKey: "AIzaSyA68Pe2sk5ydxamENxJYcaz2KBM8M-EXbQ",
    authDomain: "placemate-ai.firebaseapp.com",
    projectId: "placemate-ai",
    storageBucket: "placemate-ai.firebasestorage.app",
    messagingSenderId: "377335926674",
    appId: "1:377335926674:web:a94ad5fb779b4763cefb4b"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export tools
export const auth = getAuth(app);
export const db = getFirestore(app);
// DELETE the line that says "const analytics = ..."