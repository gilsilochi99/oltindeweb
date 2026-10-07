import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCompanyById } from '@/lib/data';
import { getBookingByToken } from '@/lib/rentals/bookings';
import { BookingStatusBadge, BookingSummary, CancelBookingButton } from '@/components/rentals/BookingParts';
import { RentalContactButtons } from '@/components/rentals/RentalDetailClient';

// Customer receipt. The token in the URL is an unguessable secret, so this
// link is how guests follow (and cancel) their request; never indexed.
export const metadata: Metadata = { title: 'Su reserva', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

const HEADLINES = {
  pending: { icon: Clock, color: 'text-amber-600', title: 'Solicitud enviada', text: 'La empresa ha recibido su solicitud. Le avisaremos cuando la acepte o la rechace. Mientras tanto, las fechas quedan reservadas para usted.' },
  accepted: { icon: CheckCircle2, color: 'text-green-600', title: '¡Reserva aceptada!', text: 'La empresa ha confirmado su reserva. Contacte con ella para acordar el pago y la entrega de llaves o del vehículo.' },
  rejected: { icon: XCircle, color: 'text-red-600', title: 'Solicitud rechazada', text: 'La empresa no puede atender esta solicitud. Pruebe con otras fechas u otros anuncios.' },
  cancelled: { icon: XCircle, color: 'text-red-600', title: 'Reserva cancelada', text: 'Esta reserva está cancelada y las fechas han quedado libres.' },
  completed: { icon: CheckCircle2, color: 'text-slate-600', title: 'Alquiler finalizado', text: 'Gracias por alquilar a través de Oltinde.' },
} as const;

export default async function BookingReceiptPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const b = await getBookingByToken(token);
  if (!b) notFound();
  const company = await getCompanyById(b.companyId);
  const branch = company?.branches?.[0];
  const h = HEADLINES[b.status];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2 py-2">
        <h.icon className={`w-14 h-14 mx-auto ${h.color}`} />
        <h1 className="text-2xl md:text-3xl font-bold">{h.title}</h1>
        <p className="text-muted-foreground">{h.text}</p>
      </div>
      {b.status === 'pending' && (
        <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
          Guarde esta página en favoritos o copie el enlace: con él puede seguir y cancelar su solicitud aunque no tenga cuenta.
        </div>
      )}
      <article className="rounded-lg border border-outline-variant bg-card">
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b">
          <div><p className="font-semibold">Reserva {b.bookingNumber}</p><p className="text-xs text-muted-foreground">{new Date(b.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
          <BookingStatusBadge status={b.status} />
        </header>
        <div className="p-5 space-y-5">
          <BookingSummary b={b} />
          <div className="border-t pt-4 space-y-2">
            <p className="text-sm font-medium">Contactar con {b.companyName}</p>
            <RentalContactButtons
              listingId={b.listingId ?? ''} title={b.listingTitle} slug={b.listingSlug ?? ''} companyName={b.companyName ?? ''} isPreview
              whatsapp={company?.contact.socialMedia?.whatsapp || branch?.contact.phone || undefined}
              phone={branch?.contact.phone || undefined}
            />
          </div>
          <div className="flex justify-end"><CancelBookingButton b={b} token={token} /></div>
        </div>
      </article>
      <div className="flex flex-wrap gap-2 justify-center">
        <Button asChild><Link href="/alquiler">Seguir buscando</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/reservas">Mis reservas</Link></Button>
      </div>
    </div>
  );
}
