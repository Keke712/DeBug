import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCujwfjTivIcp2_Mz5dy0rrQodQe2WnUN4",
    authDomain: "debug-c8f82.firebaseapp.com",
    projectId: "debug-c8f82",
    storageBucket: "debug-c8f82.firebasestorage.app",
    messagingSenderId: "968689653125",
    appId: "1:968689653125:web:4f9a47a75f77b34a5860ec",
    measurementId: "G-9TQ76K3CHH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const githubProvider = new GithubAuthProvider();
export const db = getFirestore(app);