
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getEvents, getUniqueEventCategories, getUniqueCities } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { CalendarEvent } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { EventCard } from "@/components/shared/EventCard";
import { useCityPreference } from "@/hooks/use-city-preference";

const ITEMS_PER_PAGE = 10;

function EventsPageContent() {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [allEvents, setAllEvents] = useState<CalendarEvent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [events, categoryList, cityList] = await Promise.all([
        getEvents(),
        getUniqueEventCategories(),
        getUniqueCities(),
      ]);
      const upcoming = events
        .filter(e => e.status === 'scheduled' && new Date(e.startDate).getTime() >= Date.now() - 24 * 60 * 60 * 1000)
        .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      setAllEvents(upcoming);
      setCategories(['all', ...categoryList]);
      setCities(['all', ...cityList]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline">Calendario de Eventos</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Descubra ferias, conferencias y eventos organizados por empresas e instituciones en Guinea Ecuatorial.</p>
      </section>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : currentEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No se encontraron eventos que coincidan con su búsqueda.</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pt-6 border-t">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <EventsPageContent />
    </Suspense>
  )
}
