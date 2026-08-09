'use client';

import { useEffect, useState, useMemo } from "react";
import type { Procedure, Institution } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcedureListingCard } from "@/components/shared/archive/ProcedureListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

interface ProceduresPageClientProps {
  allProcedures: Procedure[];
  categories: string[];
  institutions: Institution[];
}

export function ProceduresPageClient({ allProcedures, categories, institutions }: ProceduresPageClientProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedInstitution, setSelectedInstitution] = useState(searchParams.get('institution') || 'all');

  const filteredProcedures = useMemo(() => {
    return allProcedures.filter(procedure => {
        const matchesQuery = procedure.name.toLowerCase().includes(searchQuery.toLowerCase()) || procedure.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || procedure.category === selectedCategory;
        const matchesInstitution = selectedInstitution === 'all' || procedure.institutionId === selectedInstitution;
        return matchesQuery && matchesCategory && matchesInstitution;
    });
  }, [allProcedures, searchQuery, selectedCategory, selectedInstitution]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedInstitution]);

  const totalPages = Math.ceil(filteredProcedures.length / ITEMS_PER_PAGE);
  const currentProcedures = filteredProcedures.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allProcedures
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      href: `/procedures/${p.id}`,
      name: p.name,
      subtitle: p.institution,
      metaPrimary: p.cost,
    })), [allProcedures]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Trámites Populares" items={featuredItems} />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Trámites"
        title="Guía de Trámites"
        description="Información detallada sobre procedimientos gubernamentales, requisitos y costos."
        resultCount={filteredProcedures.length}
        pageStart={filteredProcedures.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredProcedures.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-procedures">Buscar Trámite</Label>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  id="search-procedures"
                  placeholder="Ej: Pasaporte, Creación de empresa..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
              />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="category-filter">Filtrar por Categoría</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger id="category-filter">
                  <SelectValue placeholder="Seleccione una categoría"/>
              </SelectTrigger>
              <SelectContent>
                  {categories.map(category => (
                      <SelectItem key={category} value={category}>
                          {category === 'all' ? 'Todas las Categorías' : category}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>
        </div>
         <div className="space-y-2">
          <Label htmlFor="institution-filter">Filtrar por Institución</Label>
          <Select value={selectedInstitution} onValueChange={setSelectedInstitution}>
              <SelectTrigger id="institution-filter">
                  <SelectValue placeholder="Seleccione una institución"/>
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="all">Todas las Instituciones</SelectItem>
                  {institutions.map(institution => (
                      <SelectItem key={institution.id} value={institution.id}>
                          {institution.name}
                      </SelectItem>
                  ))}
              </SelectContent>
          </Select>
        </div>
      </div>

      {currentProcedures.length > 0 ? (
          <div className="space-y-4">
              {currentProcedures.map((procedure) => (
                  <ProcedureListingCard key={procedure.id} procedure={procedure} />
              ))}
          </div>
      ) : (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                <p>No se encontraron trámites que coincidan con su búsqueda.</p>
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
