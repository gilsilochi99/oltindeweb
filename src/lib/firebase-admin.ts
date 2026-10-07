
import * as admin from 'firebase-admin';
import { getAuth, type Auth, type DecodedIdToken } from 'firebase-admin/auth';
import { getStorage, type Storage } from 'firebase-admin/storage';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { cookies, headers } from 'next/headers';
import { prisma } from './db';

// Server Actions run in Node, not the browser, so they never see the Firebase
// Auth session directly. This module verifies who's calling via a session
// cookie (set at sign-in, see session-actions.ts) and looks up their role in
// MySQL; every action enforces its own authorization from that. Firebase is
// still used here for Auth, Storage and Cloud Messaging — not for data.

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

// The verified Firebase claims (uid, email, email_verified, name, picture)
// of whoever is calling, or null if anonymous/invalid/expired. Two ways in:
// - the web app: the session cookie set at sign-in (see session-actions.ts);
// - the mobile app: an `Authorization: Bearer <Firebase ID token>` header on
//   its /api/mobile/* requests (it has no cookie session).
// Revocation is checked on both, so a deactivated (disabled) account is
// rejected immediately. Never trust identity values sent in a request body.
export async function getSessionClaims(): Promise<DecodedIdToken | null> {
  try {
    const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    if (sessionCookie) return await getAdminAuth().verifySessionCookie(sessionCookie, true);

    const authorization = (await headers()).get('authorization');
    const idToken = authorization?.match(/^Bearer (.+)$/)?.[1];
    if (idToken) return await getAdminAuth().verifyIdToken(idToken, true);
  } catch {
    // invalid/expired/revoked → anonymous
  }
  return null;
}

// The caller's uid plus their role from MySQL, or null — callers must treat
// null as "anonymous."
export async function getCurrentCaller(): Promise<Caller | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const user = await prisma.user.findUnique({ where: { id: claims.uid }, select: { role: true } });
  const role: CallerRole = user?.role ?? 'user';
  return { uid: claims.uid, role };
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
