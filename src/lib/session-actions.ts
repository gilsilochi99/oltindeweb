
'use server';

import { cookies } from 'next/headers';
import { getAdminAuth, SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from './firebase-admin';

// Called from the client right after Firebase sign-in (and on every app load
// while already signed in) so Server Actions in actions.ts — which run in
// Node and never see the browser's Firebase Auth session directly — have a
// way to know who's calling. See firebase-admin.ts for why this exists.
export async function establishSession(idToken: string): Promise<{ success: boolean }> {
  try {
    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, { expiresIn: SESSION_MAX_AGE_MS });
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      maxAge: SESSION_MAX_AGE_MS / 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return { success: true };
  } catch (error) {
    console.error('Error establishing session cookie:', error);
    return { success: false };
  }
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
