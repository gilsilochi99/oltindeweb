'use client';

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import { Card, CardContent } from "@/components/ui/card";
import type { OfferWithCompany } from "./page";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

interface OffersPageClientProps {
  allOffers: OfferWithCompany[];
  categories: string[];
  companies: { id: string; name: string }[];
}

export function OffersPageClient({ allOffers, categories, companies }: OffersPageClientProps) {
  const searchParams = useSearchParams();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company') || 'all');

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

  const featuredItems = useMemo(() => allOffers
    .slice(0, 3)
    .map(o => ({
      id: o.id,
      href: `/offers/${o.id}`,
      name: o.title,
      subtitle: o.companyName,
      metaPrimary: o.discount,
    })), [allOffers]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Ofertas Recientes" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Ofertas"
        title="Ofertas y Descuentos"
        description="Aproveche las mejores promociones de las empresas de Guinea Ecuatorial."
        resultCount={filteredOffers.length}
        pageStart={filteredOffers.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredOffers.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
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

      {currentOffers.length > 0 ? (
          <div className="space-y-4">
              {currentOffers.map((offer) => (
                  <ListingCard
                      key={offer.id}
                      href={`/offers/${offer.id}`}
                      logoSrc={offer.image || offer.companyLogo}
                      logoAlt={offer.image ? offer.title : `${offer.companyName} logo`}
                      imageFit={offer.image ? 'cover' : 'contain'}
                      name={offer.title}
                      subtitle={offer.companyName}
                      metaPrimary={offer.discount}
                      metaSecondary={`Válido hasta ${new Date(offer.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      quickLinks={[
                          { label: 'Ver Empresa', href: `/companies/${offer.companyId}` },
                          { label: 'Ver Oferta', href: `/offers/${offer.id}` },
                      ]}
                  />
              ))}
          </div>
      ) : (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                <p>No se encontraron ofertas que coincidan con su búsqueda.</p>
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
