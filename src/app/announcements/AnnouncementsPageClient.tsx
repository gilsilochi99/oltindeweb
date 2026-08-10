'use client';

import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { AnnouncementWithCompany } from "./page";
import { useSearchParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/slug";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { ArchiveShell, ArchiveHeader, ClaimListingWidget, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";
import { MobileFilterSheet } from "@/components/shared/archive/MobileFilterSheet";

const ITEMS_PER_PAGE = 10;

interface AnnouncementsPageClientProps {
  allAnnouncements: AnnouncementWithCompany[];
  categories: string[];
  companies: { id: string; name: string }[];
  initialCategory?: string;
}

// allAnnouncements/categories/companies are fetched server-side (page.tsx)
// from an already-cached data.ts source and passed in as props — no client
// fetch on mount, matching the fix applied to /companies.
export function AnnouncementsPageClient({ allAnnouncements, categories, companies, initialCategory }: AnnouncementsPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || initialCategory || 'all');
  const [selectedCompany, setSelectedCompany] = useState(searchParams.get('company') || 'all');

  const filteredAnnouncements = useMemo(() => {
    return allAnnouncements.filter(ann => {
        const matchesQuery = ann.title.toLowerCase().includes(searchQuery.toLowerCase()) || ann.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || ann.companyCategory === selectedCategory;
        const matchesCompany = selectedCompany === 'all' || ann.companyId === selectedCompany;
        return matchesQuery && matchesCategory && matchesCompany;
    });
  }, [allAnnouncements, searchQuery, selectedCategory, selectedCompany]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedCompany]);

  const totalPages = Math.ceil(filteredAnnouncements.length / ITEMS_PER_PAGE);
  const currentAnnouncements = filteredAnnouncements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => allAnnouncements
    .slice(0, 3)
    .map(a => ({
      id: a.id,
      href: `/announcements/${a.id}`,
      name: a.title,
      subtitle: a.companyName,
    })), [allAnnouncements]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Anuncios Recientes" items={featuredItems} />
          <ClaimListingWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Anuncios"
        title="Anuncios de Empresas"
        description="Descubra las últimas noticias y actualizaciones de las empresas locales."
        resultCount={filteredAnnouncements.length}
        pageStart={filteredAnnouncements.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredAnnouncements.length)}
      />

      {(() => {
        const filterControls = (
          <>
            <div className="space-y-2">
              <Label htmlFor="search-announcements">Buscar Anuncio</Label>
               <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      id="search-announcements"
                      placeholder="Ej: Nuevos horarios..."
                      className="pl-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-filter">Filtrar por Categoría</Label>
              <Select value={selectedCategory} onValueChange={(value) => router.push(value === 'all' ? '/announcements' : `/announcements/category/${slugify(value)}`)}>
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
          </>
        );
        const activeCount = [selectedCategory !== 'all', selectedCompany !== 'all', searchQuery !== ''].filter(Boolean).length;
        return (
          <>
            <div className="hidden md:grid md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">{filterControls}</div>
            <MobileFilterSheet activeCount={activeCount}>{filterControls}</MobileFilterSheet>
          </>
        );
      })()}

      {currentAnnouncements.length > 0 ? (
          <div className="space-y-4">
              {currentAnnouncements.map((ann) => (
                  <ListingCard
                      key={ann.id}
                      href={`/announcements/${ann.id}`}
                      logoSrc={ann.image || ann.companyLogo}
                      logoAlt={ann.image ? ann.title : `${ann.companyName} logo`}
                      imageFit={ann.image ? 'cover' : 'contain'}
                      name={ann.title}
                      subtitle={ann.companyName}
                      metaPrimary={new Date(ann.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      quickLinks={[
                          { label: 'Ver Empresa', href: `/companies/${ann.companyId}` },
                          { label: 'Ver Anuncio', href: `/announcements/${ann.id}` },
                      ]}
                  />
              ))}
          </div>
      ) : (
          <Card>
            <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                <p>No se encontraron anuncios que coincidan con su búsqueda.</p>
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
