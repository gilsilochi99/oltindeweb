
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getUniqueCities, getUniqueTouristLocationCategories } from '@/lib/data';
import { PlaceForm } from '@/components/shared/PlaceForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

function SuggestPlacePageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function SuggestPlacePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

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
    router.push('/places');
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <SuggestPlacePageLoader />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold font-headline">Sugerir un Lugar Turístico</h1>
        <p className="text-muted-foreground">
          Comparta un lugar que merezca la pena visitar. Un administrador revisará su sugerencia antes de publicarla.
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
            cities={cities}
            categories={categories}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
