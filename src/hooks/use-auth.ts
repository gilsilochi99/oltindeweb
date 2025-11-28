
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import type { AppUser } from '@/lib/types';

interface AuthState {
  user: AppUser | null;
  loading: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        const tokenResult = await firebaseUser.getIdTokenResult();
        const claims = tokenResult.claims;

        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data() as Omit<AppUser, 'id' | 'role'>;
          setUser({
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || userData.displayName || 'No name',
            email: firebaseUser.email || '',
            ...userData,
            role: claims.admin ? 'admin' : claims.manager ? 'manager' : claims.editor ? 'editor' : 'user',
          });
        } else {
          // Handle case where user exists in Auth but not in Firestore
          setUser({
            id: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'No name',
            email: firebaseUser.email || '',
            role: claims.admin ? 'admin' : claims.manager ? 'manager' : claims.editor ? 'editor' : 'user',
            favorites: { companies: [], procedures: [], institutions: [] },
            subscriptions: { companies: [], categories: [] },
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading };
}
