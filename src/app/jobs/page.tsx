
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getJobPostings, getUniqueJobSectors, getUniqueCities } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { JobPosting } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { JobCard } from "@/components/shared/JobCard";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Button } from "@/components/ui/button";
import { Archive } from "lucide-react";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

function JobsPageContent() {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [allJobs, setAllJobs] = useState<JobPosting[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [sectors, setSectors] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedSector, setSelectedSector] = useState(searchParams.get('sector') || 'all');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);
  const [openOnly, setOpenOnly] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [jobs, sectorList, cityList] = await Promise.all([
        getJobPostings(),
        getUniqueJobSectors(),
        getUniqueCities(),
      ]);
      jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAllJobs(jobs);
      setSectors(['all', ...sectorList]);
      setCities(['all', ...cityList]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      <section className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold font-headline">Bolsa de Trabajo</h1>
          <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Encuentre las últimas ofertas de empleo de empresas en Guinea Ecuatorial.</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/jobs/archive"><Archive className="w-4 h-4 mr-2" /> Ver empleos archivados</Link>
        </Button>
      </section>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
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

        {isLoading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : currentJobs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
            <p>No se encontraron empleos que coincidan con su búsqueda.</p>
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

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <JobsPageContent />
    </Suspense>
  )
}
