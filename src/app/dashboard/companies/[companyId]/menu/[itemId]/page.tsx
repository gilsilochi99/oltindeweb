
'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getMenuItemById, getMenuItemsByCompany } from '@/lib/data';
import { MenuItemForm } from '@/components/shared/MenuItemForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Company, MenuItem } from '@/lib/types';
import Link from 'next/link';

function EditMenuItemPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function EditMenuItemPage({ params }: { params: Promise<{ companyId: string; itemId: string }> }) {
  const { companyId, itemId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [item, setItem] = useState<MenuItem | null>(null);
  const [foodTypes, setFoodTypes] = useState<string[]>([]);
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
      const [itemData, items] = await Promise.all([
        getMenuItemById(itemId),
        getMenuItemsByCompany(companyId),
      ]);
      if (!itemData || itemData.companyId !== companyId) {
        notFound();
        return;
      }
      setCompany(companyData);
      setItem(itemData);
      setFoodTypes(Array.from(new Set(items.map(i => i.foodType).filter(Boolean))));
      setIsDataLoading(false);
    }
    fetchData();
  }, [user, companyId, itemId]);

  const handleFormSubmit = () => {
    router.push(`/dashboard/companies/${companyId}/menu`);
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <EditMenuItemPageLoader />;
  }

  if (!user || !company || !item) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold font-headline">Editar Producto</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Producto</CardTitle>
          <CardDescription>Complete la información a continuación.</CardDescription>
        </CardHeader>
        <CardContent>
          <MenuItemForm
            type="Update"
            companyId={companyId}
            userId={user.uid}
            initialData={item}
            foodTypes={foodTypes}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
