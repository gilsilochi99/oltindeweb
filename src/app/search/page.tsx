
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { getCompanies, getInstitutions, getProcedures, getServices } from '@/lib/data';
import type { Company, Institution, Procedure, Service } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { SearchResultCard } from '@/components/shared/SearchResultCard';
import { Card, CardContent } from '@/components/ui/card';

type SearchableItem = (Company | Institution | Procedure | Service) & { entityType: 'company' | 'institution' | 'procedure' | 'service' };

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [isLoading, setIsLoading] = useState(true);
    const [results, setResults] = useState<SearchableItem[]>([]);

    useEffect(() => {
        async function fetchData() {
            if (!query) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const [companies, institutions, procedures, services] = await Promise.all([
                getCompanies(),
                getInstitutions(),
                getProcedures(),
                getServices()
            ]);

            const lowerCaseQuery = query.toLowerCase();

            const companyResults = companies
                .filter(item => item.name.toLowerCase().includes(lowerCaseQuery) || item.description.toLowerCase().includes(lowerCaseQuery))
                .map(item => ({ ...item, entityType: 'company' as const }));

            const institutionResults = institutions
                .filter(item => item.name.toLowerCase().includes(lowerCaseQuery) || item.description.toLowerCase().includes(lowerCaseQuery))
                .map(item => ({ ...item, entityType: 'institution' as const }));

            const procedureResults = procedures
                .filter(item => item.name.toLowerCase().includes(lowerCaseQuery) || item.description.toLowerCase().includes(lowerCaseQuery))
                .map(item => ({ ...item, entityType: 'procedure' as const }));
            
            const serviceResults = services
                .filter(item => item.name.toLowerCase().includes(lowerCaseQuery) || item.description.toLowerCase().includes(lowerCaseQuery))
                .map(item => ({ ...item, entityType: 'service' as const }));

            setResults([...companyResults, ...institutionResults, ...procedureResults, ...serviceResults]);
            setIsLoading(false);
        }

        fetchData();
    }, [query]);

    return (
        <div className="space-y-6">
            <section>
                <h1 className="text-3xl font-bold font-headline">
                    Resultados de búsqueda para: <span className="text-primary">{query}</span>
                </h1>
                <p className="text-lg text-muted-foreground mt-2">
                    {isLoading ? 'Buscando...' : `Se encontraron ${results.length} resultados.`}
                </p>
            </section>

            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
            ) : results.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {results.map((item) => (
                       <SearchResultCard key={`${item.entityType}-${item.id}`} item={item} />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed flex flex-col items-center gap-4">
                        <Search className="w-12 h-12" />
                        <p>No se encontraron resultados para su búsqueda.</p>
                        <p className="text-sm">Intente con otro término de búsqueda.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <SearchPageContent />
        </Suspense>
    )
}
