
// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  projectId: "guineabiz",
  appId: "1:390721227935:web:fc3f7dd7b52489a15ca6aa",
  storageBucket: "guineabiz.appspot.com",
  apiKey: "AIzaSyAl6XSALJo9cLfT322MrnkFOXbKDD2jzgg",
  authDomain: "guineabiz.firebaseapp.com",
  messagingSenderId: "390721227935",
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
