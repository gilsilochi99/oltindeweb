import { Store } from 'lucide-react';
import { CUSTOMER_CANCELLABLE, type ShopOrder } from '@/lib/shop/types';
import { CancelOrderButton } from './CancelOrderButton';
import { OrderDeliveryInfo, OrderItems, OrderProgress, OrderStatusBadge, OrderTotals, formatOrderDate } from './OrderParts';

// Customer view of one order (receipt page and "Mis Compras").
export function OrderCard({ order, checkoutId, onChanged }: { order: ShopOrder; checkoutId?: string; onChanged?: () => void }) {
  return (
    <article className="rounded-lg border border-outline-variant bg-card">
      <header className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-b">
        <div>
          <p className="font-semibold">Pedido {order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">{formatOrderDate(order.createdAt)}</p>
        </div>
        <OrderStatusBadge order={order} />
      </header>
      <div className="p-4 space-y-4">
        <p className="text-sm flex items-center gap-2"><Store className="w-4 h-4" /> Vendido por <strong>{order.companyName}</strong></p>
        <OrderProgress order={order} />
        <OrderItems order={order} />
        <div className="grid sm:grid-cols-2 gap-4">
          <OrderDeliveryInfo order={order} />
          <OrderTotals order={order} />
        </div>
        {CUSTOMER_CANCELLABLE.includes(order.status) && (
          <div className="flex justify-end">
            <CancelOrderButton orderId={order.id} orderNumber={order.orderNumber} checkoutId={checkoutId} onCancelled={onChanged} />
          </div>
        )}
      </div>
    </article>
  );
}
