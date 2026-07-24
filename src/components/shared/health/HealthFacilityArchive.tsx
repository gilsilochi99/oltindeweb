'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getHealthFacilitiesByType, getUniqueCities, getServices } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { HealthFacility, HealthFacilityType, Service } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

interface HealthFacilityArchiveProps {
  facilityType: HealthFacilityType;
  breadcrumbLabel: string;
  title: string;
  description: string;
  detailBasePath: string;
}

function HealthFacilityArchiveContent({ facilityType, breadcrumbLabel, title, description, detailBasePath }: HealthFacilityArchiveProps) {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [allFacilities, setAllFacilities] = useState<HealthFacility[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);
  const [onlyOnDuty, setOnlyOnDuty] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [facilities, cityList, serviceList] = await Promise.all([
        getHealthFacilitiesByType(facilityType),
        getUniqueCities(),
        getServices(),
      ]);
      setAllFacilities(facilities);
      setCities(['all', ...cityList]);
      setServices(serviceList);
      setIsLoading(false);
    }
    fetchData();
  }, [facilityType]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const filteredFacilities = useMemo(() => {
    const filtered = allFacilities.filter(f => {
      const matchesQuery = f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || f.branches?.some(b => b.location.city === selectedCity);
      const matchesDuty = !onlyOnDuty || (f.onDutyDates || []).includes(today);
      return matchesQuery && matchesCity && matchesDuty;
    });

    filtered.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    return filtered;
  }, [allFacilities, searchQuery, selectedCity, onlyOnDuty, today]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, onlyOnDuty]);

  const totalPages = Math.ceil(filteredFacilities.length / ITEMS_PER_PAGE);
  const currentFacilities = filteredFacilities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allFacilities
    .filter(f => f.isFeatured)
    .slice(0, 3)
    .map(f => ({
      id: f.id,
      href: `${detailBasePath}/${f.id}`,
      name: f.name,
      subtitle: f.branches?.[0]?.location.city,
      metaPrimary: f.branches?.[0]?.contact.phone,
    })), [allFacilities, detailBasePath]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Destacados" items={featuredItems} />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel={breadcrumbLabel}
        title={title}
        description={description}
        resultCount={isLoading ? undefined : filteredFacilities.length}
        pageStart={filteredFacilities.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredFacilities.length)}
      />

      <div className={`grid grid-cols-1 ${facilityType === 'pharmacy' ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6 items-end`}>
        <div className="space-y-2">
          <Label htmlFor="search-health">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-health"
              placeholder="Nombre..."
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
        {facilityType === 'pharmacy' && (
          <div className="space-y-2">
            <Label htmlFor="on-duty-filter" className="block">Guardia</Label>
            <Button
              id="on-duty-filter"
              type="button"
              variant={onlyOnDuty ? 'default' : 'outline'}
              className="w-full"
              onClick={() => setOnlyOnDuty(v => !v)}
            >
              Solo de guardia hoy
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>
      ) : currentFacilities.length > 0 ? (
        <div className="space-y-4">
          {currentFacilities.map((facility) => {
            const isOnDutyToday = facilityType === 'pharmacy' && (facility.onDutyDates || []).includes(today);
            const mainBranch = facility.branches?.[0];
            const serviceNames = facility.services?.map(id => services.find(s => s.id === id)?.name).filter(Boolean) as string[] | undefined;
            const branchNote = facility.branches?.length > 1 ? `${facility.branches.length} sucursales` : undefined;
            return (
              <ListingCard
                key={facility.id}
                href={`${detailBasePath}/${facility.id}`}
                logoSrc={facility.image}
                logoAlt={facility.name}
                name={facility.name}
                subtitle={facility.ownership === 'public' ? 'Público' : 'Privado'}
                description={facility.description}
                tags={[
                  ...(isOnDutyToday ? ['De Guardia Hoy'] : []),
                  ...(facility.emergencyServices ? ['Urgencias 24h'] : []),
                  ...(branchNote ? [branchNote] : []),
                  ...((serviceNames || []).slice(0, 3)),
                ]}
                metaSecondary={mainBranch ? `${mainBranch.location.address}, ${mainBranch.location.city}` : undefined}
                featured={facility.isFeatured}
                phone={mainBranch?.contact.phone}
                whatsapp={facility.contact?.whatsapp}
                email={mainBranch?.contact.email}
                imageFit="cover"
                quickLinks={[{ label: 'Ver Detalles', href: `${detailBasePath}/${facility.id}` }]}
              />
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron resultados que coincidan con su búsqueda.</p>
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

export function HealthFacilityArchive(props: HealthFacilityArchiveProps) {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <HealthFacilityArchiveContent {...props} />
    </Suspense>
  );
}
