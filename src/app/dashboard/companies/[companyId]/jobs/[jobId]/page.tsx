
'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getJobById, getUniqueCities, getUniqueJobSectors } from '@/lib/data';
import type { Company, JobPosting } from '@/lib/types';
import { JobForm } from '@/components/shared/JobForm';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { MousePointerClick } from 'lucide-react';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';

function EditJobPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function EditJobPage({ params }: { params: Promise<{ companyId: string; jobId: string }> }) {
  const { companyId, jobId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [job, setJob] = useState<JobPosting | null>(null);
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
      const jobData = await getJobById(jobId);
      if (!jobData || jobData.companyId !== companyId) {
        notFound();
        return;
      }
      const [cityList, sectorList] = await Promise.all([
        getUniqueCities(),
        getUniqueJobSectors(),
      ]);
      setCompany(companyData);
      setJob(jobData);
      setCities(cityList);
      setSectors(sectorList);
      setIsDataLoading(false);
    }
    fetchData();
  }, [user, companyId, jobId]);

  const handleFormSubmit = () => {
    router.push(`/dashboard/companies/${companyId}/jobs`);
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <EditJobPageLoader />;
  }

  if (!user || !company || !job) {
    return null;
  }

  if (!company.isPremium) {
    return <CompanyPremiumRequired companyName={company.name} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Editar Empleo</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
        </p>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-2">
          <MousePointerClick className="w-4 h-4" />
          {job.applicationClickCount ?? 0} clic{(job.applicationClickCount ?? 0) === 1 ? '' : 's'} en "Aplicar Ahora"
        </p>
      </div>
      <JobForm
        type="Update"
        companyId={company.id}
        userId={user.uid}
        initialData={job}
        cities={cities}
        sectors={sectors}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
