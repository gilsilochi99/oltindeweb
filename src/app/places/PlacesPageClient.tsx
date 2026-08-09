'use client';

import { useEffect, useState, useMemo } from "react";
import { Search, PlusCircle } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { TouristLocation } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, QAWidget, FeaturedListingsWidget, SidebarWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

function averageRating(location: TouristLocation) {
  return location.reviews && location.reviews.length > 0
    ? location.reviews.reduce((acc, r) => acc + r.rating, 0) / location.reviews.length
    : 0;
}

function SuggestPlaceWidget() {
  return (
    <SidebarWidget>
      <div className="text-center">
        <h3 className="text-lg font-bold text-on-background">¿Conoce un lugar que falta?</h3>
        <p className="text-xs text-secondary mt-2 mb-4">Sugiera un lugar turístico para que la comunidad lo descubra.</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/places/suggest"><PlusCircle className="w-4 h-4 mr-2" />Sugerir un Lugar</Link>
        </Button>
      </div>
    </SidebarWidget>
  );
}

interface PlacesPageClientProps {
  allLocations: TouristLocation[];
  categories: string[];
  cities: string[];
  initialCategory?: string;
}

export function PlacesPageClient({ allLocations, categories, cities, initialCategory }: PlacesPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { city: preferredCity } = useCityPreference();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || initialCategory || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);

  const filteredLocations = useMemo(() => {
    const filtered = allLocations.filter(location => {
      const matchesQuery = location.name.toLowerCase().includes(searchQuery.toLowerCase()) || location.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || location.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || location.location.city === selectedCity;
      return matchesQuery && matchesCategory && matchesCity;
    });

    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    return filtered;
  }, [allLocations, searchQuery, selectedCategory, selectedCity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCity]);

  const totalPages = Math.ceil(filteredLocations.length / ITEMS_PER_PAGE);
  const currentLocations = filteredLocations.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allLocations
    .filter(l => l.isFeatured)
    .slice(0, 3)
    .map(l => ({
      id: l.id,
      href: `/places/${l.id}`,
      name: l.name,
      subtitle: `${l.category} · ${l.location.city}`,
    })), [allLocations]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Lugares Destacados" items={featuredItems} />
          <SuggestPlaceWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Lugares Turísticos"
        title="Descubra los Mejores Lugares de Guinea Ecuatorial"
        description="Explore playas, monumentos, museos y más. Encuentre inspiración para su próximo itinerario."
        resultCount={filteredLocations.length}
        pageStart={filteredLocations.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredLocations.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-places">Buscar Lugar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-places"
              placeholder="Ej: Playa, Museo..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-filter">Categoría</Label>
          <Select value={selectedCategory} onValueChange={(value) => router.push(value === 'all' ? '/places' : `/places/category/${slugify(value)}`)}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Seleccione una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (
                <SelectItem key={category} value={category}>
                  {category === 'all' ? 'Todas las categorías' : category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city-filter">Ciudad</Label>
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger id="city-filter">
              <SelectValue placeholder="Seleccione una ciudad" />
            </SelectTrigger>
            <SelectContent>
              {cities.map(city => (
                <SelectItem key={city} value={city}>
                  {city === 'all' ? 'Todas las ciudades' : city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {currentLocations.length > 0 ? (
        <div className="space-y-4">
          {currentLocations.map((location) => (
            <ListingCard
              key={location.id}
              href={`/places/${location.id}`}
              logoSrc={location.image}
              logoAlt={location.name}
              name={location.name}
              subtitle={location.category}
              rating={averageRating(location)}
              reviewCount={location.reviews?.length || 0}
              description={location.description}
              metaPrimary={location.priceRange === 'free' ? 'Gratis' : location.priceRange}
              metaSecondary={location.location.city}
              featured={location.isFeatured}
              imageFit="cover"
              quickLinks={[{ label: 'Ver Detalles', href: `/places/${location.id}` }]}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron lugares que coincidan con su búsqueda.</p>
          </CardContent>
        </Card>
      )}

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
