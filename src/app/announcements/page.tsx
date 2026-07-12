
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getCompanies } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import Link from "next/link";
import type { Company, Announcement } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AnnouncementCard } from "@/components/shared/AnnouncementCard";
import { Card } from "@/components/ui/card";

const ITEMS_PER_PAGE = 10;

export interface AnnouncementWithCompany extends Announcement {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}


function AnnouncementsPageContent() {
  const searchParams = useSearchParams();
  const [allAnnouncements, setAllAnnouncements] = useState<AnnouncementWithCompany[]>([]);
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
      const announcements: AnnouncementWithCompany[] = [];
      const categorySet = new Set<string>();
      const companiesWithAnnouncements = new Map<string, string>();

      companiesData.forEach(company => {
        if (company.announcements && company.announcements.length > 0) {
            categorySet.add(company.category);
            companiesWithAnnouncements.set(company.id, company.name);
            company.announcements.forEach(ann => {
                announcements.push({
                    ...ann,
                    companyName: company.name,
                    companyId: company.id,
                    companyCategory: company.category,
                    companyLogo: company.logo,
                });
            });
        }
      });

      // Sort announcements by most recent
      announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setAllAnnouncements(announcements);
      setCategories(['all', ...Array.from(categorySet)]);
      setCompanies([{id: 'all', name: 'Todas las Empresas'}, ...Array.from(companiesWithAnnouncements.entries()).map(([id, name]) => ({ id, name }))]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

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

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline">Anuncios de Empresas</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Descubra las últimas noticias y actualizaciones de las empresas locales.</p>
      </section>

      <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg bg-muted/50">
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
            ) : currentAnnouncements.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {currentAnnouncements.map((ann) => (
                        <AnnouncementCard key={ann.id} announcement={ann} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>No se encontraron anuncios que coincidan con su búsqueda.</p>
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

export default function AnnouncementsPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <AnnouncementsPageContent />
        </Suspense>
    )
}
