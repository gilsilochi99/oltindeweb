'use client';

import { getCompanies, getUniqueCategories, getServices } from "@/lib/data";
import { Pagination } from "@/components/shared/Pagination";
import { useEffect, useState, useMemo, Suspense } from "react";
import type { Company, Service } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCityPreference } from "@/hooks/use-city-preference";
import { CompanyListingCard } from "@/components/shared/archive/CompanyListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

function averageRating(company: Company) {
  return company.reviews && company.reviews.length > 0
    ? company.reviews.reduce((acc, r) => acc + r.rating, 0) / company.reviews.length
    : 0;
}

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
  const { city: preferredCity } = useCityPreference();
  const selectedCity = searchParams.get('city') || preferredCity;

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

  const featuredItems = useMemo(() => allCompanies
    .filter(c => c.isFeatured)
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      href: `/companies/${c.id}`,
      name: c.name,
      subtitle: c.category,
      metaPrimary: c.branches?.[0]?.contact.phone,
    })), [allCompanies]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Empresas Destacadas" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Empresas"
        title="Encuentre y Conecte con Empresas Expertas"
        description="Busque en nuestro directorio de empresas. Filtre por categoría y servicios para encontrar el socio perfecto para usted o su negocio."
        resultCount={isLoading ? undefined : filteredCompanies.length}
        pageStart={filteredCompanies.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)}
      />

      <div className="flex gap-4 mb-6">
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

      {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>
      ) : (
        <div className="space-y-4">
            {currentCompanies.length > 0 ? (
                currentCompanies.map((company) => (
                  <CompanyListingCard key={company.id} company={company} />
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
          <div className="pt-2">
          <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
          />
          </div>
      )}
    </ArchiveShell>
  );
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <CompaniesPageContent />
    </Suspense>
  )
}
