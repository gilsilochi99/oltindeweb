'use client';

import { useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Company, Institution } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Map } from "lucide-react";
import { hasValidCoordinates, MALABO_COORDS } from "@/lib/map-utils";
import { DynamicDirectoryMap } from "@/components/shared/DynamicDirectoryMap";
import type { DirectoryMapMarker } from "@/components/shared/DirectoryMap";
import { useCityPreference } from "@/hooks/use-city-preference";

interface MapPageClientProps {
  companies: Company[];
  institutions: Institution[];
  categories: string[];
}

export function MapPageClient({ companies, institutions, categories }: MapPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { city: preferredCity } = useCityPreference();

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const selectedCity = searchParams.get('city') || preferredCity;

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== 'all') {
      params.set('category', value);
    } else {
      params.delete('category');
    }
    router.replace(`/map?${params.toString()}`);
  };

  const markers = useMemo<DirectoryMapMarker[]>(() => {
    const companyMarkers: DirectoryMapMarker[] = companies
      .filter(c => (selectedCategory === 'all' || c.category === selectedCategory)
        && (selectedCity === 'all' || c.branches?.some(b => b.location.city === selectedCity)))
      .flatMap(c => (c.branches || [])
        .filter(b => hasValidCoordinates(b.location) && (selectedCity === 'all' || b.location.city === selectedCity))
        .map(b => ({
          id: c.id,
          name: c.name,
          category: c.category,
          type: 'company' as const,
          branchName: b.name,
          lat: b.location.lat,
          lng: b.location.lng,
        })));

    const institutionMarkers: DirectoryMapMarker[] = institutions
      .filter(i => (selectedCategory === 'all' || i.category === selectedCategory)
        && (selectedCity === 'all' || i.branches?.some(b => b.location.city === selectedCity)))
      .flatMap(i => (i.branches || [])
        .filter(b => hasValidCoordinates(b.location) && (selectedCity === 'all' || b.location.city === selectedCity))
        .map(b => ({
          id: i.id,
          name: i.name,
          category: i.category,
          type: 'institution' as const,
          branchName: b.name,
          lat: b.location.lat,
          lng: b.location.lng,
        })));

    return [...companyMarkers, ...institutionMarkers];
  }, [companies, institutions, selectedCategory, selectedCity]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center gap-2">
        <Map className="w-12 h-12 text-black" />
        <h1 className="text-4xl font-bold font-headline tracking-tighter">Mapa Interactivo</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Explore la ubicación de empresas e instituciones en Guinea Ecuatorial.
        </p>
      </div>

      <div className="flex justify-center">
        <Select value={selectedCategory} onValueChange={handleCategoryChange}>
          <SelectTrigger className="bg-background w-full max-w-xs">
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

      <Card>
        <CardContent className="p-4 md:p-6">
          <DynamicDirectoryMap
            markers={markers}
            height="600px"
            defaultCenter={MALABO_COORDS}
            defaultZoom={8}
            cluster
          />
          {markers.length === 0 && (
            <p className="text-center text-muted-foreground mt-4">
              No hay ubicaciones que coincidan con su búsqueda.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
