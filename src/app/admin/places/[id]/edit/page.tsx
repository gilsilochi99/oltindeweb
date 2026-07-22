
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getTouristLocationById, getUniqueCities, getUniqueTouristLocationCategories } from '@/lib/data';
import { PlaceForm } from '@/components/shared/PlaceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TouristLocation } from '@/lib/types';

function EditPlacePageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function AdminEditPlacePage() {
  const { user, isAdmin, isManager, loading: authLoading } = useAuth();
  const canModerate = isAdmin || isManager;
  const router = useRouter();
  const params = useParams();
  const locationId = params.id as string;

  const [location, setLocation] = useState<TouristLocation | null>(null);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && (!user || !canModerate)) {
      router.push('/admin/places');
    }
  }, [user, canModerate, authLoading, router]);

  useEffect(() => {
    async function fetchData() {
      const [locationData, cityList, categoryList] = await Promise.all([
        getTouristLocationById(locationId),
        getUniqueCities(),
        getUniqueTouristLocationCategories(),
      ]);
      setLocation(locationData ?? null);
      setCities(cityList);
      setCategories(categoryList);
      setIsDataLoading(false);
    }
    if (locationId) fetchData();
  }, [locationId]);

  const handleFormSubmit = () => {
    router.push('/admin/places');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <EditPlacePageLoader />;
  }

  if (!user || !canModerate) {
    return null;
  }

  if (!location) {
    return <p className="text-center text-muted-foreground py-8">Lugar no encontrado.</p>;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-headline">Editar Lugar Turístico</h1>
        <p className="text-muted-foreground">Actualice la información de este lugar publicado.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Lugar</CardTitle>
          <CardDescription>Complete la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceForm
            type="Update"
            userId={user.uid}
            isAdmin={canModerate}
            initialData={location}
            cities={cities}
            categories={categories}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
