
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUniqueCities, getServices } from '@/lib/data';
import { HealthFacilityForm } from '@/components/shared/HealthFacilityForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthFacilityType, Service } from '@/lib/types';

function NewHealthFacilityPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

const VALID_TYPES: HealthFacilityType[] = ['hospital', 'clinic', 'pharmacy'];

function AdminNewHealthFacilityPageContent() {
  const { user, isAdmin, isManager, isPharmacist, loading: authLoading } = useAuth();
  const canManage = isAdmin || isManager || isPharmacist;
  const lockType = (!isAdmin && !isManager && isPharmacist) ? 'pharmacy' : undefined;
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get('type');
  const defaultFacilityType = VALID_TYPES.includes(typeParam as HealthFacilityType) ? (typeParam as HealthFacilityType) : undefined;

  const [cities, setCities] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !canManage)) {
      router.push('/admin/health');
    }
  }, [user, canManage, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      const [cityList, serviceList] = await Promise.all([getUniqueCities(), getServices()]);
      setCities(cityList);
      setServices(serviceList);
      setIsDataLoading(false);
    }
    fetchData();
  }, []);

  const handleFormSubmit = () => {
    router.push('/admin/health');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <NewHealthFacilityPageLoader />;
  }

  if (!user || !canManage) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-headline">Añadir Centro de Salud</h1>
        <p className="text-muted-foreground">Hospitales, clínicas y farmacias visibles para los pacientes.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Centro</CardTitle>
          <CardDescription>Complete la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthFacilityForm
            type="Create"
            cities={cities}
            services={services}
            defaultFacilityType={defaultFacilityType}
            lockType={lockType}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminNewHealthFacilityPage() {
  return (
    <Suspense fallback={<NewHealthFacilityPageLoader />}>
      <AdminNewHealthFacilityPageContent />
    </Suspense>
  );
}
