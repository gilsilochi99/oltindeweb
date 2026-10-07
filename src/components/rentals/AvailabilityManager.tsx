'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { Loader2, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { addBlock, getListingCalendar, removeBlock } from '@/lib/rentals/bookings';
import { addDaysIso, isoDate, parseIsoDate, todayIsoGQ } from '@/lib/rentals/types';
import { BookingStatusBadge, fmtDate } from './BookingParts';

const toLocal = (s: string) => { const d = parseIsoDate(s); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const fromLocal = (d: Date) => isoDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));

type CalendarData = NonNullable<Awaited<ReturnType<typeof getListingCalendar>>>;

export function AvailabilityManager({ listingId, companyId }: { listingId: string; companyId: string }) {
  const { toast } = useToast();
  const [data, setData] = useState<CalendarData | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => setData((await getListingCalendar(listingId)) ?? { blocks: [], bookings: [] }), [listingId]);
  useEffect(() => { load(); }, [load]);

  // Ranges are [start, end): the last night/day is end - 1.
  const toMatcher = (r: { start: string; end: string }) => ({ from: toLocal(r.start), to: toLocal(addDaysIso(r.end, -1)) });
  const modifiers = useMemo(() => ({
    booked: (data?.bookings ?? []).map(toMatcher),
    blocked: (data?.blocks ?? []).map(toMatcher),
  }), [data]);

  const save = async () => {
    if (!range?.from) return;
    setSaving(true);
    const start = fromLocal(range.from);
    const end = addDaysIso(fromLocal(range.to ?? range.from), 1);
    const r = await addBlock(listingId, start, end, note);
    setSaving(false);
    if (!r.success) {
      toast({ title: 'No se pudieron bloquear', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Fechas bloqueadas' });
    setRange(undefined);
    setNote('');
    load();
  };

  const unblock = async (id: string) => {
    const r = await removeBlock(id);
    if (r.success) { toast({ title: 'Fechas desbloqueadas' }); load(); }
  };

  if (!data) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="grid lg:grid-cols-[auto_1fr] gap-6 items-start">
      <Card>
        <CardHeader>
          <CardTitle>Calendario</CardTitle>
          <CardDescription>
            <span className="inline-flex items-center gap-1.5 mr-3"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block" />Reservado</span>
            <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-slate-500 inline-block" />Bloqueado</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Calendar
            mode="range" selected={range} onSelect={setRange} locale={es} numberOfMonths={1}
            disabled={[{ before: toLocal(todayIsoGQ()) }, ...modifiers.booked]}
            modifiers={modifiers}
            modifiersClassNames={{ booked: '!bg-green-600 !text-white rounded-none', blocked: '!bg-slate-500 !text-white rounded-none' }}
            className="rounded-md border w-fit"
          />
          <p className="text-xs text-muted-foreground">Marque un rango para cerrarlo: mantenimiento, uso propio, alquilado por otra vía...</p>
          {range?.from && (
            <div className="space-y-2">
              <p className="text-sm">Del <strong>{fmtDate(fromLocal(range.from))}</strong> al <strong>{fmtDate(fromLocal(range.to ?? range.from))}</strong></p>
              <Input value={note} onChange={e => setNote(e.target.value)} placeholder="Nota interna (opcional)" maxLength={255} />
              <Button onClick={save} disabled={saving} className="w-full">{saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}Bloquear estas fechas</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Próximas reservas</CardTitle></CardHeader>
          <CardContent>
            {data.bookings.length === 0 ? <p className="text-sm text-muted-foreground">No hay reservas próximas.</p> : (
              <ul className="space-y-2 text-sm">
                {data.bookings.map(b => (
                  <li key={b.id} className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                    <span><strong>{b.bookingNumber}</strong> · {b.customerName}<br /><span className="text-muted-foreground">{fmtDate(b.start)} → {fmtDate(b.end)}</span></span>
                    <BookingStatusBadge status={b.status} />
                  </li>
                ))}
              </ul>
            )}
            <Button variant="link" asChild className="px-0"><Link href={`/dashboard/companies/${companyId}/rentals/bookings`}>Gestionar reservas</Link></Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Fechas bloqueadas</CardTitle></CardHeader>
          <CardContent>
            {data.blocks.length === 0 ? <p className="text-sm text-muted-foreground">No hay fechas bloqueadas.</p> : (
              <ul className="space-y-2 text-sm">
                {data.blocks.map(b => (
                  <li key={b.id} className="flex items-center justify-between gap-2 border-b pb-2">
                    <span>{fmtDate(b.start)} → {fmtDate(addDaysIso(b.end, -1))}{b.note && <span className="block text-xs text-muted-foreground">{b.note}</span>}</span>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => unblock(b.id)} aria-label="Desbloquear"><Trash2 className="w-4 h-4" /></Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
