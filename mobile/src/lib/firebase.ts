// Firebase JS SDK (not @react-native-firebase) so this app runs in plain
// Expo Go — no custom dev client / EAS build needed for day-to-day
// development. We'll swap back to @react-native-firebase (see git history)
// in Phase 2, specifically for real native push tokens compatible with the
// web app's existing FCM sending code (src/lib/notifications.tsx) — that's
// the one thing this SDK can't do from inside Expo Go.
//
// Firebase is used here for sign-in only: all data and file uploads go
// through the web app (see ./api.ts), which stores them in MySQL and on its
// own hosting.
import { initializeApp, getApps, getApp } from 'firebase/app';
import * as FirebaseAuth from 'firebase/auth';
import { getAuth, initializeAuth, type Auth, type Persistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Same "oltindeapp" project + config as the web app's src/lib/firebase.ts —
// not a secret, same trust level as any client-side Firebase config.
const firebaseConfig = {
  apiKey: 'AIzaSyCJ-6MG9JGaq_naYeif4k4q3LI9gLcpLow',
  authDomain: 'oltindeapp.firebaseapp.com',
  projectId: 'oltindeapp',
  storageBucket: 'oltindeapp.firebasestorage.app',
  messagingSenderId: '474863252478',
  appId: '1:474863252478:web:4835b6e30d8fee245586af',
  measurementId: 'G-9M62KTSMTM',
};

export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Sign-in is kept between app launches (AsyncStorage). Metro loads the
// React Native build of firebase/auth, which has getReactNativePersistence;
// the TypeScript types are the browser ones, hence the lookup by name.
function createAuth(): Auth {
  const getRNPersistence = (FirebaseAuth as unknown as { getReactNativePersistence?: (storage: unknown) => Persistence })
    .getReactNativePersistence;
  if (!getRNPersistence) return getAuth(app);
  try {
    return initializeAuth(app, { persistence: getRNPersistence(AsyncStorage) });
  } catch {
    return getAuth(app); // already initialized (fast refresh)
  }
}

export const auth = createAuth();
