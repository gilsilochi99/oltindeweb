'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DateRange } from 'react-day-picker';
import { es } from 'date-fns/locale';
import { CalendarCheck, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getAvailability, getHourAvailability, requestBooking } from '@/lib/rentals/bookings';
import { formatXaf } from '@/lib/shop/types';
import {
  addDaysIso, addMonthsIso, hourLabel, isoDate, parseIsoDate, quoteBooking, rangesOverlap, todayIsoGQ, unitLabel,
  type BusyRange, type RentalListing, type RentalTerm,
} from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

// Calendar days are local Date objects; the API uses YYYY-MM-DD strings.
const toLocal = (s: string) => { const d = parseIsoDate(s); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const fromLocal = (d: Date) => isoDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
const longDate = (s: string) => toLocal(s).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
const currentHourGQ = () => new Date(Date.now() + 3600000).getUTCHours();

const TERM_LABEL = (listing: RentalListing, t: RentalTerm) => (t === 'short' ? `Por ${unitLabel(listing.category, true)}` : t === 'hourly' ? 'Por horas' : 'Por meses');

export function BookingWidget({ listing }: { listing: RentalListing }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isProperty = listing.category === 'property';
  const isItem = listing.category === 'item';
  const terms = ([['short', listing.shortTermEnabled], ['hourly', listing.hourlyEnabled], ['long', listing.longTermEnabled]] as [RentalTerm, boolean][])
    .filter(([, on]) => on).map(([t]) => t);
  const [term, setTerm] = useState<RentalTerm>(terms[0] ?? 'short');
  const [busy, setBusy] = useState<BusyRange[] | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [start, setStart] = useState<Date | undefined>();
  const [months, setMonths] = useState(String(listing.minMonths));
  const [hours, setHours] = useState<number[] | null>(null); // units free per hour on `start`
  const [startHour, setStartHour] = useState<number | undefined>();
  const [endHour, setEndHour] = useState<number | undefined>();
  const [quantity, setQuantity] = useState('1');
  const [guests, setGuests] = useState('');
  const [withDriver, setWithDriver] = useState(listing.driverOption === 'required');
  const [withDelivery, setWithDelivery] = useState(listing.deliveryOption === 'required');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [step, setStep] = useState<'dates' | 'details'>('dates');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => { getAvailability(listing.id).then(setBusy); }, [listing.id]);
  useEffect(() => {
    if (user) {
      setName(n => n || user.displayName || '');
      setEmail(e => e || user.email || '');
    }
  }, [user]);

  const today = todayIsoGQ();
  const qty = isItem ? Math.max(1, Math.min(listing.quantity, Math.floor(Number(quantity) || 1))) : 1;

  // By the day or month, any day with no unit left is closed. By the hour,
  // only days with no free hour at all.
  const disabled = useMemo(() => [
    { before: toLocal(today) },
    ...(busy ?? []).filter(b => term !== 'hourly' || b.kind !== 'partial').map(b => ({ from: toLocal(b.start), to: toLocal(addDaysIso(b.end, -1)) })),
  ], [busy, today, term]);

  // Free hours of the chosen day (hourly listings).
  const day = start ? fromLocal(start) : undefined;
  useEffect(() => {
    setHours(null);
    setStartHour(undefined);
    setEndHour(undefined);
    if (term === 'hourly' && day) getHourAvailability(listing.id, day).then(setHours);
  }, [term, day, listing.id]);

  const hourFree = (h: number) => !!hours && hours[h] >= qty && !(day === today && h <= currentHourGQ());
  const startOptions = Array.from({ length: 24 }, (_, h) => h).filter(h => hourFree(h));
  // End hours: consecutive free hours after the start.
  const endOptions = useMemo(() => {
    if (startHour === undefined) return [];
    const out: number[] = [];
    for (let h = startHour; h < 24 && hourFree(h); h++) out.push(h + 1);
    return out.filter(e => e - startHour >= listing.minHours);
  }, [startHour, hours, qty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inclusive selection → [startDate, endDate) for the API.
  const request = useMemo(() => {
    if (term === 'short') {
      if (!range?.from) return undefined;
      const s = fromLocal(range.from);
      const e = addDaysIso(fromLocal(range.to ?? range.from), 1);
      return { startDate: s, endDate: e };
    }
    if (!start) return undefined;
    const s = fromLocal(start);
    if (term === 'hourly') {
      if (startHour === undefined || endHour === undefined) return undefined;
      return { startDate: s, endDate: addDaysIso(s, 1), startHour, endHour };
    }
    return { startDate: s, endDate: addMonthsIso(s, Number(months)), months: Number(months) };
  }, [term, range, start, months, startHour, endHour]);

  const quote = request ? quoteBooking(listing, { term, ...request, quantity: qty, withDriver, withDelivery }) : undefined;
  const problem = (() => {
    if (!request || !quote) return undefined;
    if (term !== 'hourly' && (busy ?? []).some(b => rangesOverlap(b.start, b.end, request.startDate, request.endDate))) return 'Las fechas elegidas incluyen días no disponibles.';
    if (term === 'short' && quote.units < listing.minUnits) return `Mínimo ${listing.minUnits} ${unitLabel(listing.category, listing.minUnits !== 1)}.`;
    if (term === 'short' && listing.maxUnits && quote.units > listing.maxUnits) return `Máximo ${listing.maxUnits} ${unitLabel(listing.category, true)}.`;
    return undefined;
  })();

  const submit = async () => {
    if (!request) return;
    setSending(true);
    const result = await requestBooking({
      listingId: listing.id, term, ...request,
      quantity: qty,
      guests: guests ? Number(guests) : undefined,
      withDriver, withDelivery, deliveryAddress: withDelivery ? deliveryAddress : undefined,
      customerName: name, customerPhone: phone, customerEmail: email || undefined, message: message || undefined,
    });
    if (!result.success) {
      setSending(false);
      toast({ title: 'No se pudo enviar la solicitud', description: result.message, variant: 'destructive' });
      if (/disponibles|quedan/.test(result.message)) {
        getAvailability(listing.id).then(setBusy);
        if (term === 'hourly' && day) getHourAvailability(listing.id, day).then(setHours);
        setStep('dates');
      }
      return;
    }
    router.push(`/alquiler/reserva/${result.token}`);
  };

  const monthOptions = Array.from({ length: Math.max(1, 24 - listing.minMonths + 1) }, (_, i) => listing.minMonths + i);
  const capacity = isProperty || listing.category === 'space' ? listing.maxGuests : undefined;
  const needsAddress = withDelivery && deliveryAddress.trim().length < 5;
  const startLabel = isProperty ? 'Entrada' : listing.category === 'space' ? 'Desde' : 'Recogida';
  const endLabel = isProperty ? 'Salida' : listing.category === 'space' ? 'Hasta' : 'Devolución';

  return (
    <div className="rounded-lg border border-outline-variant bg-card p-5 space-y-4">
      <h2 className="font-bold text-lg flex items-center gap-2"><CalendarCheck className="w-5 h-5" />Solicitar reserva</h2>

      {terms.length > 1 && (
        <div className={cn('grid gap-1 rounded-md bg-muted p-1 text-sm', terms.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
          {terms.map(t => (
            <button key={t} type="button" onClick={() => { setTerm(t); setStep('dates'); }} aria-pressed={term === t}
              className={cn('rounded px-2 py-1.5 font-medium', term === t ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              {TERM_LABEL(listing, t)}
            </button>
          ))}
        </div>
      )}

      {step === 'dates' ? (
        <>
          {isItem && listing.quantity > 1 && (
            <div className="space-y-1">
              <Label htmlFor="bk-qty">Cantidad</Label>
              <Input id="bk-qty" type="number" min={1} max={listing.quantity} value={quantity} onChange={e => setQuantity(e.target.value)} />
              <p className="text-xs text-muted-foreground">Hasta {listing.quantity} unidades.</p>
            </div>
          )}

          {busy === null ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : term === 'short' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{isProperty ? 'Marque la primera y la última noche.' : 'Marque el primer y el último día.'}</p>
              <Calendar mode="range" selected={range} onSelect={setRange} disabled={disabled} locale={es} numberOfMonths={1} className="rounded-md border mx-auto w-fit" />
            </div>
          ) : term === 'hourly' ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Elija el día y las horas.</p>
              <Calendar mode="single" selected={start} onSelect={setStart} disabled={disabled} locale={es} className="rounded-md border mx-auto w-fit" />
              {start && (hours === null ? (
                <div className="flex justify-center py-2"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : startOptions.length === 0 ? (
                <p className="text-sm text-red-600">No quedan horas libres ese día.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Desde</Label>
                    <Select value={startHour === undefined ? undefined : String(startHour)} onValueChange={v => { setStartHour(Number(v)); setEndHour(undefined); }}>
                      <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                      <SelectContent>{startOptions.map(h => <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Hasta</Label>
                    <Select value={endHour === undefined ? undefined : String(endHour)} onValueChange={v => setEndHour(Number(v))} disabled={startHour === undefined || endOptions.length === 0}>
                      <SelectTrigger><SelectValue placeholder="Hora" /></SelectTrigger>
                      <SelectContent>{endOptions.map(h => <SelectItem key={h} value={String(h)}>{hourLabel(h)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  {startHour !== undefined && endOptions.length === 0 && <p className="col-span-2 text-xs text-red-600">Mínimo {listing.minHours} horas seguidas libres desde esa hora.</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Elija la fecha de inicio y la duración.</p>
              <Calendar mode="single" selected={start} onSelect={setStart} disabled={disabled} locale={es} className="rounded-md border mx-auto w-fit" />
              <div className="space-y-1">
                <Label>Duración</Label>
                <Select value={months} onValueChange={setMonths}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{monthOptions.map(m => <SelectItem key={m} value={String(m)}>{m} {m === 1 ? 'mes' : 'meses'}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          )}

          {listing.category === 'vehicle' && listing.driverOption === 'optional' && term === 'short' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={withDriver} onCheckedChange={v => setWithDriver(!!v)} />
              Con conductor{listing.driverDailyFee ? ` (+${formatXaf(listing.driverDailyFee)} / día)` : ''}
            </label>
          )}
          {isItem && listing.deliveryOption === 'optional' && (
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={withDelivery} onCheckedChange={v => setWithDelivery(!!v)} />
              Con entrega y montaje{listing.deliveryFee ? ` (+${formatXaf(listing.deliveryFee)})` : ' (gratis)'}
            </label>
          )}

          {request && quote && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              {term === 'hourly' ? (
                <p><span className="text-muted-foreground">Día:</span> {longDate(request.startDate)}, {hourLabel(request.startHour!)}–{hourLabel(request.endHour!)}</p>
              ) : (
                <>
                  <p><span className="text-muted-foreground">{startLabel}:</span> {longDate(request.startDate)}</p>
                  <p><span className="text-muted-foreground">{endLabel}:</span> {longDate(quote.endDate)}</p>
                </>
              )}
              <div className="flex justify-between gap-2 pt-1 border-t mt-1">
                <span>
                  {formatXaf(quote.unitPrice)} × {quote.units} {term === 'short' ? unitLabel(listing.category, quote.units !== 1) : term === 'hourly' ? (quote.units === 1 ? 'hora' : 'horas') : quote.units === 1 ? 'mes' : 'meses'}
                  {quote.quantity > 1 ? ` × ${quote.quantity} unidades` : ''}
                </span>
                <span>{formatXaf(quote.unitPrice * quote.units * quote.quantity)}</span>
              </div>
              {quote.driverFee > 0 && <div className="flex justify-between"><span>Conductor</span><span>{formatXaf(quote.driverFee)}</span></div>}
              {quote.withDelivery && <div className="flex justify-between"><span>Entrega y montaje</span><span>{quote.deliveryFee ? formatXaf(quote.deliveryFee) : 'Gratis'}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatXaf(quote.total)}</span></div>
              {quote.deposit > 0 && <p className="text-xs text-muted-foreground">Fianza aparte (reembolsable): {formatXaf(quote.deposit)}</p>}
            </div>
          )}
          {problem && <p className="text-sm text-red-600">{problem}</p>}
          <Button className="w-full" size="lg" disabled={!request || !quote || !!problem} onClick={() => setStep('details')}>Continuar</Button>
        </>
      ) : (
        <div className="space-y-3">
          <button type="button" className="text-sm underline" onClick={() => setStep('dates')}>← Cambiar {term === 'hourly' ? 'horas' : 'fechas'}</button>
          {quote && request && (
            <p className="text-sm">
              <strong>{term === 'hourly' ? `${longDate(request.startDate)}, ${hourLabel(request.startHour!)}–${hourLabel(request.endHour!)}` : `${longDate(request.startDate)} → ${longDate(quote.endDate)}`}</strong>
              {quote.quantity > 1 ? ` · ${quote.quantity} unidades` : ''} · {formatXaf(quote.total)}
            </p>
          )}
          <div className="space-y-1"><Label htmlFor="bk-name">Nombre completo</Label><Input id="bk-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="bk-phone">Teléfono</Label><Input id="bk-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+240 222 XXX XXX" /></div>
          <div className="space-y-1"><Label htmlFor="bk-email">Correo (opcional)</Label><Input id="bk-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          {withDelivery && (
            <div className="space-y-1"><Label htmlFor="bk-addr">Dirección de entrega</Label><Input id="bk-addr" autoComplete="street-address" value={deliveryAddress} onChange={e => setDeliveryAddress(e.target.value)} placeholder="Barrio, calle, referencia" maxLength={512} /></div>
          )}
          {capacity !== undefined && (
            <div className="space-y-1"><Label htmlFor="bk-guests">Personas</Label><Input id="bk-guests" type="number" min={1} max={capacity} value={guests} onChange={e => setGuests(e.target.value)} placeholder={`Hasta ${capacity}`} /></div>
          )}
          <div className="space-y-1"><Label htmlFor="bk-msg">Mensaje para el anunciante (opcional)</Label><Textarea id="bk-msg" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder={isProperty ? 'Hora de llegada, motivo del viaje...' : listing.category === 'space' ? 'Tipo de evento, número de invitados...' : 'Lugar de entrega, hora...'} /></div>
          <Button className="w-full" size="lg" onClick={submit} disabled={sending || name.trim().length < 2 || phone.trim().length < 6 || needsAddress}>
            {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enviar solicitud
          </Button>
          <p className="text-xs text-muted-foreground">No se cobra nada ahora. El anunciante le confirmará la disponibilidad y acordará el pago con usted. {term === 'hourly' ? 'Las horas' : 'Las fechas'} quedan reservadas mientras responde.</p>
        </div>
      )}
    </div>
  );
}
