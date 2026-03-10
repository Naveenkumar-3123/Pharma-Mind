import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyC2ZBanYtbnXbz0XNJdVxYyLs-uNgC1Fvc",
    authDomain: "vit-glitch.firebaseapp.com",
    projectId: "vit-glitch",
    storageBucket: "vit-glitch.firebasestorage.app",
    messagingSenderId: "335272740121",
    appId: "1:335272740121:web:67388d111acdad72633188",
    measurementId: "G-NK7Y7HDGM5"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
