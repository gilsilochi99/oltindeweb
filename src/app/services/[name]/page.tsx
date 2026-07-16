

import { getServiceBySlug, getServices } from "@/lib/data";
import { notFound } from "next/navigation";
import { Briefcase, Building } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata, ResolvingMetadata } from 'next';
import { ProvidersList } from "./_components/ProvidersList";

type Props = {
  params: Promise<{ name: string }>
}

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { name } = await params;
  const serviceSlug = decodeURIComponent(name);
  const serviceInfo = await getServiceBySlug(serviceSlug);

  if (!serviceInfo) {
    return {
      title: 'Servicio no encontrado'
    }
  }
 
  return {
    title: serviceInfo.name,
    description: `Encuentre empresas que ofrecen servicios de ${serviceInfo.name.toLowerCase()} en Guinea Ecuatorial. Conecte con proveedores locales en Oltinde.`,
  }
}

export async function generateStaticParams() {
    const services = await getServices();
    const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');
    return services.map((service) => ({
      name: createSlug(service.name),
    }));
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ name: string }> }) {
  // URL-decode the service name from the params
  const { name } = await params;
  const serviceSlug = decodeURIComponent(name);
  const serviceInfo = await getServiceBySlug(serviceSlug);

  if (!serviceInfo) {
    notFound();
  }

  // Filter branches to only those that offer the service
  const providers = serviceInfo.companies.map(company => ({
    ...company,
    branches: company.branches.filter(branch => branch.servicesOffered?.includes(serviceInfo.service.id)),
  })).filter(company => company.branches.length > 0);


  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="p-6 md:p-8">
          <section className="flex items-start gap-6">
            <div className="flex-shrink-0 w-16 h-16 bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-black" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold font-headline">{serviceInfo.name}</h1>
              <p className="text-lg text-muted-foreground mt-1">
                Encuentre empresas y sucursales que ofrecen servicios de {serviceInfo.name.toLowerCase()}.
              </p>
            </div>
          </section>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5"/>
            Proveedores ({providers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
            <ProvidersList providers={providers} />
        </CardContent>
      </Card>
    </div>
  );
}
