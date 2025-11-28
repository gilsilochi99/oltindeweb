
'use client';

import { getCompanies, getServices, getUniqueCategories, getUniqueCities } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VerificationSwitch } from "./_components/VerificationSwitch";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Loader2, MoreHorizontal, PlusCircle, Star } from "lucide-react";
import Link from "next/link";
import { FeaturedSwitch } from "./_components/FeaturedSwitch";
import { useCallback, useEffect, useState, useMemo } from "react";
import type { Company, Service, CategoryUsage } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CompanyForm } from "@/components/shared/CompanyForm";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryUsage[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [companiesData, servicesData, citiesData] = await Promise.all([
        getCompanies(),
        getServices(),
        getUniqueCities(),
      ]);
      const uniqueCategories = [...new Set(servicesData.map(s => s.category))].map(name => ({
          name,
          companyCount: 0,
          institutionCount: 0,
          procedureCount: 0,
      }));

      setCompanies(companiesData);
      setServices(servicesData);
      setCategories(uniqueCategories);
      setCities(citiesData);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredCompanies = useMemo(() => {
    return companies.filter(company =>
      company.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companies, searchQuery]);

  const handleFormSubmit = () => {
    setIsFormOpen(false);
    fetchData();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-headline">Gestionar Empresas</h1>
          <p className="text-muted-foreground">Verificar, editar o eliminar listados de empresas.</p>
        </div>
        <Button onClick={() => setIsFormOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Añadir Empresa
        </Button>
      </div>
      <Card>
        <CardHeader>
            <div className="flex justify-between items-center">
                <div>
                    <CardTitle>Todas las Empresas ({filteredCompanies.length})</CardTitle>
                    <CardDescription>A continuación se muestran todas las empresas en la plataforma.</CardDescription>
                </div>
                <Input
                    placeholder="Buscar por nombre..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-center">Destacado</TableHead>
                  <TableHead className="text-center">Verificado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>{company.category}</TableCell>
                    <TableCell>
                      {company.isVerified ? (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">Verificado</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-yellow-100 text-yellow-800">No Verificado</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <FeaturedSwitch companyId={company.id} isFeatured={company.isFeatured || false} />
                    </TableCell>
                    <TableCell className="text-center">
                      <VerificationSwitch companyId={company.id} isVerified={company.isVerified} />
                    </TableCell>
                    <TableCell className="text-right">
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Abrir menú</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/edit/${company.id}`}>Editar Empresa</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/${company.id}/documents`}>Gestionar Documentos</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/${company.id}/announcements`}>Gestionar Anuncios</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                               <Link href={`/dashboard/${company.id}/offers`}>Gestionar Ofertas</Link>
                            </DropdownMenuItem>
                             <DropdownMenuItem asChild>
                                <Link href={`/companies/${company.id}`} target="_blank">
                                    Ver Perfil Público <ExternalLink className="ml-2 h-3 w-3" />
                                </Link>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Añadir Nueva Empresa</DialogTitle>
            <DialogDescription>
              Complete el siguiente formulario para registrar una nueva empresa en el directorio. No se le asignará un propietario.
            </DialogDescription>
          </DialogHeader>
          <CompanyForm
            type="Create"
            categories={categories}
            services={services}
            cities={cities}
            onFormSubmit={handleFormSubmit}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
