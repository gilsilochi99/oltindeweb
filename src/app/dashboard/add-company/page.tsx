
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getServices, getUniqueCities } from '@/lib/data';
import type { Service, CategoryUsage } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CompanyForm } from '@/components/shared/CompanyForm';

function AddCompanyPageLoader() {
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


export default function AddCompanyPage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<CategoryUsage[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/signin');
        }
    }, [user, loading, router]);
    
    useEffect(() => {
        async function fetchData() {
            try {
                const [servicesData, citiesData] = await Promise.all([
                    getServices(),
                    getUniqueCities(),
                ]);
                const uniqueCategories = [...new Set(servicesData.map(s => s.category))].map(name => ({
                    name,
                    companyCount: 0,
                    institutionCount: 0,
                    procedureCount: 0,
                }));
                setCategories(uniqueCategories);
                setServices(servicesData);
                setCities(citiesData);
            } catch (error) {
                console.error("Failed to fetch data for form", error);
            } finally {
                setIsDataLoading(false);
            }
        }
        fetchData();
    }, []);

    if (loading || isDataLoading) {
        return <AddCompanyPageLoader />;
    }

    if (!user) {
        return null; // Redirecting...
    }

    const handleFormSubmit = () => {
        router.push('/dashboard');
        router.refresh();
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Añadir Nueva Empresa</h1>
                <p className="text-muted-foreground">Complete el siguiente formulario para registrar su empresa en el directorio.</p>
            </div>
            <CompanyForm 
                type="Create"
                userId={user.uid} 
                categories={categories}
                services={services}
                cities={cities}
                onFormSubmit={handleFormSubmit}
            />
        </div>
    )
}
