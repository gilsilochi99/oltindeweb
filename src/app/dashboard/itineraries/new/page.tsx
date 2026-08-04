
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getUniqueCities, getTouristLocations, getCompanies } from '@/lib/data';
import type { TouristLocation, Company } from '@/lib/types';
import { ItineraryForm } from '@/components/shared/ItineraryForm';
import { Skeleton } from '@/components/ui/skeleton';

function NewItineraryPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function NewItineraryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<string[]>([]);
  const [locations, setLocations] = useState<TouristLocation[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      const [cityList, locationList, companyList] = await Promise.all([
        getUniqueCities(),
        getTouristLocations(),
        getCompanies(),
      ]);
      setCities(cityList);
      setLocations(locationList);
      setCompanies(companyList);
      setIsDataLoading(false);
    }
    fetchData();
  }, []);

  const handleFormSubmit = () => {
    router.push('/dashboard/itineraries');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <NewItineraryPageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Crear Nuevo Itinerario</h1>
        <p className="text-muted-foreground">Planifique un recorrido y compártalo con otros viajeros.</p>
      </div>
      <ItineraryForm
        type="Create"
        userId={user.uid}
        authorName={user.displayName || 'Anónimo'}
        cities={cities}
        locations={locations}
        companies={companies}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
