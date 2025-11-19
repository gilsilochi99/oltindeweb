
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isManager: boolean;
  isEditor: boolean;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const tokenResult = await user.getIdTokenResult();
        const claims = tokenResult.claims;
        setIsAdmin(claims.admin === true);
        setIsManager(claims.manager === true);
        setIsEditor(claims.editor === true);
      } else {
        setUser(null);
        setIsAdmin(false);
        setIsManager(false);
        setIsEditor(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, loading, isAdmin, isManager, isEditor };
}
