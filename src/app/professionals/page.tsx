'use client';

import { getProfessionals, getServices, getUniqueCities } from "@/lib/data";
import { Pagination } from "@/components/shared/Pagination";
import { useEffect, useState, useMemo, Suspense } from "react";
import type { Professional, Service } from "@/lib/types";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ListingCardSkeleton } from "@/components/shared/archive/ListingCardSkeleton";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCityPreference } from "@/hooks/use-city-preference";
import { ArchiveShell, ArchiveHeader, SidebarWidget, QAWidget } from "@/components/shared/archive/ArchiveKit";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const ITEMS_PER_PAGE = 10;

function averageRating(professional: Professional) {
  return professional.reviews && professional.reviews.length > 0
    ? professional.reviews.reduce((acc, r) => acc + r.rating, 0) / professional.reviews.length
    : 0;
}

function BecomeProfessionalWidget() {
  return (
    <SidebarWidget>
      <div className="text-center">
        <h3 className="text-lg font-bold text-on-background">
          Publique su <span className="text-black underline decoration-2">perfil gratis</span>
        </h3>
        <p className="text-xs text-secondary mt-2 mb-4">Ofrezca sus servicios y sea descubierto por miles de clientes potenciales.</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/dashboard/professional">Publicar mi Perfil</Link>
        </Button>
      </div>
    </SidebarWidget>
  );
}

function ProfessionalsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allProfessionals, setAllProfessionals] = useState<Professional[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const { city: preferredCity } = useCityPreference();
  const selectedCity = searchParams.get('city') || preferredCity;

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [professionalsData, servicesData] = await Promise.all([
        getProfessionals(),
        getServices(),
      ]);
      setAllProfessionals(professionalsData);
      const uniqueCategories = [...new Set(servicesData.map((s: Service) => s.category))];
      setCategories(['all', ...uniqueCategories]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const filteredProfessionals = useMemo(() => {
    const filtered = allProfessionals.filter(professional => {
      const matchesCategory = selectedCategory === 'all' || professional.category === selectedCategory;
      const matchesCity = selectedCity === 'all' || professional.city === selectedCity;
      return matchesCategory && matchesCity;
    });

    filtered.sort((a, b) => {
      if (a.isVerified && !b.isVerified) return -1;
      if (!a.isVerified && b.isVerified) return 1;
      return 0;
    });

    return filtered;
  }, [allProfessionals, selectedCategory, selectedCity]);

  const totalPages = Math.ceil(filteredProfessionals.length / ITEMS_PER_PAGE);
  const currentProfessionals = filteredProfessionals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    if (selectedCategory && selectedCategory !== 'all') {
      params.set('category', selectedCategory);
    } else {
      params.delete('category');
    }
    router.replace(`/professionals?${params.toString()}`);
  }, [selectedCategory, router, searchParams]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  return (
    <ArchiveShell
      sidebar={
        <>
          <BecomeProfessionalWidget />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Profesionales"
        title="Encuentre Profesionales Independientes"
        description="Electricistas, diseñadores, técnicos y otros profesionales listos para ayudarle. Filtre por categoría y ciudad para encontrar el más adecuado."
        resultCount={isLoading ? undefined : filteredProfessionals.length}
        pageStart={filteredProfessionals.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredProfessionals.length)}
      />

      <div className="grid grid-cols-1 mb-6">
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Categoría" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(category => (
              <SelectItem key={category} value={category}>
                {category === 'all' ? 'Todas las categorías' : category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : (
        <div className="space-y-4">
          {currentProfessionals.length > 0 ? (
            currentProfessionals.map((professional) => (
              <ListingCard
                key={professional.id}
                href={`/professionals/${professional.id}`}
                logoSrc={professional.photo}
                logoAlt={professional.displayName}
                name={professional.displayName}
                subtitle={professional.title}
                metaPrimary={professional.city}
                metaSecondary={professional.availability}
                verified={professional.isVerified}
                rating={professional.reviews.length > 0 ? averageRating(professional) : undefined}
                reviewCount={professional.reviews.length}
                phone={professional.contact.phone}
                whatsapp={professional.contact.whatsapp}
                email={professional.contact.email}
                imageFit="cover"
              />
            ))
          ) : (
            <Card>
              <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                <p>No se encontraron profesionales que coincidan con su búsqueda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {totalPages > 1 && !isLoading && (
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

export default function ProfessionalsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ProfessionalsPageContent />
    </Suspense>
  )
}
