import Link from "next/link";
import { Building2, Stethoscope, Pill, Phone, MapPin } from "lucide-react";
import { getHealthFacilitiesByType, getPharmaciesOnDuty } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: 'Salud — Hospitales, Clínicas y Farmacias',
  description: 'Encuentre hospitales, clínicas y farmacias en Guinea Ecuatorial, y consulte qué farmacias están de guardia hoy.',
};

export default async function HealthHubPage() {
  const [hospitals, clinics, pharmacies, onDutyPharmacies] = await Promise.all([
    getHealthFacilitiesByType('hospital'),
    getHealthFacilitiesByType('clinic'),
    getHealthFacilitiesByType('pharmacy'),
    getPharmaciesOnDuty(),
  ]);

  const categories = [
    { href: '/health/hospitals', label: 'Hospitales', count: hospitals.length, icon: Building2, description: 'Centros hospitalarios públicos y privados, con sus servicios y especialidades.' },
    { href: '/health/clinics', label: 'Clínicas', count: clinics.length, icon: Stethoscope, description: 'Clínicas y consultorios especializados.' },
    { href: '/health/pharmacies', label: 'Farmacias', count: pharmacies.length, icon: Pill, description: 'Farmacias, con disponibilidad de guardia actualizada cada mes.' },
  ];

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-bold font-headline">Salud</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">
          Encuentre hospitales, clínicas y farmacias en Guinea Ecuatorial, con sus servicios, especialidades y disponibilidad de guardia.
        </p>
      </section>

      {onDutyPharmacies.length > 0 && (
        <section className="rounded-lg border border-green-600/30 bg-green-50 p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
            <h2 className="text-lg font-bold text-green-900">Farmacias de Guardia Hoy</h2>
            <Button asChild variant="outline" size="sm">
              <Link href="/health/pharmacies">Ver todas las farmacias</Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {onDutyPharmacies.map(pharmacy => {
              const mainBranch = pharmacy.branches?.[0];
              return (
                <Link
                  key={pharmacy.id}
                  href={`/health/pharmacies/${pharmacy.id}`}
                  className="block bg-white rounded-md border border-green-600/20 p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  <p className="font-semibold text-black">{pharmacy.name}</p>
                  {mainBranch && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" />{mainBranch.location.city}</p>
                  )}
                  {mainBranch?.contact.phone && (
                    <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{mainBranch.contact.phone}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map(cat => (
          <Link key={cat.href} href={cat.href} className="group block">
            <Card className="h-full transition-all duration-200 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="p-6 flex flex-col items-start">
                <cat.icon className="w-8 h-8 text-muted-foreground mb-4 transition-colors group-hover:text-primary" />
                <h2 className="text-lg font-bold font-headline">{cat.label}</h2>
                <p className="text-sm text-muted-foreground mt-2 flex-grow">{cat.description}</p>
                <p className="text-xs text-muted-foreground mt-4">{cat.count} registrado{cat.count === 1 ? '' : 's'}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
