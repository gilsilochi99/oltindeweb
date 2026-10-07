'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerGate } from '@/components/shop/SellerGate';
import { OrderStatusBadge, formatOrderDate } from '@/components/shop/OrderParts';
import { getSellerOrders } from '@/lib/shop/orders';
import { DELIVERY_METHOD_LABELS, formatXaf, type ShopOrder, type ShopOrderStatus } from '@/lib/shop/types';
import type { Company } from '@/lib/types';

type Filter = 'open' | ShopOrderStatus | 'all';

const TABS: { value: Filter; label: string; count?: ShopOrderStatus[] }[] = [
  { value: 'open', label: 'Activos', count: ['pending', 'confirmed', 'processing', 'shipped'] },
  { value: 'pending', label: 'Nuevos', count: ['pending'] },
  { value: 'delivered', label: 'Entregados', count: ['delivered'] },
  { value: 'cancelled', label: 'Cancelados', count: ['cancelled'] },
  { value: 'all', label: 'Todos' },
];

function SellerOrders({ company }: { company: Company }) {
  const [filter, setFilter] = useState<Filter>('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof getSellerOrders>> | null>(null);

  const load = useCallback(async () => {
    setData(null);
    setData(await getSellerOrders(company.id, filter === 'all' ? undefined : filter, page));
  }, [company.id, filter, page]);

  useEffect(() => { load(); }, [load]);

  const countFor = (statuses?: ShopOrderStatus[]) =>
    statuses ? statuses.reduce((s, st) => s + (data?.counts[st] ?? 0), 0) : Object.values(data?.counts ?? {}).reduce((a, b) => a + b, 0);
  const pages = data ? Math.max(1, Math.ceil(data.total / 30)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/dashboard/companies/${company.id}/shop`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Volver a la tienda
        </Link>
        <h1 className="text-3xl font-bold font-headline mt-2">Pedidos</h1>
        <p className="text-muted-foreground">{company.name}</p>
      </div>

      <Tabs value={filter} onValueChange={v => { setFilter(v as Filter); setPage(1); }}>
        <TabsList className="flex-wrap h-auto">
          {TABS.map(t => <TabsTrigger key={t.value} value={t.value}>{t.label}{data ? ` (${countFor(t.count)})` : ''}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      {!data ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : data.orders.length === 0 ? (
        <Card><CardContent className="py-16 text-center space-y-2">
          <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">No hay pedidos aquí</p>
          <p className="text-sm text-muted-foreground">Cuando un cliente compre sus productos, el pedido aparecerá en esta lista y recibirá una notificación.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.orders.map((o: ShopOrder) => (
            <Link key={o.id} href={`/dashboard/companies/${company.id}/shop/orders/${o.id}`} className="block rounded-lg border bg-card hover:bg-muted/50 transition-colors">
              <div className="p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{o.orderNumber}</span>
                    <OrderStatusBadge order={o} />
                  </div>
                  <p className="text-sm truncate">{o.customerName} · {o.items.reduce((n, i) => n + i.quantity, 0)} artículos · {DELIVERY_METHOD_LABELS[o.deliveryMethod]}{o.deliveryCity ? ` (${o.deliveryCity})` : ''}</p>
                  <p className="text-xs text-muted-foreground">{formatOrderDate(o.createdAt)}</p>
                </div>
                <span className="font-bold whitespace-nowrap">{formatXaf(o.total)}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          ))}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm">Página {page} de {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SellerOrdersPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <SellerOrders company={company} />}</SellerGate>;
}
