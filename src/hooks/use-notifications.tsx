'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getMyNotifications, markAllMyNotificationsRead } from '@/lib/account-actions';
import type { Notification } from '@/lib/types';

// There is no realtime listener on MySQL (Firestore's onSnapshot used to push
// changes), so the list is re-fetched periodically and whenever the tab
// regains focus — cheap, and new notifications still show up within seconds
// of the user looking at the page. Push notifications cover the rest.
const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setNotifications(await getMyNotifications());
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    refresh();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, POLL_INTERVAL_MS);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user, refresh]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;
    try {
      await markAllMyNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }, [user, unreadCount]);

  return { notifications, isLoading, unreadCount, markAllAsRead };
}
