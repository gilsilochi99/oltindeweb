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
import { getAvailability, requestBooking } from '@/lib/rentals/bookings';
import { formatXaf } from '@/lib/shop/types';
import {
  addDaysIso, addMonthsIso, isoDate, parseIsoDate, quoteBooking, rangesOverlap, todayIsoGQ, unitLabel,
  type BusyRange, type RentalListing, type RentalTerm,
} from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

// Calendar days are local Date objects; the API uses YYYY-MM-DD strings.
const toLocal = (s: string) => { const d = parseIsoDate(s); return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); };
const fromLocal = (d: Date) => isoDate(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())));
const longDate = (s: string) => toLocal(s).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export function BookingWidget({ listing }: { listing: RentalListing }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const isProperty = listing.category === 'property';
  const [term, setTerm] = useState<RentalTerm>(listing.shortTermEnabled ? 'short' : 'long');
  const [busy, setBusy] = useState<BusyRange[] | null>(null);
  const [range, setRange] = useState<DateRange | undefined>();
  const [start, setStart] = useState<Date | undefined>();
  const [months, setMonths] = useState(String(listing.minMonths));
  const [guests, setGuests] = useState('');
  const [withDriver, setWithDriver] = useState(listing.driverOption === 'required');
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
  // A day is taken when it's a night/day inside a busy [start, end) range.
  const disabled = useMemo(() => [
    { before: toLocal(today) },
    ...(busy ?? []).map(b => ({ from: toLocal(b.start), to: toLocal(addDaysIso(b.end, -1)) })),
  ], [busy, today]);

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
    return { startDate: s, endDate: addMonthsIso(s, Number(months)), months: Number(months) };
  }, [term, range, start, months]);

  const quote = request ? quoteBooking(listing, { term, ...request, withDriver }) : undefined;
  const problem = (() => {
    if (!request || !quote) return undefined;
    if ((busy ?? []).some(b => rangesOverlap(b.start, b.end, request.startDate, request.endDate))) return 'Las fechas elegidas incluyen días no disponibles.';
    if (term === 'short' && quote.units < listing.minUnits) return `Mínimo ${listing.minUnits} ${unitLabel(listing.category, listing.minUnits !== 1)}.`;
    if (term === 'short' && listing.maxUnits && quote.units > listing.maxUnits) return `Máximo ${listing.maxUnits} ${unitLabel(listing.category, true)}.`;
    return undefined;
  })();

  const submit = async () => {
    if (!request) return;
    setSending(true);
    const result = await requestBooking({
      listingId: listing.id, term, ...request,
      guests: guests ? Number(guests) : undefined,
      withDriver, customerName: name, customerPhone: phone, customerEmail: email || undefined, message: message || undefined,
    });
    if (!result.success) {
      setSending(false);
      toast({ title: 'No se pudo enviar la solicitud', description: result.message, variant: 'destructive' });
      if (/disponibles/.test(result.message)) getAvailability(listing.id).then(setBusy);
      return;
    }
    router.push(`/alquiler/reserva/${result.token}`);
  };

  const monthOptions = Array.from({ length: Math.max(1, 24 - listing.minMonths + 1) }, (_, i) => listing.minMonths + i);
  const capacity = isProperty ? listing.maxGuests : undefined;

  return (
    <div className="rounded-lg border border-outline-variant bg-card p-5 space-y-4">
      <h2 className="font-bold text-lg flex items-center gap-2"><CalendarCheck className="w-5 h-5" />Solicitar reserva</h2>

      {listing.shortTermEnabled && listing.longTermEnabled && (
        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
          {(['short', 'long'] as RentalTerm[]).map(t => (
            <button key={t} type="button" onClick={() => { setTerm(t); setStep('dates'); }} aria-pressed={term === t}
              className={cn('rounded px-2 py-1.5 font-medium', term === t ? 'bg-background shadow-sm' : 'text-muted-foreground')}>
              {t === 'short' ? `Por ${unitLabel(listing.category, true)}` : 'Por meses'}
            </button>
          ))}
        </div>
      )}

      {step === 'dates' ? (
        <>
          {busy === null ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : term === 'short' ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{isProperty ? 'Marque la primera y la última noche.' : 'Marque el primer y el último día.'}</p>
              <Calendar mode="range" selected={range} onSelect={setRange} disabled={disabled} locale={es} numberOfMonths={1} className="rounded-md border mx-auto w-fit" />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Elija la fecha de entrada y la duración.</p>
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

          {request && quote && (
            <div className="rounded-md bg-muted p-3 text-sm space-y-1">
              <p><span className="text-muted-foreground">{isProperty ? 'Entrada' : 'Recogida'}:</span> {longDate(request.startDate)}</p>
              <p><span className="text-muted-foreground">{isProperty ? 'Salida' : 'Devolución'}:</span> {longDate(quote.endDate)}</p>
              <div className="flex justify-between pt-1 border-t mt-1">
                <span>{term === 'short' ? `${formatXaf(quote.unitPrice)} × ${quote.units} ${unitLabel(listing.category, quote.units !== 1)}` : `${formatXaf(quote.unitPrice)} × ${quote.units} ${quote.units === 1 ? 'mes' : 'meses'}`}</span>
                <span>{formatXaf(quote.unitPrice * quote.units)}</span>
              </div>
              {quote.driverFee > 0 && <div className="flex justify-between"><span>Conductor</span><span>{formatXaf(quote.driverFee)}</span></div>}
              <div className="flex justify-between font-bold"><span>Total</span><span>{formatXaf(quote.total)}</span></div>
              {quote.deposit > 0 && <p className="text-xs text-muted-foreground">Fianza aparte (reembolsable): {formatXaf(quote.deposit)}</p>}
            </div>
          )}
          {problem && <p className="text-sm text-red-600">{problem}</p>}
          <Button className="w-full" size="lg" disabled={!request || !quote || !!problem} onClick={() => setStep('details')}>Continuar</Button>
        </>
      ) : (
        <div className="space-y-3">
          <button type="button" className="text-sm underline" onClick={() => setStep('dates')}>← Cambiar fechas</button>
          {quote && request && <p className="text-sm"><strong>{longDate(request.startDate)} → {longDate(quote.endDate)}</strong> · {formatXaf(quote.total)}</p>}
          <div className="space-y-1"><Label htmlFor="bk-name">Nombre completo</Label><Input id="bk-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} /></div>
          <div className="space-y-1"><Label htmlFor="bk-phone">Teléfono</Label><Input id="bk-phone" type="tel" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+240 222 XXX XXX" /></div>
          <div className="space-y-1"><Label htmlFor="bk-email">Correo (opcional)</Label><Input id="bk-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div>
          {capacity !== undefined && (
            <div className="space-y-1"><Label htmlFor="bk-guests">Personas</Label><Input id="bk-guests" type="number" min={1} max={capacity} value={guests} onChange={e => setGuests(e.target.value)} placeholder={`Hasta ${capacity}`} /></div>
          )}
          <div className="space-y-1"><Label htmlFor="bk-msg">Mensaje para la empresa (opcional)</Label><Textarea id="bk-msg" rows={2} value={message} onChange={e => setMessage(e.target.value)} placeholder={isProperty ? 'Hora de llegada, motivo del viaje...' : 'Lugar de entrega, hora...'} /></div>
          <Button className="w-full" size="lg" onClick={submit} disabled={sending || name.trim().length < 2 || phone.trim().length < 6}>
            {sending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enviar solicitud
          </Button>
          <p className="text-xs text-muted-foreground">No se cobra nada ahora. La empresa le confirmará la disponibilidad y acordará el pago con usted. Las fechas quedan reservadas mientras responde.</p>
        </div>
      )}
    </div>
  );
}
