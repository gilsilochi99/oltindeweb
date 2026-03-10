'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Announcement } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import AnnouncementsList from './AnnouncementsList';
import AddAnnouncementForm from './AddAnnouncementForm';

export default function CompanyAnnouncementsPage({ params }: any) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        setIsLoading(true);
        const data = await getCompanyById(params.companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
        }
        setCompany(data);
        setAnnouncements(data.announcements?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []);
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, params.companyId]);

  const handleAnnouncementAdded = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleAnnouncementDeleted = (announcementId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return null; // Or some other placeholder
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestionar Anuncios para {company.name}</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnnouncementsList companyId={company.id} announcements={announcements} onAnnouncementDeleted={handleAnnouncementDeleted} />
        </div>
        <div>
          <AddAnnouncementForm companyId={company.id} onAnnouncementAdded={handleAnnouncementAdded} />
        </div>
      </div>
    </div>
  );
}
