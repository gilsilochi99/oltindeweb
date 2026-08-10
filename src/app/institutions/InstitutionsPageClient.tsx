'use client';

import { Pagination } from "@/components/shared/Pagination";
import { useEffect, useState, useMemo } from "react";
import type { Institution, CategoryUsage } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { slugify } from "@/lib/slug";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { InstitutionListingCard } from "@/components/shared/archive/InstitutionListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";
import { MobileFilterSheet } from "@/components/shared/archive/MobileFilterSheet";

const ITEMS_PER_PAGE = 10;

function averageRating(institution: Institution) {
  return institution.reviews && institution.reviews.length > 0
    ? institution.reviews.reduce((acc, r) => acc + r.rating, 0) / institution.reviews.length
    : 0;
}

interface InstitutionsPageClientProps {
  allInstitutions: Institution[];
  categories: CategoryUsage[];
  initialCategory?: string;
}

export function InstitutionsPageClient({ allInstitutions, categories, initialCategory }: InstitutionsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { city: preferredCity } = useCityPreference();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || initialCategory || 'all');
  const selectedCity = searchParams.get('city') || preferredCity;

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
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allInstitutions
    .slice()
    .sort((a, b) => averageRating(b) - averageRating(a))
    .slice(0, 3)
    .map(i => ({
      id: i.id,
      href: `/institutions/${i.id}`,
      name: i.name,
      subtitle: i.category,
      metaPrimary: i.branches?.[0]?.contact.phone,
    })), [allInstitutions]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Instituciones Destacadas" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Instituciones"
        title="Directorio de Instituciones"
        description="Encuentre información de contacto y servicios de las instituciones gubernamentales y otras organizaciones clave del país."
        resultCount={filteredInstitutions.length}
        pageStart={filteredInstitutions.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredInstitutions.length)}
      />

      {(() => {
        const filterControls = (
          <>
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
                <Select value={selectedCategory} onValueChange={(value) => router.push(value === 'all' ? '/institutions' : `/institutions/category/${slugify(value)}`)}>
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
          </>
        );
        const activeCount = [selectedCategory !== 'all', searchQuery !== ''].filter(Boolean).length;
        return (
          <>
            <div className="hidden md:grid md:grid-cols-2 gap-4 mb-6">{filterControls}</div>
            <MobileFilterSheet activeCount={activeCount}>{filterControls}</MobileFilterSheet>
          </>
        );
      })()}

      <div className="space-y-4">
          {currentInstitutions.length > 0 ? (
              currentInstitutions.map((institution) => (
                <InstitutionListingCard key={institution.id} institution={institution} />
              ))
          ) : (
              <Card>
                  <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                      <p>No se encontraron instituciones que coincidan con su búsqueda.</p>
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
