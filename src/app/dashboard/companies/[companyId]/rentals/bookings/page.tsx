'use client';

import { use, useCallback, useEffect, useState } from 'react';
import { CalendarCheck, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import { SellerGate } from '@/components/shop/SellerGate';
import { BookingStatusBadge, BookingSummary } from '@/components/rentals/BookingParts';
import { getAdvertiserBookings, respondToBooking } from '@/lib/rentals/bookings';
import { addDaysIso, todayIsoGQ, type RentalBooking } from '@/lib/rentals/types';
import type { Company } from '@/lib/types';

type Filter = 'pending' | 'accepted' | 'history';
type Action = 'accepted' | 'rejected' | 'cancelled' | 'completed';

const ACTION_COPY: Record<Action, { title: string; needsNote: boolean; placeholder: string; confirm: string }> = {
  accepted: { title: 'Aceptar la reserva', needsNote: false, placeholder: 'Mensaje para el cliente (opcional): hora de entrega, forma de pago...', confirm: 'Aceptar' },
  rejected: { title: 'Rechazar la solicitud', needsNote: true, placeholder: 'Motivo para el cliente', confirm: 'Rechazar' },
  cancelled: { title: 'Cancelar la reserva', needsNote: true, placeholder: 'Motivo para el cliente', confirm: 'Cancelar reserva' },
  completed: { title: 'Marcar como finalizada', needsNote: false, placeholder: 'Nota (opcional)', confirm: 'Finalizar' },
};

function Bookings({ company }: { company: Company }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState<Filter>('pending');
  const [data, setData] = useState<Awaited<ReturnType<typeof getAdvertiserBookings>> | null>(null);
  const [pending, setPending] = useState<{ booking: RentalBooking; action: Action } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => setData(await getAdvertiserBookings(company.id)), [company.id]);
  useEffect(() => { load(); }, [load]);

  const inFilter = (b: RentalBooking) => (filter === 'history' ? !['pending', 'accepted'].includes(b.status) : b.status === filter);
  const visible = (data?.bookings ?? []).filter(inFilter);
  const count = (f: Filter) => (data?.bookings ?? []).filter(b => (f === 'history' ? !['pending', 'accepted'].includes(b.status) : b.status === f)).length;

  const run = async () => {
    if (!pending) return;
    setBusy(true);
    const r = await respondToBooking(pending.booking.id, pending.action, note);
    setBusy(false);
    if (!r.success) {
      toast({ title: 'No se pudo actualizar', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Reserva ${pending.booking.bookingNumber}: ${ACTION_COPY[pending.action].confirm.toLowerCase()}`, description: pending.booking.customerId ? 'El cliente ha recibido un aviso.' : 'Es un cliente sin cuenta: avísele por teléfono o WhatsApp.' });
    setPending(null);
    setNote('');
    load();
  };

  const today = todayIsoGQ();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-headline">Reservas</h1>
        <p className="text-muted-foreground">Solicitudes de alquiler de {company.name}. Las fechas quedan apartadas mientras están pendientes.</p>
      </div>
      <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="pending">Pendientes ({count('pending')})</TabsTrigger>
          <TabsTrigger value="accepted">Aceptadas ({count('accepted')})</TabsTrigger>
          <TabsTrigger value="history">Historial ({count('history')})</TabsTrigger>
        </TabsList>
      </Tabs>

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : visible.length === 0 ? (
        <Card><CardContent className="py-16 text-center space-y-2">
          <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">{filter === 'pending' ? 'No hay solicitudes pendientes' : 'No hay reservas en esta sección'}</p>
          <p className="text-sm text-muted-foreground">Recibirá una notificación con cada nueva solicitud.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {visible.map(b => {
            const digits = b.customerPhone.replace(/[^\d]/g, '');
            const wa = digits.length >= 6 ? toWhatsAppHref(digits, `Hola ${b.customerName}, le escribimos de ${company.name} sobre su reserva ${b.bookingNumber} (${b.listingTitle}) en Oltinde.`) : undefined;
            const finished = b.endDate <= addDaysIso(today, 1);
            return (
              <article key={b.id} className="rounded-lg border border-outline-variant bg-card">
                <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
                  <div><p className="font-semibold">Reserva {b.bookingNumber}</p><p className="text-xs text-muted-foreground">Recibida el {new Date(b.createdAt).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}</p></div>
                  <BookingStatusBadge status={b.status} />
                </header>
                <div className="p-4 grid md:grid-cols-[1fr_240px] gap-5">
                  <BookingSummary b={b} showCommission />
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold">{b.customerName}</p>
                    <p className="flex items-center gap-2"><Phone className="w-4 h-4" /><a className="hover:underline" href={`tel:${b.customerPhone.replace(/\s/g, '')}`}>{b.customerPhone}</a></p>
                    {b.customerEmail && <p className="flex items-center gap-2 break-all"><Mail className="w-4 h-4 shrink-0" /><a className="hover:underline" href={`mailto:${b.customerEmail}`}>{b.customerEmail}</a></p>}
                    {wa && <Button asChild variant="outline" size="sm" className="w-full"><a href={wa} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" />WhatsApp</a></Button>}
                    <div className="flex flex-col gap-2 pt-2 border-t">
                      {b.status === 'pending' && (
                        <>
                          <Button size="sm" onClick={() => setPending({ booking: b, action: 'accepted' })}>Aceptar</Button>
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setPending({ booking: b, action: 'rejected' })}>Rechazar</Button>
                        </>
                      )}
                      {b.status === 'accepted' && (
                        <>
                          {finished && <Button size="sm" onClick={() => setPending({ booking: b, action: 'completed' })}>Marcar como finalizada</Button>}
                          <Button size="sm" variant="outline" className="text-destructive" onClick={() => setPending({ booking: b, action: 'cancelled' })}>Cancelar reserva</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Dialog open={!!pending} onOpenChange={open => { if (!open) { setPending(null); setNote(''); } }}>
        <DialogContent>
          {pending && (
            <>
              <DialogHeader>
                <DialogTitle>{ACTION_COPY[pending.action].title} {pending.booking.bookingNumber}</DialogTitle>
                <DialogDescription>{pending.action === 'accepted' ? 'El cliente recibirá la confirmación. Acuerde con él el pago y la entrega.' : pending.action === 'completed' ? 'El alquiler quedará cerrado.' : 'Las fechas quedarán libres de nuevo.'}</DialogDescription>
              </DialogHeader>
              <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={512} placeholder={ACTION_COPY[pending.action].placeholder} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setPending(null)}>Volver</Button>
                <Button variant={pending.action === 'rejected' || pending.action === 'cancelled' ? 'destructive' : 'default'} disabled={busy || (ACTION_COPY[pending.action].needsNote && note.trim().length < 3)} onClick={run}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{ACTION_COPY[pending.action].confirm}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function RentalBookingsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <Bookings company={company} />}</SellerGate>;
}
