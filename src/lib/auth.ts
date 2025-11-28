
import { headers } from 'next/headers';
import { auth } from './firebase'; // Using Admin SDK

interface UserSession {
  isAuthenticated: boolean;
  uid?: string;
  role?: 'admin' | 'manager' | 'editor' | 'user';
}

export async function getUserSession(): Promise<UserSession> {
  const authorization = headers().get('Authorization');
  
  if (authorization?.startsWith('Bearer ')) {
    const idToken = authorization.split('Bearer ')[1];
    try {
      const decodedToken = await auth.verifyIdToken(idToken);
      const user = await auth.getUser(decodedToken.uid);
      const role = user.customClaims?.role || 'user';

      return { isAuthenticated: true, uid: decodedToken.uid, role };
    } catch (error) {
      console.error('Error verifying token:', error);
      return { isAuthenticated: false };
    }
  }
  return { isAuthenticated: false };
}
