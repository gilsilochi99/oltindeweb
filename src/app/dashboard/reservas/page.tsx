'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getMyBookings } from '@/lib/rentals/bookings';
import type { RentalBooking } from '@/lib/rentals/types';
import { BookingStatusBadge, BookingSummary, CancelBookingButton } from '@/components/rentals/BookingParts';

type Filter = 'open' | 'done';

export default function MyRentalBookingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<RentalBooking[] | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => { if (!loading && !user) router.push('/signin'); }, [loading, user, router]);
  const load = useCallback(async () => { if (user) setItems(await getMyBookings()); }, [user]);
  useEffect(() => { load(); }, [load]);

  if (!items) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  const isOpen = (b: RentalBooking) => b.status === 'pending' || b.status === 'accepted';
  const visible = items.filter(b => (filter === 'open' ? isOpen(b) : !isOpen(b)));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mis reservas</h1>
        <p className="text-muted-foreground">Solicitudes de alquiler de inmuebles y vehículos.</p>
      </div>
      {items.length === 0 ? (
        <div className="text-center py-16 space-y-3 rounded-lg border">
          <KeyRound className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Todavía no ha hecho ninguna reserva</p>
          <Button asChild><Link href="/alquiler">Buscar alquileres</Link></Button>
        </div>
      ) : (
        <>
          <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="open">En curso ({items.filter(isOpen).length})</TabsTrigger>
              <TabsTrigger value="done">Anteriores ({items.filter(b => !isOpen(b)).length})</TabsTrigger>
            </TabsList>
          </Tabs>
          {visible.length === 0 ? <p className="text-center text-muted-foreground py-10">No hay reservas en esta sección.</p> : (
            <div className="space-y-4">
              {visible.map(b => (
                <article key={b.id} className="rounded-lg border border-outline-variant bg-card">
                  <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
                    <Link href={`/alquiler/reserva/${b.accessToken}`} className="font-semibold hover:underline">Reserva {b.bookingNumber}</Link>
                    <BookingStatusBadge status={b.status} />
                  </header>
                  <div className="p-4 space-y-3">
                    <BookingSummary b={b} />
                    <div className="flex justify-end"><CancelBookingButton b={b} onDone={load} /></div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
