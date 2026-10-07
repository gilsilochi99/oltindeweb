'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Car, Home, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cancelMyBooking } from '@/lib/rentals/bookings';
import { formatXaf } from '@/lib/shop/types';
import { BOOKING_STATUS_LABELS, parseIsoDate, todayIsoGQ, unitLabel, type RentalBooking, type RentalBookingStatus } from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

const STATUS_STYLE: Record<RentalBookingStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  accepted: 'bg-green-100 text-green-900 border-green-300',
  rejected: 'bg-red-100 text-red-900 border-red-300',
  cancelled: 'bg-red-100 text-red-900 border-red-300',
  completed: 'bg-slate-100 text-slate-900 border-slate-300',
};

export function BookingStatusBadge({ status }: { status: RentalBookingStatus }) {
  return <Badge variant="outline" className={cn('font-medium', STATUS_STYLE[status])}>{BOOKING_STATUS_LABELS[status]}</Badge>;
}

export const fmtDate = (s: string) => {
  const d = parseIsoDate(s);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
};

export function bookingDuration(b: Pick<RentalBooking, 'term' | 'units' | 'category'>): string {
  return b.term === 'long' ? `${b.units} ${b.units === 1 ? 'mes' : 'meses'}` : `${b.units} ${unitLabel(b.category, b.units !== 1)}`;
}

// Dates, price breakdown and listing summary — shared by customer and advertiser views.
export function BookingSummary({ b, showCommission = false }: { b: RentalBooking; showCommission?: boolean }) {
  const isProperty = b.category === 'property';
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative w-20 h-16 rounded-md overflow-hidden bg-muted shrink-0 flex items-center justify-center">
          {b.listingImage ? <Image src={b.listingImage} alt="" fill sizes="80px" className="object-cover" /> : isProperty ? <Home className="w-5 h-5 text-muted-foreground" /> : <Car className="w-5 h-5 text-muted-foreground" />}
        </div>
        <div className="min-w-0">
          {b.listingSlug ? <Link href={`/alquiler/${b.listingSlug}`} className="font-semibold hover:underline line-clamp-2">{b.listingTitle}</Link> : <p className="font-semibold">{b.listingTitle}</p>}
          {b.companyName && <p className="text-sm text-muted-foreground">{b.companyName}</p>}
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
        <div><dt className="text-muted-foreground">{isProperty ? 'Entrada' : 'Recogida'}</dt><dd className="font-medium">{fmtDate(b.startDate)}</dd></div>
        <div><dt className="text-muted-foreground">{isProperty ? 'Salida' : 'Devolución'}</dt><dd className="font-medium">{fmtDate(b.endDate)}</dd></div>
        <div><dt className="text-muted-foreground">Duración</dt><dd>{bookingDuration(b)}</dd></div>
        {b.guests && <div><dt className="text-muted-foreground">Personas</dt><dd>{b.guests}</dd></div>}
        {b.withDriver && <div><dt className="text-muted-foreground">Conductor</dt><dd>Incluido</dd></div>}
      </dl>
      <div className="text-sm space-y-1 border-t pt-3">
        <div className="flex justify-between"><span>{formatXaf(b.unitPrice)} × {bookingDuration(b)}</span><span>{formatXaf(b.unitPrice * b.units)}</span></div>
        {b.driverFee > 0 && <div className="flex justify-between"><span>Conductor</span><span>{formatXaf(b.driverFee)}</span></div>}
        <div className="flex justify-between font-bold text-base"><span>Total</span><span>{formatXaf(b.total)}</span></div>
        {b.deposit > 0 && <div className="flex justify-between text-muted-foreground"><span>Fianza (reembolsable)</span><span>{formatXaf(b.deposit)}</span></div>}
        {showCommission && b.commissionAmount > 0 && <div className="flex justify-between text-xs text-muted-foreground"><span>Comisión Oltinde ({b.commissionPercent}%)</span><span>-{formatXaf(b.commissionAmount)}</span></div>}
      </div>
      {b.message && <p className="text-sm bg-muted rounded p-3"><span className="font-medium">Mensaje del cliente:</span> {b.message}</p>}
      {b.ownerNote && <p className="text-sm bg-muted rounded p-3"><span className="font-medium">Nota de la empresa:</span> {b.ownerNote}</p>}
      {b.cancelReason && <p className="text-sm bg-muted rounded p-3"><span className="font-medium">Motivo de la cancelación:</span> {b.cancelReason}</p>}
    </div>
  );
}

export function CancelBookingButton({ b, token, onDone }: { b: RentalBooking; token?: string; onDone?: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const cancellable = b.status === 'pending' || (b.status === 'accepted' && b.startDate > todayIsoGQ());
  if (!cancellable) return null;

  const confirm = async () => {
    setBusy(true);
    const r = await cancelMyBooking(b.id, token, reason);
    setBusy(false);
    if (!r.success) {
      toast({ title: 'No se pudo cancelar', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Reserva ${b.bookingNumber} cancelada` });
    setOpen(false);
    onDone?.();
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm" className="text-destructive">Cancelar reserva</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cancelar la reserva {b.bookingNumber}?</DialogTitle>
          <DialogDescription>Las fechas quedarán libres y la empresa recibirá un aviso.</DialogDescription>
        </DialogHeader>
        <Textarea rows={2} value={reason} onChange={e => setReason(e.target.value)} placeholder="Motivo (opcional)" maxLength={512} />
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Volver</Button>
          <Button variant="destructive" onClick={confirm} disabled={busy}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Sí, cancelar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
