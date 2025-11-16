'use client';

import { useEffect, useState, useMemo, Suspense } from "react";
import { getServicesByCompany } from "@/lib/data";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { CompanyService } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Briefcase } from "lucide-react";

function ServicesPageContent() {
  const [allServices, setAllServices] = useState<CompanyService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const servicesData = await getServicesByCompany();
      setAllServices(servicesData);
      setIsLoading(false);
    }
    fetchData();
  }, []);
  
  const groupedServices = useMemo(() => {
    const groups: { [key: string]: CompanyService[] } = {};
    allServices.forEach(service => {
        if (!groups[service.category]) {
            groups[service.category] = [];
        }
        groups[service.category].push(service);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allServices]);
  
  const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');


  if (isLoading) {
    return (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-4xl font-bold font-headline">Directorio de Servicios</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-3xl">Encuentre servicios profesionales ofrecidos por empresas locales.</p>
      </section>

      {groupedServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {groupedServices.map(([category, services]) => (
                <Card key={category}>
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger className="p-6 text-xl font-bold font-headline hover:no-underline">
                               <div className="flex items-center gap-3">
                                 <Briefcase className="w-6 h-6 text-primary"/>
                                 {category} ({services.length})
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-6 pb-6">
                                <div className="space-y-2">
                                    {services.map((service) => (
                                        <div key={service.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted">
                                            <span className="font-medium text-sm">{service.name} ({service.companies.length})</span>
                                            <Button asChild variant="secondary" size="sm">
                                                <Link href={`/services/${createSlug(service.name)}`}>Ver</Link>
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </Card>
            ))}
          </div>
      ) : (
        <Card>
            <CardContent className="text-center py-16 text-muted-foreground border-2 border-dashed">
                <p>No hay servicios disponibles en este momento.</p>
            </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function ServicesPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <ServicesPageContent />
        </Suspense>
    )
}
