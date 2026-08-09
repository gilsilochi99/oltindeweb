'use client';

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination } from "@/components/shared/Pagination";
import type { CompanyService } from "@/lib/types";
import {
  Briefcase, HardHat, Stethoscope, UtensilsCrossed, Laptop, Scale, Truck,
  GraduationCap, Sparkles, Landmark, SprayCan, ShieldCheck, Home, Car, Megaphone,
} from "lucide-react";

const ITEMS_PER_PAGE = 10;

// Best-effort icon per category, matched by keyword since categories are
// free text (no admin-configurable icon field on Service) — falls back to a
// generic briefcase icon when nothing matches.
function getServiceIcon(category: string) {
  const c = category.toLowerCase();
  if (/constru|obra|arquitect/.test(c)) return HardHat;
  if (/salud|médic|medic|clínic|clinic|hospital|dental/.test(c)) return Stethoscope;
  if (/restaurant|comida|gastronom|catering/.test(c)) return UtensilsCrossed;
  if (/tecnolog|software|inform|digital|web/.test(c)) return Laptop;
  if (/legal|abogad|jurídic|juridic/.test(c)) return Scale;
  if (/transport|logístic|logistic|envío|envio/.test(c)) return Truck;
  if (/educa|formaci|academia|escuela/.test(c)) return GraduationCap;
  if (/bellez|estétic|estetic|peluquer|spa/.test(c)) return Sparkles;
  if (/financ|banc|seguro|contabl/.test(c)) return Landmark;
  if (/limpieza/.test(c)) return SprayCan;
  if (/segur/.test(c)) return ShieldCheck;
  if (/hogar|mueble|decorac/.test(c)) return Home;
  if (/automó|automo|taller|mecánic|mecanic|vehículo|vehiculo/.test(c)) return Car;
  if (/marketing|public|diseñ|diseno/.test(c)) return Megaphone;
  return Briefcase;
}

const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');

interface ServicesPageClientProps {
  allServices: CompanyService[];
}

export function ServicesPageClient({ allServices }: ServicesPageClientProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(() => {
    return Array.from(new Set(allServices.map(s => s.category).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [allServices]);

  const filteredServices = useMemo(() => {
    return allServices
      .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .filter(s => selectedCategory === 'all' || s.category === selectedCategory)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allServices, searchQuery, selectedCategory]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory]);

  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const currentServices = filteredServices.slice(
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
        <h1 className="text-4xl font-bold font-headline">Directorio de Servicios</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Encuentre servicios profesionales ofrecidos por empresas locales.</p>
      </section>

      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>Servicios ({filteredServices.length})</CardTitle>
              <CardDescription>Todos los servicios registrados en Oltinde y cuántas empresas los ofrecen.</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar servicio..."
                  className="pl-9 sm:w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="sm:w-48">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentServices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead className="text-center">Empresas</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentServices.map((item) => {
                    const Icon = getServiceIcon(item.category);
                    return (
                      <TableRow
                        key={item.service.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => router.push(`/services/${createSlug(item.name)}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className="bg-primary/10 p-1.5 rounded-md shrink-0">
                              <Icon className="w-4 h-4 text-black" />
                            </div>
                            {item.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{item.category}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={item.companies.length > 0 ? "secondary" : "outline"} className="gap-1.5">
                            <Building2 className="w-3 h-3" />
                            {item.companies.length}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
              <p>No se encontraron servicios que coincidan con su búsqueda.</p>
            </div>
          )}

          {totalPages > 1 && (
            <div className="pt-6 mt-6 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
