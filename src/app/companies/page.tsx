'use client';

import { getCompanies, getUniqueCategories, getServices } from "@/lib/data";
import { Pagination } from "@/components/shared/Pagination";
import { useEffect, useState, useMemo, Suspense } from "react";
import type { Company, Service, CategoryUsage } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyListItem } from "@/components/shared/CompanyListItem";

const ITEMS_PER_PAGE = 10;


function CompaniesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for filters, pre-populated from URL search params
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const selectedCity = searchParams.get('city') || 'all';

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [companiesData, categoriesData, servicesData] = await Promise.all([
        getCompanies(),
        getUniqueCategories(),
        getServices(),
      ]);
      setAllCompanies(companiesData);
      setCategories(['all', ...categoriesData.map(c => c.name)]);
      setServices(servicesData);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const filteredCompanies = useMemo(() => {
    const filtered = allCompanies.filter(company => {
      const matchesCategory = selectedCategory === 'all' || company.category === selectedCategory;
      const matchesService = selectedService === 'all' || company.branches?.some(branch => branch.servicesOffered?.includes(selectedService));
      const matchesCity = selectedCity === 'all' || company.branches?.some(branch => branch.location.city === selectedCity);
      return matchesCategory && matchesService && matchesCity;
    });

    // Sort to bring featured companies to the top of any result set
    filtered.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
    });
    
    return filtered;
  }, [allCompanies, selectedCategory, selectedService, selectedCity]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const currentCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  
  useEffect(() => {
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    if (selectedService && selectedService !== 'all') {
      params.set('service', selectedService);
    } else {
      params.delete('service');
    }
    // No need to handle city here, it's handled by the global city selector
    router.replace(`/companies?${params.toString()}`);
  }, [selectedCategory, selectedService, router, searchParams]);


  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };
  
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Encuentre y Conecte con Empresas Expertas</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">
          Busque en nuestro directorio de empresas. Filtre por categoría, y servicios para encontrar el socio perfecto para usted o su negocio.
        </p>
      </section>

      <div className="flex gap-4">
          <Select value={selectedService} onValueChange={setSelectedService}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Todos los servicios</SelectItem>
               {services.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Actividad" />
            </SelectTrigger>
            <SelectContent>
               {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Todas las actividades' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>
      
      <main className="space-y-6">
          {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-6">
                {currentCompanies.length > 0 ? (
                    currentCompanies.map((company) => (
                        <CompanyListItem key={company.id} company={company} />
                    ))
                ) : (
                    <Card>
                        <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                            <p>No se encontraron empresas que coincidan con su búsqueda.</p>
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

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <CompaniesPageContent />
    </Suspense>
  )
}
