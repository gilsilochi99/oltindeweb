
'use client';

import { getInstitutions, getUniqueCategories } from "@/lib/data";
import { InstitutionCard } from "@/components/shared/InstitutionCard";
import { Pagination } from "@/components/shared/Pagination";
import { useEffect, useState, useMemo, Suspense } from "react";
import type { Institution, CategoryUsage } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const ITEMS_PER_PAGE = 10;

function InstitutionsPageContent() {
  const searchParams = useSearchParams();
  const [allInstitutions, setAllInstitutions] = useState<Institution[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for filters
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const selectedCity = searchParams.get('city') || 'all';

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [institutionsData, categoriesData] = await Promise.all([
        getInstitutions(),
        getUniqueCategories(),
      ]);
      setAllInstitutions(institutionsData);
      const institutionCategories = new Set(institutionsData.map(inst => inst.category));
      setCategories(categoriesData.filter(c => institutionCategories.has(c.name)));
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredInstitutions = useMemo(() => {
    return allInstitutions.filter(institution => {
        const matchesQuery = institution.name.toLowerCase().includes(searchQuery.toLowerCase()) || institution.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || institution.category === selectedCategory;
        const matchesCity = selectedCity === 'all' || institution.branches?.some(branch => branch.location.city === selectedCity);
        return matchesQuery && matchesCategory && matchesCity;
    });
  }, [allInstitutions, searchQuery, selectedCategory, selectedCity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCity]);


  const totalPages = Math.ceil(filteredInstitutions.length / ITEMS_PER_PAGE);
  const currentInstitutions = filteredInstitutions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Directorio de Instituciones</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
          Encuentre información de contacto y servicios de las instituciones gubernamentales y otras organizaciones clave del país.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
            <Label htmlFor="search-query">Buscar por nombre</Label>
             <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    id="search-query"
                    placeholder="Ej: Ministerio de Hacienda..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
        <div className="space-y-2">
            <Label htmlFor="category-filter">Filtrar por Categoría</Label>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger id="category-filter" className="bg-background">
                    <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map(category => (
                    <SelectItem key={category.name} value={category.name}>
                        {category.name}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      <main className="space-y-6">
          {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
                {currentInstitutions.length > 0 ? (
                    currentInstitutions.map((institution) => (
                      <InstitutionCard key={institution.id} institution={institution} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                            <p>No se encontraron instituciones que coincidan con su búsqueda.</p>
                        </CardContent>
                    </Card>
                )}
            </div>
          )}

          {totalPages > 1 && !isLoading && (
              <div className="pt-6 border-t">
              <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
              />
              </div>
          )}
      </main>
    </div>
  );
}


export default function InstitutionsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <InstitutionsPageContent />
        </Suspense>
    )
}
