'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import { SellerGate } from '@/components/shop/SellerGate';
import { OrderDeliveryInfo, OrderItems, OrderProgress, OrderStatusBadge, OrderTotals, formatOrderDate, statusLabel } from '@/components/shop/OrderParts';
import { getSellerOrder, setOrderPaymentStatus, updateOrderStatus } from '@/lib/shop/orders';
import { ORDER_TRANSITIONS, PAYMENT_STATUS_LABELS, type ShopOrder, type ShopOrderStatus, type ShopPaymentStatus } from '@/lib/shop/types';

// Primary action per status, then the other allowed moves as secondary buttons.
const NEXT_LABEL: Partial<Record<ShopOrderStatus, string>> = {
  confirmed: 'Confirmar pedido',
  processing: 'Empezar a preparar',
  delivered: 'Marcar como entregado',
};

function OrderDetail({ orderId, companyId }: { orderId: string; companyId: string }) {
  const { toast } = useToast();
  const [order, setOrder] = useState<ShopOrder | null | 'missing'>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [pending, setPending] = useState<ShopOrderStatus | null>(null); // status awaiting a note
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const o = await getSellerOrder(orderId);
    setOrder(o && o.companyId === companyId ? o : 'missing');
  }, [orderId, companyId]);

  useEffect(() => { load(); }, [load]);

  if (order === 'missing') notFound();
  if (!order) return <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const move = async (status: ShopOrderStatus, withNote?: string) => {
    setBusy(status);
    const result = await updateOrderStatus(order.id, status, withNote);
    setBusy(null);
    if (!result.success) {
      toast({ title: 'No se pudo actualizar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Pedido: ${statusLabel(order, status).toLowerCase()}`, description: order.customerId ? 'El cliente ha recibido una notificación.' : undefined });
    setPending(null);
    setNote('');
    load();
  };

  const changePayment = async (paymentStatus: ShopPaymentStatus) => {
    const result = await setOrderPaymentStatus(order.id, paymentStatus);
    if (!result.success) toast({ title: 'Error', description: result.message, variant: 'destructive' });
    load();
  };

  const allowed = ORDER_TRANSITIONS[order.status];
  const phoneDigits = order.customerPhone.replace(/[^\d]/g, '');
  const whatsapp = phoneDigits.length >= 6
    ? toWhatsAppHref(phoneDigits, `Hola ${order.customerName}, le escribimos de ${order.companyName} sobre su pedido ${order.orderNumber} en Oltinde.`)
    : undefined;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href={`/dashboard/companies/${companyId}/shop/orders`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a pedidos
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-3xl font-bold font-headline">Pedido {order.orderNumber}</h1>
          <OrderStatusBadge order={order} />
        </div>
        <p className="text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
      </div>

      {allowed.length > 0 && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-2">
            {allowed.filter(s => s !== 'cancelled').map((s, i) => (
              <Button key={s} variant={i === 0 ? 'default' : 'outline'} disabled={!!busy} onClick={() => (s === 'shipped' ? setPending('shipped') : move(s))}>
                {busy === s && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {NEXT_LABEL[s] ?? (s === 'shipped' ? (order.deliveryMethod === 'pickup' ? 'Avisar: listo para recoger' : 'Marcar como enviado') : statusLabel(order, s))}
              </Button>
            ))}
            <Button variant="ghost" className="text-destructive ml-auto" disabled={!!busy} onClick={() => setPending('cancelled')}>Cancelar pedido</Button>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-[1fr_300px] gap-6 items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Progreso</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <OrderProgress order={order} />
              <ul className="text-sm space-y-1 border-t pt-3">
                {order.events.map(e => (
                  <li key={e.id} className="flex gap-2">
                    <span className="text-muted-foreground whitespace-nowrap">{formatOrderDate(e.createdAt)}</span>
                    <span><strong>{statusLabel(order, e.status)}</strong>{e.note ? ` — ${e.note}` : ''}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Artículos</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <OrderItems order={order} />
              <OrderTotals order={order} showCommission />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Cliente</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="font-semibold">{order.customerName}</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4" /><a href={`tel:${order.customerPhone.replace(/\s/g, '')}`} className="hover:underline">{order.customerPhone}</a></p>
              {order.customerEmail && <p className="flex items-center gap-2 break-all"><Mail className="w-4 h-4 shrink-0" /><a href={`mailto:${order.customerEmail}`} className="hover:underline">{order.customerEmail}</a></p>}
              {whatsapp && (
                <Button asChild variant="outline" size="sm" className="w-full">
                  <a href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 mr-2" /> Escribir por WhatsApp</a>
                </Button>
              )}
              {!order.customerId && <p className="text-xs text-muted-foreground">Compra como invitado: no recibe notificaciones en la app, avísele por teléfono o WhatsApp.</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Entrega y pago</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <OrderDeliveryInfo order={order} />
              <div className="space-y-1">
                <p className="text-sm font-medium">Estado del pago</p>
                <Select value={order.paymentStatus} onValueChange={v => changePayment(v as ShopPaymentStatus)}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(PAYMENT_STATUS_LABELS) as ShopPaymentStatus[]).map(p => <SelectItem key={p} value={p}>{PAYMENT_STATUS_LABELS[p]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!pending} onOpenChange={open => { if (!open) { setPending(null); setNote(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pending === 'cancelled' ? 'Cancelar pedido' : order.deliveryMethod === 'pickup' ? 'Pedido listo para recoger' : 'Pedido enviado'}</DialogTitle>
            <DialogDescription>
              {pending === 'cancelled'
                ? 'Indique el motivo: el cliente lo verá. El stock de los productos se repondrá automáticamente.'
                : 'Puede añadir un mensaje para el cliente (opcional), por ejemplo la hora de entrega o de recogida.'}
            </DialogDescription>
          </DialogHeader>
          <Textarea rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={512} placeholder={pending === 'cancelled' ? 'Motivo de la cancelación' : 'Mensaje para el cliente'} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>Volver</Button>
            <Button
              variant={pending === 'cancelled' ? 'destructive' : 'default'}
              disabled={!!busy || (pending === 'cancelled' && note.trim().length < 3)}
              onClick={() => pending && move(pending, note)}
            >
              {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function SellerOrderPage({ params }: { params: Promise<{ companyId: string; orderId: string }> }) {
  const { companyId, orderId } = use(params);
  return <SellerGate companyId={companyId}>{() => <OrderDetail orderId={orderId} companyId={companyId} />}</SellerGate>;
}
