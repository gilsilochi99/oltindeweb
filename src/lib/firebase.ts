
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCJ-6MG9JGaq_naYeif4k4q3LI9gLcpLow",
    authDomain: "oltindeapp.firebaseapp.com",
    projectId: "oltindeapp",
    storageBucket: "oltindeapp.firebasestorage.app",
    messagingSenderId: "474863252478",
    appId: "1:474863252478:web:4835b6e30d8fee245586af",
    measurementId: "G-9M62KTSMTM"
  };

// Web Push "public" VAPID key from Project Settings > Cloud Messaging > Web
// Push certificates — not a secret (it's sent to the browser as part of every
// push subscription request), so it's hardcoded here alongside the rest of
// firebaseConfig rather than threaded through env vars.
export const FIREBASE_VAPID_KEY = "BLkJ7ipRH1beraYhMgjhelnykxeZhiwsSQ0qvCrFJZBQKU7UEFI5b4qmy5wC-NsBu2rnIl_df7U9Ets_lHLacUc";

// Initialize Firebase for SSR
let app: FirebaseApp;
if (!getApps().length) {
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

// Only Auth is used in the browser (data lives in MySQL, files on our own
// hosting). Firestore/Storage were dropped from here so their SDKs (~100 KB
// compressed) aren't downloaded on every page.
let auth: Auth;

function getAuthInstance() {
    if (!auth) {
        auth = getAuth(app);
        auth.languageCode = 'es'; // Set email language to Spanish
    }
    return auth;
}



const authInstance = getAuthInstance();


export { app, authInstance as auth, getAuthInstance };
