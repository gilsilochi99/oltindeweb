'use client';

import { useEffect, useState, useMemo } from "react";
import { Search, Archive } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { JobPosting } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";
import placeholderImages from '@/lib/placeholder-images.json';

const ITEMS_PER_PAGE = 10;

interface JobsPageClientProps {
  allJobs: JobPosting[];
  sectors: string[];
  cities: string[];
}

export function JobsPageClient({ allJobs, sectors, cities }: JobsPageClientProps) {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);
  const [openOnly, setOpenOnly] = useState(true);

  const filteredJobs = useMemo(() => {
    return allJobs.filter(job => {
      const matchesQuery = job.title.toLowerCase().includes(searchQuery.toLowerCase()) || job.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSector = selectedSector === 'all' || job.sector === selectedSector;
      const matchesCity = selectedCity === 'all' || job.city === selectedCity;
      const matchesStatus = !openOnly || job.status === 'open';
      return matchesQuery && matchesSector && matchesCity && matchesStatus;
    });
  }, [allJobs, searchQuery, selectedSector, selectedCity, openOnly]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSector, selectedCity, openOnly]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);
  const currentJobs = filteredJobs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allJobs
    .filter(j => j.status === 'open')
    .slice(0, 3)
    .map(j => ({
      id: j.id,
      href: `/jobs/${j.id}`,
      name: j.title,
      subtitle: `${j.companyName} · ${j.city}`,
      metaPrimary: j.employmentType,
    })), [allJobs]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Empleos Recientes" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-2">
        <ArchiveHeader
          breadcrumbLabel="Empleos"
          title="Bolsa de Trabajo"
          description="Encuentre las últimas ofertas de empleo de empresas en Guinea Ecuatorial."
          resultCount={filteredJobs.length}
          pageStart={filteredJobs.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
          pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredJobs.length)}
        />
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link href="/jobs/archive"><Archive className="w-4 h-4 mr-2" /> Ver empleos archivados</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-jobs">Buscar Empleo</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-jobs"
              placeholder="Ej: Contable, Ingeniero..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="sector-filter">Sector</Label>
          <Select value={selectedSector} onValueChange={setSelectedSector}>
            <SelectTrigger id="sector-filter">
              <SelectValue placeholder="Seleccione un sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map(sector => (
                <SelectItem key={sector} value={sector}>
                  {sector === 'all' ? 'Todos los sectores' : sector}
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
        <div className="space-y-2">
          <Label htmlFor="open-only">Solo empleos abiertos</Label>
          <div className="flex items-center h-10">
            <Switch id="open-only" checked={openOnly} onCheckedChange={setOpenOnly} />
          </div>
        </div>
      </div>

      {currentJobs.length > 0 ? (
        <div className="space-y-4">
          {currentJobs.map((job) => (
            <ListingCard
              key={job.id}
              href={`/jobs/${job.id}`}
              logoSrc={job.companyLogo || placeholderImages.logo.src}
              logoAlt={`${job.companyName} logo`}
              name={job.title}
              subtitle={`${job.companyName} · ${job.sector}`}
              metaPrimary={job.employmentType}
              metaSecondary={job.status === 'closed' ? 'Cerrado' : job.city}
              quickLinks={[
                { label: 'Ver Empresa', href: `/companies/${job.companyId}` },
                { label: 'Ver Detalles', href: `/jobs/${job.id}` },
              ]}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron empleos que coincidan con su búsqueda.</p>
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
