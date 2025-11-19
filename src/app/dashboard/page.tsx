
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import RoleBasedGuard from '@/components/auth/RoleBasedGuard';
import CompaniesPanel from '@/components/dashboard/panels/CompaniesPanel';
import AnnouncementsPanel from '@/components/dashboard/panels/AnnouncementsPanel';
import PostsPanel from '@/components/dashboard/panels/PostsPanel';
import UserProfilePanel from '@/components/dashboard/panels/UserProfilePanel';

export default function UserDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin h-10 w-10" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to your Dashboard, {user.displayName || ''}!</h1>
      <p className="text-lg text-muted-foreground mb-8">Here you can manage your profile, view your favorite companies, and more.</p>
      
      <div className="space-y-8">
        <UserProfilePanel />
        
        {(user.role === 'admin' || user.role === 'manager') && (
          <RoleBasedGuard role={user.role}>
            <CompaniesPanel />
          </RoleBasedGuard>
        )}

        {(user.role === 'admin' || user.role === 'editor') && (
          <RoleBasedGuard role={user.role}>
            <AnnouncementsPanel />
          </RoleBasedGuard>
        )}

        <PostsPanel />
      </div>
    </div>
  );
}
