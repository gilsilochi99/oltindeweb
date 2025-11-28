
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from './use-auth';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, writeBatch, doc, getDocs } from 'firebase/firestore';
import type { Notification } from '@/lib/types';

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', user.uid)
      // Removed orderBy from here to prevent index error. Sorting will be done on the client.
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Notification));
      
      // Sort notifications by date on the client side
      userNotifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setNotifications(userNotifications);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching notifications:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter(n => !n.isRead).length;
  
  const markAllAsRead = useCallback(async () => {
    if (!user || unreadCount === 0) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
        notificationsRef, 
        where('userId', '==', user.uid),
        where('isRead', '==', false)
    );

    try {
        const unreadSnapshot = await getDocs(q);
        if (unreadSnapshot.empty) return;

        const batch = writeBatch(db);
        unreadSnapshot.docs.forEach(docSnapshot => {
            batch.update(doc(db, 'notifications', docSnapshot.id), { isRead: true });
        });
        await batch.commit();

    } catch (error) {
        console.error("Error marking notifications as read:", error);
    }
  }, [user, unreadCount]);

  return { notifications, isLoading, unreadCount, markAllAsRead };
}
