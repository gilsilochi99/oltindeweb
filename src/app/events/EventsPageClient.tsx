'use client';

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { CalendarEvent } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";
import placeholderImages from '@/lib/placeholder-images.json';

const ITEMS_PER_PAGE = 10;

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

interface EventsPageClientProps {
  allEvents: CalendarEvent[];
  categories: string[];
  cities: string[];
  initialCategory?: string;
}

export function EventsPageClient({ allEvents, categories, cities, initialCategory }: EventsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { city: preferredCity } = useCityPreference();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || initialCategory || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(event => {
      const matchesQuery = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || event.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || event.city === selectedCity;
      return matchesQuery && matchesCategory && matchesCity;
    });
  }, [allEvents, searchQuery, selectedCategory, selectedCity]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCity]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const currentEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allEvents
    .slice(0, 3)
    .map(e => ({
      id: e.id,
      href: `/events/${e.id}`,
      name: e.title,
      subtitle: `${e.organizerName} · ${e.city}`,
      metaPrimary: formatEventDate(e.startDate),
    })), [allEvents]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Próximos Eventos" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Eventos"
        title="Calendario de Eventos"
        description="Descubra ferias, conferencias y eventos organizados por empresas e instituciones en Guinea Ecuatorial."
        resultCount={filteredEvents.length}
        pageStart={filteredEvents.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredEvents.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-events">Buscar Evento</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-events"
              placeholder="Ej: Feria, Conferencia..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-filter">Categoría</Label>
          <Select value={selectedCategory} onValueChange={(value) => router.push(value === 'all' ? '/events' : `/events/category/${slugify(value)}`)}>
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

      {currentEvents.length > 0 ? (
        <div className="space-y-4">
          {currentEvents.map((event) => (
            <ListingCard
              key={event.id}
              href={`/events/${event.id}`}
              logoSrc={event.organizerLogo || placeholderImages.logo.src}
              logoAlt={`${event.organizerName} logo`}
              name={event.title}
              subtitle={`${event.organizerName} · ${event.category}`}
              metaPrimary={formatEventDate(event.startDate)}
              metaSecondary={event.city}
              quickLinks={[
                { label: 'Ver Organizador', href: event.organizerType === 'company' ? `/companies/${event.organizerId}` : `/institutions/${event.organizerId}` },
                { label: 'Ver Detalles', href: `/events/${event.id}` },
              ]}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron eventos que coincidan con su búsqueda.</p>
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
