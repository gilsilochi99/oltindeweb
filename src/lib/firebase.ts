
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
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
        db = getFirestore(app);
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
