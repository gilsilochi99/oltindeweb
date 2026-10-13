import type { Metadata } from 'next';
import { PublishOptions } from '@/components/layout/PublishSheet';

// Desktop target of the header's "Publicar" button; phones get the same
// options in the bottom bar's + sheet.
export const metadata: Metadata = {
  title: 'Publicar',
  description: 'Todo lo que puede añadir a Oltinde: algo para alquilar, su perfil profesional, guías, itinerarios, su empresa y, con Premium, productos, empleos, ofertas y eventos.',
  alternates: { canonical: '/publicar' },
};

export default function PublishPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold font-headline">Publicar en Oltinde</h1>
      <p className="mt-2 text-muted-foreground">¿Qué quiere añadir?</p>
      <PublishOptions />
    </div>
  );
}
