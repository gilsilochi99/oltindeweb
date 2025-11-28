
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect } from 'react';

type Role = 'admin' | 'manager' | 'editor';

interface RoleBasedGuardProps {
  children: React.ReactNode;
  role: Role;
}

export default function RoleBasedGuard({ children, role }: RoleBasedGuardProps) {
  const { loading, user, isAdmin, isManager, isEditor } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return; // Wait for the auth state to be determined
    }

    if (!user) {
        router.push('/signin');
        return;
    }

    let hasRequiredRole = false;
    switch(role) {
        case 'editor':
            hasRequiredRole = isEditor || isManager || isAdmin;
            break;
        case 'manager':
            hasRequiredRole = isManager || isAdmin;
            break;
        case 'admin':
            hasRequiredRole = isAdmin;
            break;
    }

    if (!hasRequiredRole) {
      if (isAdmin) {
        router.push('/admin');
      } else if (isManager) {
        router.push('/dashboard/manager');
      } else if (isEditor) {
        router.push('/dashboard/editor');
      } else {
        router.push('/dashboard'); // Redirect regular users to their dashboard
      }
    }
  }, [loading, user, isAdmin, isManager, isEditor, role, router]);

  // While loading or if user is null, show a loading indicator
  if (loading || !user) {
    return <div>Loading...</div>; // Or a proper loading spinner component
  }

  // Check roles again before rendering children to avoid flicker
  let hasRequiredRole = false;
    switch(role) {
        case 'editor':
            hasRequiredRole = isEditor || isManager || isAdmin;
            break;
        case 'manager':
            hasRequiredRole = isManager || isAdmin;
            break;
        case 'admin':
            hasRequiredRole = isAdmin;
            break;
    }

  if (!hasRequiredRole) {
    return null; // Render nothing while redirecting
  }

  return <>{children}</>;
}
