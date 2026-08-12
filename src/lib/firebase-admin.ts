
import * as admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { cookies } from 'next/headers';

// Server Actions in actions.ts run in Node, not the browser, so the Firebase
// *client* SDK there never carries the signed-in user's session — there's no
// mechanism that transports it from the browser to a Server Action. Under the
// old wide-open "test mode" Firestore rules that didn't matter; under real
// rules those writes were silently unauthenticated and got rejected outright.
// This module verifies who's actually calling via a session cookie (set at
// sign-in, see session-actions.ts) and gives actions.ts a privileged,
// rules-bypassing Firestore handle to write with, so authorization is
// enforced here in code instead — mirroring firestore.rules' logic exactly.

// storageBucket is passed explicitly because admin.initializeApp() with no
// options only auto-detects it on Firebase-managed infra (App Hosting/Cloud
// Functions via FIREBASE_CONFIG) — local dev via a service account JSON
// wouldn't otherwise know which bucket getAdminStorage().bucket() means.
// Matches the client SDK's config in src/lib/firebase.ts.
function getAdminApp() {
  return admin.apps.length && admin.apps[0]
    ? admin.apps[0]
    : admin.initializeApp({ storageBucket: 'oltindeapp.firebasestorage.app' });
}

let _adminDb: Firestore | undefined;
export function getAdminDb(): Firestore {
  if (!_adminDb) _adminDb = getFirestore(getAdminApp());
  return _adminDb;
}

let _adminAuth: Auth | undefined;
export function getAdminAuth(): Auth {
  if (!_adminAuth) _adminAuth = getAuth(getAdminApp());
  return _adminAuth;
}

let _adminStorage: Storage | undefined;
export function getAdminStorage(): Storage {
  if (!_adminStorage) _adminStorage = getStorage(getAdminApp());
  return _adminStorage;
}

let _adminMessaging: Messaging | undefined;
export function getAdminMessaging(): Messaging {
  if (!_adminMessaging) _adminMessaging = getMessaging(getAdminApp());
  return _adminMessaging;
}

export const SESSION_COOKIE_NAME = 'oltinde_session';
export const SESSION_MAX_AGE_MS = 14 * 24 * 60 * 60 * 1000; // Firebase's max session cookie duration

export type CallerRole = 'admin' | 'manager' | 'editor' | 'pharmacist' | 'user';
export type Caller = { uid: string; role: CallerRole };

// Verifies the current request's Firebase session cookie and looks up the
// caller's role. Returns null if there's no session, it's invalid/expired, or
// verification fails for any reason — callers must treat that as "anonymous."
export async function getCurrentCaller(): Promise<Caller | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const userSnap = await getAdminDb().collection('users').doc(decoded.uid).get();
    const role = (userSnap.exists ? (userSnap.data()?.role as CallerRole) : null) || 'user';
    return { uid: decoded.uid, role };
  } catch {
    return null;
  }
}

export function isManagerRole(role: CallerRole | null | undefined): boolean {
  return role === 'admin' || role === 'manager';
}
export function isEditorRole(role: CallerRole | null | undefined): boolean {
  return role === 'admin' || role === 'manager' || role === 'editor';
}
export function isPharmacistRole(role: CallerRole | null | undefined): boolean {
  return role === 'admin' || role === 'manager' || role === 'pharmacist';
}
export function isAdminRole(role: CallerRole | null | undefined): boolean {
  return role === 'admin';
}
