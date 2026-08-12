
'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './use-auth';
import { db, app, FIREBASE_VAPID_KEY } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';

// Mirrors addSubscription/removeSubscription in use-auth.tsx: a direct
// client-SDK write to the user's own doc rather than a Server Action —
// firestore.rules already lets an owner update any field on their own user
// doc except role/isPremium, so there's nothing a server action would add
// here beyond an extra network hop.
export function usePushNotifications() {
  const { user } = useAuth();
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    setPermission(Notification.permission);
    // Safari/iOS PWA support for the Push API is inconsistent — isSupported()
    // is Firebase's own feature-detection covering Service Worker, Push
    // Manager, Notification and IndexedDB support together.
    isSupported().then(setSupported).catch(() => setSupported(false));
  }, []);

  const getCurrentToken = useCallback(async () => {
    const registration = await navigator.serviceWorker.ready;
    const messaging = getMessaging(app);
    return getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration });
  }, []);

  const enablePush = useCallback(async () => {
    if (!user || !supported) return false;
    setIsPending(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return false;

      const token = await getCurrentToken();
      if (!token) return false;

      await updateDoc(doc(db, 'users', user.uid), { fcmTokens: arrayUnion(token) });
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    } finally {
      setIsPending(false);
    }
  }, [user, supported, getCurrentToken]);

  const disablePush = useCallback(async () => {
    if (!user || !supported) return;
    setIsPending(true);
    try {
      const token = await getCurrentToken();
      if (token) {
        await updateDoc(doc(db, 'users', user.uid), { fcmTokens: arrayRemove(token) });
      }
    } catch (error) {
      console.error('Error disabling push notifications:', error);
    } finally {
      setIsPending(false);
    }
  }, [user, supported, getCurrentToken]);

  return { supported, permission, isPending, enablePush, disablePush };
}
