'use client';

import { Pagination } from "@/components/shared/Pagination";
import { useState, useMemo } from "react";
import type { Company, Service, CategoryUsage } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Building2, ChevronRight, ArrowLeft, Briefcase, HardHat, Stethoscope, UtensilsCrossed, Laptop, Scale, Truck, GraduationCap, Sparkles, Landmark, SprayCan, ShieldCheck, Home, Car, Megaphone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCityPreference } from "@/hooks/use-city-preference";
import { CompanyListingCard } from "@/components/shared/archive/CompanyListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;
const CATEGORIES_PER_PAGE = 10;

// Best-effort icon per category, matched by keyword since categories are
// free text (no admin-configurable icon field on Company) — mirrors the
// same heuristic used on the Servicios directory page.
function getCategoryIcon(category: string) {
  const c = category.toLowerCase();
  if (/constru|obra|arquitect/.test(c)) return HardHat;
  if (/salud|médic|medic|clínic|clinic|hospital|dental/.test(c)) return Stethoscope;
  if (/restaurant|comida|gastronom|catering/.test(c)) return UtensilsCrossed;
  if (/tecnolog|software|inform|digital|web/.test(c)) return Laptop;
  if (/legal|abogad|jurídic|juridic/.test(c)) return Scale;
  if (/transport|logístic|logistic|envío|envio/.test(c)) return Truck;
  if (/educa|formaci|academia|escuela/.test(c)) return GraduationCap;
  if (/bellez|estétic|estetic|peluquer|spa/.test(c)) return Sparkles;
  if (/financ|banc|seguro|contabl/.test(c)) return Landmark;
  if (/limpieza/.test(c)) return SprayCan;
  if (/segur/.test(c)) return ShieldCheck;
  if (/hogar|mueble|decorac/.test(c)) return Home;
  if (/automó|automo|taller|mecánic|mecanic|vehículo|vehiculo/.test(c)) return Car;
  if (/marketing|public|diseñ|diseno/.test(c)) return Megaphone;
  return Briefcase;
}

function CategoryBrowseView({ categories, onSelectCategory, onViewAll }: {
  categories: CategoryUsage[];
  onSelectCategory: (category: string) => void;
  onViewAll: () => void;
}) {
  const [currentPage, setCurrentPage] = useState(1);

  const companyCategories = useMemo(
    () => categories.filter(c => c.companyCount > 0).sort((a, b) => b.companyCount - a.companyCount),
    [categories]
  );

  const totalPages = Math.ceil(companyCategories.length / CATEGORIES_PER_PAGE);
  const pageCategories = companyCategories.slice(
    (currentPage - 1) * CATEGORIES_PER_PAGE,
    currentPage * CATEGORIES_PER_PAGE
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Actividades ({companyCategories.length})</CardTitle>
            <CardDescription>Elija una actividad para ver las empresas que ofrecen ese servicio.</CardDescription>
          </div>
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-secondary underline underline-offset-2 shrink-0 text-left md:text-right"
          >
            Ver todas las empresas
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {companyCategories.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Actividad</TableHead>
                  <TableHead className="text-center">Empresas</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pageCategories.map((category) => {
                  const Icon = getCategoryIcon(category.name);
                  return (
                    <TableRow
                      key={category.name}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => onSelectCategory(category.name)}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2.5">
                          <div className="bg-primary/10 p-1.5 rounded-md shrink-0">
                            <Icon className="w-4 h-4 text-black" />
                          </div>
                          {category.name.toUpperCase()}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1.5">
                          <Building2 className="w-3 h-3" />
                          {category.companyCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No se encontraron actividades.</p>
          </div>
        )}
        {totalPages > 1 && (
          <div className="pt-4">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => { setCurrentPage(page); window.scrollTo(0, 0); }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface CompaniesPageClientProps {
  initialCompanies: Company[];
  initialCategories: CategoryUsage[];
  initialServices: Service[];
}

// All three datasets are fetched server-side (page.tsx) from already-cached
// data.ts functions and passed in here as initial props — this component no
// longer fetches anything itself on mount. That's the fix for the page
// "taking time to load": it used to ship a blank shell + spinner, then fire
// client-side Server Action RPC calls for everything, even for the default
// landing view. Now the first response already contains real, server-
// rendered HTML with real data.
export function CompaniesPageClient({ initialCompanies, initialCategories, initialServices }: CompaniesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);

  // State for filters, pre-populated from URL search params
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  // Browsing by activity is the default landing view; a category param or an
  // explicit "view all" action switches to the filterable list, same as before.
  const [mode, setMode] = useState<'browse' | 'list'>(
    searchParams.get('category') || searchParams.get('view') === 'list' ? 'list' : 'browse'
  );
  const { city: preferredCity } = useCityPreference();
  const selectedCity = searchParams.get('city') || preferredCity;

  const filteredCompanies = useMemo(() => {
    const filtered = initialCompanies.filter(company => {
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
  }, [initialCompanies, selectedCategory, selectedService, selectedCity]);

  const totalPages = Math.ceil(filteredCompanies.length / ITEMS_PER_PAGE);
  const currentCompanies = filteredCompanies.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const syncUrl = (nextCategory: string, nextService: string) => {
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategory && nextCategory !== 'all') {
      params.set('category', nextCategory);
    } else {
      params.delete('category');
    }
    if (nextService && nextService !== 'all') {
      params.set('service', nextService);
    } else {
      params.delete('service');
    }
    params.set('view', 'list');
    // No need to handle city here, it's handled by the global city selector
    router.replace(`/companies?${params.toString()}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    syncUrl(value, selectedService);
  };

  const handleServiceChange = (value: string) => {
    setSelectedService(value);
    syncUrl(selectedCategory, value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0); // Scroll to top on page change
  };

  const goToCategory = (category: string) => {
    setSelectedCategory(category);
    setMode('list');
    syncUrl(category, selectedService);
  };

  const viewAllCompanies = () => {
    setSelectedCategory('all');
    setMode('list');
    syncUrl('all', selectedService);
  };

  const backToActivities = () => {
    setSelectedCategory('all');
    setSelectedService('all');
    setMode('browse');
    router.push('/companies');
  };

  const featuredItems = useMemo(() => initialCompanies
    .filter(c => c.isFeatured)
    .slice(0, 3)
    .map(c => ({
      id: c.id,
      href: `/companies/${c.id}`,
      name: c.name,
      subtitle: c.category,
      metaPrimary: c.branches?.[0]?.contact.phone,
    })), [initialCompanies]);

  if (mode === 'browse') {
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
          description="Explore por actividad para encontrar el socio perfecto para usted o su negocio."
        />
        <CategoryBrowseView
          categories={initialCategories}
          onSelectCategory={goToCategory}
          onViewAll={viewAllCompanies}
        />
      </ArchiveShell>
    );
  }

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
      <button
        type="button"
        onClick={backToActivities}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Volver a Actividades
      </button>

      <ArchiveHeader
        breadcrumbLabel="Empresas"
        title="Encuentre y Conecte con Empresas Expertas"
        description="Busque en nuestro directorio de empresas. Filtre por categoría y servicios para encontrar el socio perfecto para usted o su negocio."
        resultCount={filteredCompanies.length}
        pageStart={filteredCompanies.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredCompanies.length)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Select value={selectedService} onValueChange={handleServiceChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Servicio" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Todos los servicios</SelectItem>
               {initialServices.map(service => (
                <SelectItem key={service.id} value={service.id}>
                  {service.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Actividad" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="all">Todas las actividades</SelectItem>
               {initialCategories.map(category => (
                <SelectItem key={category.name} value={category.name}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </div>

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

      {totalPages > 1 && (
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
