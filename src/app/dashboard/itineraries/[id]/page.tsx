
'use client';

import { use, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getItineraryById, getUniqueCities, getTouristLocations, getCompanies } from '@/lib/data';
import type { Itinerary, TouristLocation, Company } from '@/lib/types';
import { ItineraryForm } from '@/components/shared/ItineraryForm';
import { Skeleton } from '@/components/ui/skeleton';

function EditItineraryPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function EditItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
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
      if (!user) return;
      const itineraryData = await getItineraryById(id);
      if (!itineraryData || (itineraryData.authorId !== user.uid && !isAdmin)) {
        notFound();
        return;
      }
      const [cityList, locationList, companyList] = await Promise.all([
        getUniqueCities(),
        getTouristLocations(),
        getCompanies(),
      ]);
      setItinerary(itineraryData);
      setCities(cityList);
      setLocations(locationList);
      setCompanies(companyList);
      setIsDataLoading(false);
    }
    fetchData();
  }, [user, isAdmin, id]);

  const handleFormSubmit = () => {
    router.push('/dashboard/itineraries');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <EditItineraryPageLoader />;
  }

  if (!user || !itinerary) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Editar Itinerario</h1>
        <p className="text-muted-foreground">Actualice los detalles y paradas de su itinerario.</p>
      </div>
      <ItineraryForm
        type="Update"
        userId={user.uid}
        authorName={itinerary.authorName}
        isAdmin={isAdmin}
        initialData={itinerary}
        cities={cities}
        locations={locations}
        companies={companies}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
