

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from 'next/link';
import { Star, Building, Briefcase, Loader2, Landmark, Bell } from 'lucide-react';
import { getCompanyById, getProcedureById, getInstitutionById } from '@/lib/data';
import type { Company, Procedure, Institution } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

function EmptyFavorites() {
    return (
        <div className="text-center py-16 px-4 border-2 border-dashed">
            <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-muted-foreground">No tiene favoritos guardados</h3>
            <p className="text-muted-foreground mt-2">
                Haga clic en el icono de estrella <Star className="w-4 h-4 inline-block text-accent fill-accent" /> en cualquier empresa, trámite o institución para guardarlo aquí.
            </p>
            <Button asChild className="mt-6">
                <Link href="/">Explorar ahora</Link>
            </Button>
        </div>
    )
}

export default function FavoritesPage() {
  const { favorites, subscriptions, user, loading: authLoading } = useAuth();
  const [favoriteCompanies, setFavoriteCompanies] = useState<Company[]>([]);
  const [favoriteProcedures, setFavoriteProcedures] = useState<Procedure[]>([]);
  const [favoriteInstitutions, setFavoriteInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
        setIsLoading(false);
        return;
    };

    async function fetchFavorites() {
      setIsLoading(true);
      
      const companyPromises = favorites.companies.map(id => getCompanyById(id));
      const procedurePromises = favorites.procedures.map(id => getProcedureById(id));
      const institutionPromises = favorites.institutions.map(id => getInstitutionById(id));
      
      const [companies, procedures, institutions] = await Promise.all([
        Promise.all(companyPromises),
        Promise.all(procedurePromises),
        Promise.all(institutionPromises),
      ]);


      setFavoriteCompanies(companies.filter(Boolean) as Company[]);
      setFavoriteProcedures(procedures.filter(Boolean) as Procedure[]);
      setFavoriteInstitutions(institutions.filter(Boolean) as Institution[]);
      setIsLoading(false);
    }

    fetchFavorites();
  }, [favorites, user, authLoading]);

  const hasFavorites = favoriteCompanies.length > 0 || favoriteProcedures.length > 0 || favoriteInstitutions.length > 0;
  const hasSubscriptions = subscriptions.companies.length > 0 || subscriptions.categories.length > 0;

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-start text-left gap-2">
        <h1 className="text-4xl font-bold font-headline tracking-tighter">Mis Favoritos y Notificaciones</h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Acceso rápido a su contenido guardado y gestión de sus suscripciones.
        </p>
      </div>

      <Tabs defaultValue="favorites" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="favorites"><Star className="w-4 h-4 mr-2" />Favoritos</TabsTrigger>
            <TabsTrigger value="subscriptions"><Bell className="w-4 h-4 mr-2" />Suscripciones</TabsTrigger>
        </TabsList>
        <TabsContent value="favorites" className="mt-6">
            {!hasFavorites && !isLoading ? (
                <Card className="p-6">
                    <EmptyFavorites />
                </Card>
            ) : (
                <Accordion type="multiple" className="w-full space-y-4" defaultValue={['companies', 'procedures', 'institutions']}>
                    <Card>
                        <AccordionItem value="companies" className="border-b-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                               <div className="flex items-center gap-3">
                                    <Building className="w-5 h-5 text-primary" />
                                    Empresas ({favoriteCompanies.length})
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {favoriteCompanies.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        {favoriteCompanies.map(company => (
                                            <Card key={company.id}>
                                                <CardHeader>
                                                    <CardTitle className="text-base">{company.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{company.description}</p>
                                                    <Button asChild variant="secondary" className="mt-4">
                                                        <Link href={`/companies/${company.id}`}>Ver Perfil</Link>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-muted-foreground pt-6 border-t">No hay empresas en favoritos.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                    <Card>
                         <AccordionItem value="procedures" className="border-b-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                                 <div className="flex items-center gap-3">
                                     <Briefcase className="w-5 h-5 text-primary" />
                                    Trámites ({favoriteProcedures.length})
                                 </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {favoriteProcedures.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        {favoriteProcedures.map(procedure => (
                                            <Card key={procedure.id}>
                                                <CardHeader>
                                                    <CardTitle className="text-base">{procedure.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{procedure.description}</p>
                                                    <Button asChild variant="secondary" className="mt-4">
                                                        <Link href={`/procedures/${procedure.id}`}>Ver Trámite</Link>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-muted-foreground pt-6 border-t">No hay trámites en favoritos.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                    <Card>
                        <AccordionItem value="institutions" className="border-b-0">
                            <AccordionTrigger className="p-6 text-lg font-semibold hover:no-underline">
                                <div className="flex items-center gap-3">
                                    <Landmark className="w-5 h-5 text-primary" />
                                    Instituciones ({favoriteInstitutions.length})
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                {favoriteInstitutions.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                        {favoriteInstitutions.map(institution => (
                                            <Card key={institution.id}>
                                                <CardHeader>
                                                    <CardTitle className="text-base">{institution.name}</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <p className="text-sm text-muted-foreground line-clamp-2">{institution.description}</p>
                                                    <Button asChild variant="secondary" className="mt-4">
                                                        <Link href={`/institutions/${institution.id}`}>Ver Institución</Link>
                                                    </Button>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                ) : <p className="text-center text-muted-foreground pt-6 border-t">No hay instituciones en favoritos.</p>}
                            </AccordionContent>
                        </AccordionItem>
                    </Card>
                </Accordion>
            )}
        </TabsContent>
        <TabsContent value="subscriptions" className="mt-6">
            <Card>
                <CardHeader>
                    <CardTitle>Gestionar Suscripciones</CardTitle>
                    <CardDescription>Próximamente podrá ver y gestionar aquí todas sus suscripciones a empresas y categorías.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <div className="text-center text-muted-foreground py-16 border-2 border-dashed">
                        <Bell className="w-12 h-12 mx-auto mb-4" />
                        <p>La gestión de suscripciones y el centro de notificaciones estarán disponibles aquí pronto.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
