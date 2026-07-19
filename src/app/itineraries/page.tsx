
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getItineraries, getUniqueCities } from "@/lib/data";
import { Loader2, Search, PlusCircle } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { Itinerary } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, QAWidget, FeaturedListingsWidget, SidebarWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

function CreateItineraryWidget() {
  return (
    <SidebarWidget>
      <div className="text-center">
        <h3 className="text-lg font-bold text-on-background">Comparta su propio itinerario</h3>
        <p className="text-xs text-secondary mt-2 mb-4">Cree un plan de viaje y compártalo con la comunidad.</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/dashboard/itineraries/new"><PlusCircle className="w-4 h-4 mr-2" />Crear Itinerario</Link>
        </Button>
      </div>
    </SidebarWidget>
  );
}

function averageRating(itinerary: Itinerary) {
  return itinerary.reviews && itinerary.reviews.length > 0
    ? itinerary.reviews.reduce((acc, r) => acc + r.rating, 0) / itinerary.reviews.length
    : 0;
}

function ItinerariesPageContent() {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [allItineraries, setAllItineraries] = useState<Itinerary[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [itineraries, cityList] = await Promise.all([
        getItineraries(),
        getUniqueCities(),
      ]);
      setAllItineraries(itineraries);
      setCities(['all', ...cityList]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredItineraries = useMemo(() => {
    const filtered = allItineraries.filter(itinerary => {
      const matchesQuery = itinerary.title.toLowerCase().includes(searchQuery.toLowerCase()) || itinerary.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || itinerary.city === selectedCity;
      return matchesQuery && matchesCity;
    });

    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    return filtered;
  }, [allItineraries, searchQuery, selectedCity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity]);

  const totalPages = Math.ceil(filteredItineraries.length / ITEMS_PER_PAGE);
  const currentItineraries = filteredItineraries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allItineraries
    .filter(i => i.isFeatured)
    .slice(0, 3)
    .map(i => ({
      id: i.id,
      href: `/itineraries/${i.id}`,
      name: i.title,
      subtitle: `Por ${i.authorName} · ${i.city}`,
    })), [allItineraries]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Itinerarios Destacados" items={featuredItems} />
          <CreateItineraryWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Itinerarios"
        title="Itinerarios Creados por Viajeros"
        description="Descubra planes de viaje compartidos por la comunidad, o cree el suyo propio."
        resultCount={isLoading ? undefined : filteredItineraries.length}
        pageStart={filteredItineraries.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredItineraries.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-itineraries">Buscar Itinerario</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-itineraries"
              placeholder="Ej: Fin de semana, aventura..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
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

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>
      ) : currentItineraries.length > 0 ? (
        <div className="space-y-4">
          {currentItineraries.map((itinerary) => (
            <ListingCard
              key={itinerary.id}
              href={`/itineraries/${itinerary.id}`}
              logoSrc={itinerary.coverImage}
              logoAlt={itinerary.title}
              name={itinerary.title}
              subtitle={`Por ${itinerary.authorName}`}
              rating={averageRating(itinerary)}
              reviewCount={itinerary.reviews?.length || 0}
              description={itinerary.description}
              tags={itinerary.theme}
              metaPrimary={`${itinerary.durationDays} día${itinerary.durationDays === 1 ? '' : 's'}`}
              metaSecondary={`${itinerary.stops.length} parada${itinerary.stops.length === 1 ? '' : 's'} · ${itinerary.city}`}
              featured={itinerary.isFeatured}
              imageFit="cover"
              quickLinks={[{ label: 'Ver Itinerario', href: `/itineraries/${itinerary.id}` }]}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron itinerarios que coincidan con su búsqueda.</p>
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

export default function ItinerariesPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ItinerariesPageContent />
    </Suspense>
  )
}
