
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getHealthFacilityById, getUniqueCities } from '@/lib/data';
import { HealthFacilityForm } from '@/components/shared/HealthFacilityForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { HealthFacility } from '@/lib/types';

function EditHealthFacilityPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function AdminEditHealthFacilityPage() {
  const { user, isAdmin, isManager, loading: authLoading } = useAuth();
  const canManage = isAdmin || isManager;
  const router = useRouter();
  const params = useParams();
  const facilityId = params.id as string;

  const [facility, setFacility] = useState<HealthFacility | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !canManage)) {
      router.push('/admin/health');
    }
  }, [user, canManage, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      const [facilityData, cityList] = await Promise.all([
        getHealthFacilityById(facilityId),
        getUniqueCities(),
      ]);
      setFacility(facilityData ?? null);
      setCities(cityList);
      setIsDataLoading(false);
    }
    if (facilityId) fetchData();
  }, [facilityId]);

  const handleFormSubmit = () => {
    router.push('/admin/health');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <EditHealthFacilityPageLoader />;
  }

  if (!user || !canManage) {
    return null;
  }

  if (!facility) {
    return <p className="text-center text-muted-foreground py-8">Centro no encontrado.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-headline">Editar Centro de Salud</h1>
        <p className="text-muted-foreground">Actualice la información de este centro.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Centro</CardTitle>
          <CardDescription>Complete la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <HealthFacilityForm
            type="Update"
            initialData={facility}
            cities={cities}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
