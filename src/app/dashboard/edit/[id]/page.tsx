
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getServices, getCompanyById, getUniqueCities } from '@/lib/data';
import type { Service, Company, CategoryUsage } from '@/lib/types';
import { CompanyForm } from '@/components/shared/CompanyForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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


export default function EditCompanyPage({ params }: { params: { id: string } }) {
    const { user, loading, isAdmin } = useAuth();
    const router = useRouter();
    const [company, setCompany] = useState<Company | null>(null);
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
                 const [companyData, servicesData, citiesData] = await Promise.all([
                    getCompanyById(params.id),
                    getServices(),
                    getUniqueCities(),
                ]);

                if (!companyData) {
                    notFound();
                }
                
                // Security check: only allow owner or admin to edit
                if (user && !isAdmin && companyData.ownerId !== user.uid) {
                    // Or redirect to an access denied page
                    notFound();
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
                console.error("Failed to fetch data for form", error);
            } finally {
                setIsDataLoading(false);
            }
        }
        if(user) { // Only fetch if user is loaded
          fetchData();
        }
    }, [params.id, user, isAdmin]);

    if (loading || isDataLoading) {
        return <EditCompanyPageLoader />;
    }

    if (!user || !company) {
        return null; // Redirecting or loader is handling it
    }


    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Editar Empresa</h1>
                <p className="text-muted-foreground">Actualice la información de su empresa a continuación.</p>
            </div>
            <CompanyForm 
                type="Update"
                initialData={company}
                categories={categories}
                services={services}
                cities={cities}
            />
        </div>
    )
}
