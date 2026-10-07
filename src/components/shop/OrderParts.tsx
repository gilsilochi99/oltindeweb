import Link from 'next/link';
import Image from 'next/image';
import { Check, Package, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, PAYMENT_STATUS_LABELS, formatXaf,
  type ShopOrder, type ShopOrderStatus,
} from '@/lib/shop/types';

const STATUS_STYLES: Record<ShopOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-300',
  confirmed: 'bg-blue-100 text-blue-900 border-blue-300',
  processing: 'bg-indigo-100 text-indigo-900 border-indigo-300',
  shipped: 'bg-purple-100 text-purple-900 border-purple-300',
  delivered: 'bg-green-100 text-green-900 border-green-300',
  cancelled: 'bg-red-100 text-red-900 border-red-300',
};

// "Enviado / Listo" reads better as the specific one for each delivery method.
export function statusLabel(order: Pick<ShopOrder, 'status' | 'deliveryMethod'>, status: ShopOrderStatus = order.status) {
  if (status === 'shipped') return order.deliveryMethod === 'pickup' ? 'Listo para recoger' : 'En camino';
  return ORDER_STATUS_LABELS[status];
}

export function OrderStatusBadge({ order }: { order: Pick<ShopOrder, 'status' | 'deliveryMethod'> }) {
  return <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[order.status])}>{statusLabel(order)}</Badge>;
}

const FLOW: ShopOrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export function OrderProgress({ order }: { order: ShopOrder }) {
  if (order.status === 'cancelled') {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-900 flex gap-2">
        <X className="w-4 h-4 mt-0.5 shrink-0" />
        <div><p className="font-semibold">Pedido cancelado</p>{order.cancelReason && <p>{order.cancelReason}</p>}</div>
      </div>
    );
  }
  const reached = new Set(order.events.map(e => e.status));
  const currentIndex = FLOW.indexOf(order.status);
  return (
    <ol className="flex items-start">
      {FLOW.map((s, i) => {
        const done = i <= currentIndex || reached.has(s);
        const at = order.events.find(e => e.status === s);
        return (
          <li key={s} className="flex-1 flex flex-col items-center text-center relative">
            {i > 0 && <span className={cn('absolute top-3 right-1/2 w-full h-0.5', i <= currentIndex ? 'bg-green-600' : 'bg-muted')} aria-hidden />}
            <span className={cn('relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2', done ? 'bg-green-600 border-green-600 text-white' : 'bg-background border-muted')}>
              {done && <Check className="w-3.5 h-3.5" />}
            </span>
            <span className={cn('mt-1 text-[11px] leading-tight', done ? 'text-foreground font-medium' : 'text-muted-foreground')}>{statusLabel(order, s)}</span>
            {at && <span className="text-[10px] text-muted-foreground">{new Date(at.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>}
          </li>
        );
      })}
    </ol>
  );
}

export function OrderItems({ order, linkProducts = true }: { order: ShopOrder; linkProducts?: boolean }) {
  return (
    <ul className="divide-y">
      {order.items.map(item => {
        const title = (
          <>
            <span className="font-medium">{item.productTitle}</span>
            {item.variantTitle !== 'Estándar' && <span className="text-muted-foreground"> · {item.variantTitle}</span>}
          </>
        );
        return (
          <li key={item.id} className="flex gap-3 py-2.5">
            <div className="relative w-12 h-12 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {item.image ? <Image src={item.image} alt="" fill sizes="48px" className="object-cover" /> : <Package className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0 text-sm">
              <p className="line-clamp-2">
                {linkProducts && item.productSlug ? <Link href={`/tienda/p/${item.productSlug}`} className="hover:underline">{title}</Link> : title}
              </p>
              <p className="text-muted-foreground">{item.quantity} × {formatXaf(item.unitPrice)}{item.sku ? ` · Ref ${item.sku}` : ''}</p>
            </div>
            <span className="text-sm font-medium whitespace-nowrap">{formatXaf(item.lineTotal)}</span>
          </li>
        );
      })}
    </ul>
  );
}

export function OrderTotals({ order, showCommission = false }: { order: ShopOrder; showCommission?: boolean }) {
  return (
    <dl className="text-sm space-y-1">
      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{formatXaf(order.subtotal)}</dd></div>
      {order.deliveryMethod === 'delivery' && (
        <div className="flex justify-between"><dt className="text-muted-foreground">Envío</dt><dd>{order.deliveryFee === 0 ? 'Gratis' : formatXaf(order.deliveryFee)}</dd></div>
      )}
      {order.discount > 0 && <div className="flex justify-between text-green-700"><dt>Descuento{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>-{formatXaf(order.discount)}</dd></div>}
      <div className="flex justify-between font-bold text-base pt-1 border-t"><dt>Total</dt><dd>{formatXaf(order.total)}</dd></div>
      {showCommission && order.commissionAmount > 0 && (
        <div className="flex justify-between text-xs text-muted-foreground pt-1">
          <dt>Comisión Oltinde ({order.commissionPercent}%)</dt><dd>-{formatXaf(order.commissionAmount)}</dd>
        </div>
      )}
    </dl>
  );
}

export function OrderDeliveryInfo({ order }: { order: ShopOrder }) {
  return (
    <dl className="text-sm grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
      <dt className="text-muted-foreground">Entrega</dt>
      <dd>{DELIVERY_METHOD_LABELS[order.deliveryMethod]}{order.deliveryCity ? ` · ${order.deliveryCity}` : ''}</dd>
      {order.deliveryAddress && (<><dt className="text-muted-foreground">Dirección</dt><dd>{order.deliveryAddress}</dd></>)}
      <dt className="text-muted-foreground">Pago</dt>
      <dd>{PAYMENT_METHOD_LABELS[order.paymentMethod]} · {PAYMENT_STATUS_LABELS[order.paymentStatus]}</dd>
      {order.notes && (<><dt className="text-muted-foreground">Notas</dt><dd className="whitespace-pre-line">{order.notes}</dd></>)}
    </dl>
  );
}

export function formatOrderDate(iso: string) {
  return new Date(iso).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
}
