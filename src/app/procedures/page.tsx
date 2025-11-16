
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getProcedures, getUniqueCategories, getInstitutions } from "@/lib/data";
import type { Procedure, Institution } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProcedureCard } from "@/components/shared/ProcedureCard";

const ITEMS_PER_PAGE = 9;

function ProceduresPageContent() {
  const searchParams = useSearchParams();
  const [allProcedures, setAllProcedures] = useState<Procedure[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedInstitution, setSelectedInstitution] = useState(searchParams.get('institution') || 'all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [proceduresData, categoriesData, institutionsData] = await Promise.all([
        getProcedures(),
        getUniqueCategories(),
        getInstitutions(),
      ]);
      setAllProcedures(proceduresData);
      const procedureCategories = new Set(proceduresData.map(p => p.category));
      setCategories(['all', ...categoriesData.map(c => c.name).filter(name => procedureCategories.has(name))]);
      setInstitutions(institutionsData);
      setIsLoading(false);
    }
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline">Guía de Trámites</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Información detallada sobre procedimientos gubernamentales, requisitos y costos.</p>
      </section>

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border bg-muted/50 rounded-lg">
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

          {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : currentProcedures.length > 0 ? (
              <div className="space-y-6">
                  {currentProcedures.map((procedure) => (
                      <ProcedureCard key={procedure.id} procedure={procedure} />
                  ))}
              </div>
          ) : (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No se encontraron trámites que coincidan con su búsqueda.</p>
              </div>
          )}
         

          {totalPages > 1 && !isLoading && (
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

export default function ProceduresPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <ProceduresPageContent />
        </Suspense>
    )
}
