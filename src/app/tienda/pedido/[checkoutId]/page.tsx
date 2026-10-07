import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCheckoutOrders } from '@/lib/shop/orders';
import { formatXaf } from '@/lib/shop/types';
import { OrderCard } from '@/components/shop/OrderCard';

// Receipt page. The checkoutId in the URL is an unguessable UUID, so this
// link is how guests follow their order; it is never indexed.
export const metadata: Metadata = {
  title: 'Su pedido',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function OrderReceiptPage({ params }: { params: Promise<{ checkoutId: string }> }) {
  const { checkoutId } = await params;
  const orders = await getCheckoutOrders(checkoutId);
  if (orders.length === 0) notFound();

  const total = orders.reduce((s, o) => s + o.total, 0);
  const allPending = orders.every(o => o.status === 'pending');

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {allPending && (
        <div className="text-center space-y-2 py-4">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto" />
          <h1 className="text-2xl md:text-3xl font-bold">¡Pedido realizado!</h1>
          <p className="text-muted-foreground">
            {orders.length > 1
              ? `Hemos enviado ${orders.length} pedidos, uno a cada vendedor. Le contactarán para confirmarlos.`
              : `Hemos enviado su pedido a ${orders[0].companyName}. Le contactará para confirmarlo.`}
          </p>
        </div>
      )}
      {!allPending && <h1 className="text-2xl md:text-3xl font-bold">Su compra</h1>}

      <div className="rounded-md border border-amber-300 bg-amber-50 text-amber-900 p-3 text-sm">
        Guarde esta página en favoritos o copie el enlace: con él puede seguir y cancelar su pedido aunque no tenga cuenta.
      </div>

      {orders.map(o => <OrderCard key={o.id} order={o} checkoutId={checkoutId} />)}

      {orders.length > 1 && (
        <p className="text-right font-bold text-lg">Total de la compra: {formatXaf(total)}</p>
      )}

      <div className="flex flex-wrap gap-2 justify-center pt-2">
        <Button asChild><Link href="/tienda">Seguir comprando</Link></Button>
        <Button asChild variant="outline"><Link href="/dashboard/compras">Mis compras</Link></Button>
      </div>
    </div>
  );
}
