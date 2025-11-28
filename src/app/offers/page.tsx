
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getCompanies } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Company, Offer } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { OfferCard } from "@/components/shared/OfferCard";


const ITEMS_PER_PAGE = 10;

export interface OfferWithCompany extends Offer {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}

function OffersPageContent() {
  const searchParams = useSearchParams();
  const [allOffers, setAllOffers] = useState<OfferWithCompany[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company') || 'all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const companiesData = await getCompanies();
      const offers: OfferWithCompany[] = [];
      const categorySet = new Set<string>();
      const companiesWithOffers = new Map<string, string>();

      companiesData.forEach(company => {
        if (company.offers && company.offers.length > 0) {
            categorySet.add(company.category);
            companiesWithOffers.set(company.id, company.name);
            company.offers.forEach(offer => {
                offers.push({
                    ...offer,
                    companyName: company.name,
                    companyId: company.id,
                    companyCategory: company.category,
                    companyLogo: company.logo,
                });
            });
        }
      });

      offers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAllOffers(offers);
      setCategories(['all', ...Array.from(categorySet)]);
      setCompanies([{id: 'all', name: 'Todas las Empresas'}, ...Array.from(companiesWithOffers.entries()).map(([id, name]) => ({ id, name }))]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredOffers = useMemo(() => {
    return allOffers.filter(offer => {
        const matchesQuery = offer.title.toLowerCase().includes(searchQuery.toLowerCase()) || offer.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || offer.companyCategory === selectedCategory;
        const matchesCompany = selectedCompany === 'all' || offer.companyId === selectedCompany;
        return matchesQuery && matchesCategory && matchesCompany;
    });
  }, [allOffers, searchQuery, selectedCategory, selectedCompany]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCompany]);

  const totalPages = Math.ceil(filteredOffers.length / ITEMS_PER_PAGE);
  const currentOffers = filteredOffers.slice(
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
        <h1 className="text-4xl font-bold font-headline">Ofertas y Descuentos</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Aproveche las mejores promociones de las empresas de Guinea Ecuatorial.</p>
      </section>

      <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <Label htmlFor="search-offers">Buscar Oferta</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="search-offers"
                      placeholder="Ej: Descuento en construcción..."
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
                <Label htmlFor="company-filter">Filtrar por Empresa</Label>
                <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                    <SelectTrigger id="company-filter">
                        <SelectValue placeholder="Seleccione una empresa"/>
                    </SelectTrigger>
                    <SelectContent>
                        {companies.map(company => (
                            <SelectItem key={company.id} value={company.id}>
                                {company.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>
          </div>

          {isLoading ? (
              <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : currentOffers.length > 0 ? (
              <div className="space-y-6">
                  {currentOffers.map((offer) => (
                      <OfferCard key={offer.id} offer={offer} />
                  ))}
              </div>
          ) : (
              <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                  <p>No se encontraron ofertas que coincidan con su búsqueda.</p>
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

export default function OffersPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <OffersPageContent />
        </Suspense>
    )
}
