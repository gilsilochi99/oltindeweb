
'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getMenuItemsByCompany } from '@/lib/data';
import { MenuItemForm } from '@/components/shared/MenuItemForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Company } from '@/lib/types';
import Link from 'next/link';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';

function NewMenuItemPageLoader() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}

export default function NewMenuItemPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
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
      const items = await getMenuItemsByCompany(companyId);
      setCompany(companyData);
      setFoodTypes(Array.from(new Set(items.map(i => i.foodType).filter(Boolean))));
      setIsDataLoading(false);
    }
    fetchData();
  }, [user, companyId]);

  const handleFormSubmit = () => {
    router.push(`/dashboard/companies/${companyId}/menu`);
    router.refresh();
  };

  if (authLoading || isDataLoading) {
    return <NewMenuItemPageLoader />;
  }

  if (!user || !company) {
    return null;
  }

  if (!company.isPremium) {
    return <CompanyPremiumRequired companyName={company.name} />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold font-headline">Añadir Producto al Menú</h1>
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
            type="Create"
            companyId={companyId}
            userId={user.uid}
            foodTypes={foodTypes}
            onFormSubmit={handleFormSubmit}
          />
        </CardContent>
      </Card>
    </div>
  );
}
