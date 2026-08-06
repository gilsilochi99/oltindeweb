
'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getUniqueCities, getUniqueJobSectors } from '@/lib/data';
import type { Company } from '@/lib/types';
import { JobForm } from '@/components/shared/JobForm';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';

function NewJobPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function NewJobPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      const companyData = await getCompanyById(companyId);
      if (!companyData || companyData.ownerId !== user.uid) {
        notFound();
        return;
      }
      const [cityList, sectorList] = await Promise.all([
        getUniqueCities(),
        getUniqueJobSectors(),
      ]);
      setCompany(companyData);
      setCities(cityList);
      setSectors(sectorList);
      setIsDataLoading(false);
    }
    fetchData();
  }, [user, companyId]);

  const handleFormSubmit = () => {
    router.push(`/dashboard/companies/${companyId}/jobs`);
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <NewJobPageLoader />;
  }

  if (!user || !company) {
    return null;
  }

  if (!company.isPremium) {
    return <CompanyPremiumRequired companyName={company.name} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Publicar Nuevo Empleo</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
        </p>
      </div>
      <JobForm
        type="Create"
        companyId={company.id}
        userId={user.uid}
        cities={cities}
        sectors={sectors}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
