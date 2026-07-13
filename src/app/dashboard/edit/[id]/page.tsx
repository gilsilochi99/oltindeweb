
'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getServices, getUniqueCities } from '@/lib/data';
import type { Company, Service, CategoryUsage } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyForm } from '@/components/shared/CompanyForm';

function EditCompanyPageLoader() {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Skeleton className="h-6 w-1/4" />
                <Skeleton className="h-4 w-1/2" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/2" />
                    <Skeleton className="h-4 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                    <Skeleton className="h-10 w-32" />
                </CardContent>
            </Card>
        </div>
    )
}

export default function EditCompanyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const { user, isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [company, setCompany] = useState<Company | null>(null);
    const [categories, setCategories] = useState<CategoryUsage[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/signin');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setIsDataLoading(true);
            try {
                const [companyData, servicesData, citiesData] = await Promise.all([
                    getCompanyById(id),
                    getServices(),
                    getUniqueCities(),
                ]);

                if (!companyData || (companyData.ownerId !== user!.uid && !isAdmin)) {
                    notFound();
                    return;
                }

                const uniqueCategories = [...new Set(servicesData.map(s => s.category))].map(name => ({
                    name,
                    companyCount: 0,
                    institutionCount: 0,
                    procedureCount: 0,
                }));

                setCompany(companyData);
                setCategories(uniqueCategories);
                setServices(servicesData);
                setCities(citiesData);
            } catch (error) {
                console.error("Failed to fetch data for edit form", error);
            } finally {
                setIsDataLoading(false);
            }
        }
        fetchData();
    }, [user, isAdmin, id]);

    if (authLoading || isDataLoading) {
        return <EditCompanyPageLoader />;
    }

    if (!user || !company) {
        return null; // Redirecting or not found
    }

    const handleFormSubmit = () => {
        router.push('/dashboard');
        router.refresh();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Editar Empresa</h1>
                <p className="text-muted-foreground">Actualice la información de {company.name}.</p>
            </div>
            <CompanyForm
                type="Update"
                initialData={company}
                categories={categories}
                services={services}
                cities={cities}
                onFormSubmit={handleFormSubmit}
            />
        </div>
    )
}
