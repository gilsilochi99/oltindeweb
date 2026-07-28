
'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getCompanies, getAllMenuItems, getUniqueCities } from "@/lib/data";
import { Loader2, Search } from "lucide-react";
import { Pagination } from "@/components/shared/Pagination";
import type { Company, MenuItem } from "@/lib/types";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useCityPreference } from "@/hooks/use-city-preference";
import { Card, CardContent } from "@/components/ui/card";
import { RestaurantListingCard } from "@/components/shared/archive/RestaurantListingCard";
import { ArchiveShell, ArchiveHeader, QAWidget, FeaturedListingsWidget } from "@/components/shared/archive/ArchiveKit";

const ITEMS_PER_PAGE = 10;

function FoodPageContent() {
  const searchParams = useSearchParams();
  const { city: preferredCity } = useCityPreference();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || preferredCity);
  const [selectedFoodType, setSelectedFoodType] = useState('all');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [allCompanies, allMenuItems, cityList] = await Promise.all([
        getCompanies(),
        getAllMenuItems(),
        getUniqueCities(),
      ]);
      setCompanies(allCompanies);
      setMenuItems(allMenuItems);
      setCities(['all', ...cityList]);
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const menuItemsByCompany = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    menuItems.forEach(item => {
      if (!map.has(item.companyId)) map.set(item.companyId, []);
      map.get(item.companyId)!.push(item);
    });
    return map;
  }, [menuItems]);

  const restaurants = useMemo(() => {
    return companies
      .filter(c => (menuItemsByCompany.get(c.id) || []).length > 0)
      .map(c => ({ company: c, items: menuItemsByCompany.get(c.id) || [] }));
  }, [companies, menuItemsByCompany]);

  const foodTypes = useMemo(() => Array.from(new Set(menuItems.map(i => i.foodType).filter(Boolean))).sort(), [menuItems]);

  const filteredRestaurants = useMemo(() => {
    const filtered = restaurants.filter(({ company, items }) => {
      const matchesQuery = company.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCity = selectedCity === 'all' || company.branches?.some(b => b.location.city === selectedCity);
      const matchesFoodType = selectedFoodType === 'all' || items.some(i => i.foodType === selectedFoodType);
      return matchesQuery && matchesCity && matchesFoodType;
    });

    filtered.sort((a, b) => {
      if (a.company.isFeatured && !b.company.isFeatured) return -1;
      if (!a.company.isFeatured && b.company.isFeatured) return 1;
      return 0;
    });

    return filtered;
  }, [restaurants, searchQuery, selectedCity, selectedFoodType]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCity, selectedFoodType]);

  const totalPages = Math.ceil(filteredRestaurants.length / ITEMS_PER_PAGE);
  const currentRestaurants = filteredRestaurants.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const featuredItems = useMemo(() => restaurants
    .filter(({ company }) => company.isFeatured)
    .slice(0, 3)
    .map(({ company }) => ({
      id: company.id,
      href: `/companies/${company.id}#menu`,
      name: company.name,
      subtitle: company.branches?.[0]?.location.city,
      metaPrimary: company.branches?.[0]?.contact.phone,
    })), [restaurants]);

  return (
    <ArchiveShell
      sidebar={
        <>
          <FeaturedListingsWidget title="Restaurantes Destacados" items={featuredItems} />
          <QAWidget />
        </>
      }
    >
      <ArchiveHeader
        breadcrumbLabel="Comida a Domicilio"
        title="Pida de sus Restaurantes Favoritos"
        description="Explore menús, encuentre el Menú del Día y pida para recoger o con entrega."
        resultCount={isLoading ? undefined : filteredRestaurants.length}
        pageStart={filteredRestaurants.length > 0 ? (currentPage - 1) * ITEMS_PER_PAGE + 1 : 0}
        pageEnd={Math.min(currentPage * ITEMS_PER_PAGE, filteredRestaurants.length)}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-outline-variant rounded-sm bg-white mb-6">
        <div className="space-y-2">
          <Label htmlFor="search-food">Buscar</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search-food"
              placeholder="Nombre del restaurante..."
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
        <div className="space-y-2">
          <Label htmlFor="food-type-filter">Tipo de Comida</Label>
          <Select value={selectedFoodType} onValueChange={setSelectedFoodType}>
            <SelectTrigger id="food-type-filter">
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {foodTypes.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>
      ) : currentRestaurants.length > 0 ? (
        <div className="space-y-4">
          {currentRestaurants.map(({ company, items }) => (
            <RestaurantListingCard key={company.id} company={company} menuItems={items} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
            <p>No se encontraron restaurantes que coincidan con su búsqueda.</p>
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

export default function FoodPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <FoodPageContent />
    </Suspense>
  );
}
