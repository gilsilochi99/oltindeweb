

import { getServiceBySlug, getServices } from "@/lib/data";
import { notFound } from "next/navigation";
import { Briefcase, Building, MapPin, Layers, UserPlus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from 'next';
import { ProvidersList } from "./_components/ProvidersList";
import { DetailShell, SidebarCard } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";

type Props = {
  params: Promise<{ name: string }>
}

const createSlug = (name: string) => name.toLowerCase().replace(/ /g, '-');

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

  const cities = Array.from(new Set(providers.flatMap(p => p.branches.map(b => b.location.city)))).filter(Boolean);

  const allServices = await getServices();
  const relatedServices = allServices
    .filter(s => s.category === serviceInfo.category && s.id !== serviceInfo.service.id)
    .slice(0, 8);

  return (
    <DetailShell
      sidebar={
        <>
          <SidebarCard title="Resumen">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-secondary"><Layers className="w-4 h-4" />Categoría</span>
                <span className="font-semibold text-black">{serviceInfo.category}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-secondary"><Building className="w-4 h-4" />Proveedores</span>
                <span className="font-semibold text-black">{providers.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-secondary"><MapPin className="w-4 h-4" />Ciudades</span>
                <span className="font-semibold text-black">{cities.length}</span>
              </div>
            </div>
          </SidebarCard>

          {relatedServices.length > 0 && (
            <SidebarCard title={`Más en ${serviceInfo.category}`} className="mt-4">
              <ul className="space-y-2">
                {relatedServices.map(s => (
                  <li key={s.id}>
                    <Link href={`/services/${createSlug(s.name)}`} className="text-sm underline" style={{ color: stitch.secondary }}>
                      {s.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </SidebarCard>
          )}

          <SidebarCard title="¿Ofrece este servicio?" className="mt-4">
            <p className="text-sm text-secondary mb-3">Añada su empresa al directorio y aparezca en esta lista.</p>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/list-your-company"><UserPlus className="w-4 h-4 mr-2" />Publicar mi Empresa</Link>
            </Button>
          </SidebarCard>
        </>
      }
    >
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
    </DetailShell>
  );
}
