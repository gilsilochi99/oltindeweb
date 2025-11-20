
'use client';

import { CompanyForm } from "@/components/shared/CompanyForm";
import { useToast } from "@/hooks/use-toast";
import { getServices, getUniqueCities } from "@/lib/data";
import { CategoryUsage, Service } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";

export default function NewCompanyPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [categories, setCategories] = useState<CategoryUsage[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
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

            setServices(servicesData);
            setCategories(uniqueCategories);
            setCities(citiesData);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (isLoading) {
        return <div>Cargando...</div>
    }

    return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold font-headline">Añadir Nueva Empresa</h1>
            <p className="text-muted-foreground">Complete el siguiente formulario para registrar una nueva empresa en el directorio.</p>
            <div className="mt-8">
                <CompanyForm
                    type="Create"
                    categories={categories}
                    services={services}
                    cities={cities}
                    onFormSubmit={() => { }}
                />
            </div>
        </div>
    )
}
