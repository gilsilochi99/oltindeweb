
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getUniqueCities, getUniqueTouristLocationCategories } from '@/lib/data';
import { PlaceForm } from '@/components/shared/PlaceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function NewPlacePageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function AdminNewPlacePage() {
  const { user, isAdmin, isManager, loading: authLoading } = useAuth();
  const canModerate = isAdmin || isManager;
  const router = useRouter();
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
      const [cityList, categoryList] = await Promise.all([
        getUniqueCities(),
        getUniqueTouristLocationCategories(),
      ]);
      setCities(cityList);
      setCategories(categoryList);
      setIsDataLoading(false);
    }
    fetchData();
  }, []);

  const handleFormSubmit = () => {
    router.push('/admin/places');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <NewPlacePageLoader />;
  }

  if (!user || !canModerate) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold font-headline">Añadir Lugar Turístico</h1>
        <p className="text-muted-foreground">
          El lugar se publicará directamente, sin pasar por el proceso de revisión.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Lugar</CardTitle>
          <CardDescription>Complete la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <PlaceForm
            type="Create"
            userId={user.uid}
            isAdmin={canModerate}
            cities={cities}
            categories={categories}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
