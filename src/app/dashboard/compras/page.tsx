'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/use-auth';
import { getMyOrders } from '@/lib/shop/orders';
import type { ShopOrder } from '@/lib/shop/types';
import { OrderCard } from '@/components/shop/OrderCard';

type Filter = 'open' | 'done' | 'all';

export default function MyPurchasesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<ShopOrder[] | null>(null);
  const [filter, setFilter] = useState<Filter>('open');

  useEffect(() => {
    if (!loading && !user) router.push('/signin');
  }, [loading, user, router]);

  const load = useCallback(async () => {
    if (user) setOrders(await getMyOrders());
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!orders) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  const isOpen = (o: ShopOrder) => o.status !== 'delivered' && o.status !== 'cancelled';
  const visible = orders.filter(o => filter === 'all' || (filter === 'open' ? isOpen(o) : !isOpen(o)));

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Mis Compras</h1>
        <p className="text-muted-foreground">Pedidos realizados en la Tienda Oltinde.</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 space-y-3 rounded-lg border">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Todavía no ha comprado nada</p>
          <Button asChild><Link href="/tienda">Ir a la tienda</Link></Button>
        </div>
      ) : (
        <>
          <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
            <TabsList>
              <TabsTrigger value="open">En curso ({orders.filter(isOpen).length})</TabsTrigger>
              <TabsTrigger value="done">Finalizados ({orders.filter(o => !isOpen(o)).length})</TabsTrigger>
              <TabsTrigger value="all">Todos</TabsTrigger>
            </TabsList>
          </Tabs>
          {visible.length === 0
            ? <p className="text-center text-muted-foreground py-10">No hay pedidos en esta sección.</p>
            : <div className="space-y-4">{visible.map(o => <OrderCard key={o.id} order={o} onChanged={load} />)}</div>}
        </>
      )}
    </div>
  );
}
