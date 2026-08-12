
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

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

let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

function getDb() {
    if (!db) {
        // IndexedDB only exists in the browser: data.ts server actions and SSR
        // run this same module in Node, where persistentLocalCache would throw.
        if (typeof window !== 'undefined') {
            try {
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({
                        tabManager: persistentMultipleTabManager(),
                    }),
                });
            } catch {
                // Firestore was already initialized for this app (e.g. dev Fast Refresh
                // re-running this module) — fall back to the existing instance.
                db = getFirestore(app);
            }
        } else {
            db = getFirestore(app);
        }
    }
    return db;
}

function getAuthInstance() {
    if (!auth) {
        auth = getAuth(app);
        auth.languageCode = 'es'; // Set email language to Spanish
    }
    return auth;
}

function getStorageInstance() {
    if (!storage) {
        storage = getStorage(app);
    }
    return storage;
}


const dbInstance = getDb();
const authInstance = getAuthInstance();
const storageInstance = getStorageInstance();


export { app, dbInstance as db, authInstance as auth, storageInstance as storage, getDb, getAuthInstance, getStorageInstance };
