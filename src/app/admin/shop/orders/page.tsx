'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { getAllShopOrders, getShopFeesForAdmin, saveShopFees } from '@/lib/shop/orders';
import { ORDER_STATUS_LABELS, formatXaf, type ShopOrderStatus } from '@/lib/shop/types';
import { OrderStatusBadge, formatOrderDate } from '@/components/shop/OrderParts';

const ALL = '__all__';

function FeesCard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [fees, setFees] = useState<{ commissionPercent: string; muniDineroCommissionPercent: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getShopFeesForAdmin().then(f => f && setFees({ commissionPercent: String(f.commissionPercent), muniDineroCommissionPercent: String(f.muniDineroCommissionPercent) }));
  }, []);

  if (!fees) return null;

  const save = async () => {
    setSaving(true);
    const result = await saveShopFees({ commissionPercent: Number(fees.commissionPercent), muniDineroCommissionPercent: Number(fees.muniDineroCommissionPercent) });
    setSaving(false);
    toast(result.success ? { title: 'Comisiones guardadas', description: 'Se aplican a los pedidos nuevos.' } : { title: 'Error', description: result.message, variant: 'destructive' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisiones de la tienda</CardTitle>
        <CardDescription>Porcentaje sobre el subtotal de cada pedido que Oltinde retiene al vendedor. No cambia lo que paga el cliente. Solo afecta a pedidos nuevos.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-end gap-4">
        <div className="space-y-2 w-48">
          <Label htmlFor="fee-base">Comisión general (%)</Label>
          <Input id="fee-base" type="number" min={0} max={50} step="0.5" value={fees.commissionPercent} disabled={!isAdmin} onChange={e => setFees({ ...fees, commissionPercent: e.target.value })} />
        </div>
        <div className="space-y-2 w-48">
          <Label htmlFor="fee-muni">Extra con Muni Dinero (%)</Label>
          <Input id="fee-muni" type="number" min={0} max={50} step="0.5" value={fees.muniDineroCommissionPercent} disabled={!isAdmin} onChange={e => setFees({ ...fees, muniDineroCommissionPercent: e.target.value })} />
        </div>
        {isAdmin && <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar</Button>}
      </CardContent>
    </Card>
  );
}

export default function AdminShopOrdersPage() {
  const [status, setStatus] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Awaited<ReturnType<typeof getAllShopOrders>> | null>(null);

  const load = useCallback(async () => {
    setData(null);
    setData(await getAllShopOrders(status === ALL ? undefined : (status as ShopOrderStatus), page));
  }, [status, page]);

  useEffect(() => { load(); }, [load]);

  const pages = data ? Math.max(1, Math.ceil(data.total / 30)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Pedidos de la Tienda</h1>
        <p className="text-muted-foreground">Todos los pedidos del marketplace.</p>
      </div>

      <FeesCard />

      {data && (
        <div className="grid sm:grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pedidos{status !== ALL ? ` (${ORDER_STATUS_LABELS[status as ShopOrderStatus].toLowerCase()})` : ''}</p><p className="text-2xl font-bold">{data.total}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Ventas entregadas</p><p className="text-2xl font-bold">{formatXaf(data.totals.gross)}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Comisiones (entregados)</p><p className="text-2xl font-bold">{formatXaf(data.totals.commission)}</p></CardContent></Card>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle>Pedidos</CardTitle>
          <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Todos los estados</SelectItem>
              {(Object.keys(ORDER_STATUS_LABELS) as ShopOrderStatus[]).map(s => <SelectItem key={s} value={s}>{ORDER_STATUS_LABELS[s]}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : data.orders.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">No hay pedidos.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Comisión</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.orders.map(o => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        <Link href={`/dashboard/companies/${o.companyId}/shop/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-sm">{formatOrderDate(o.createdAt)}</TableCell>
                      <TableCell className="text-sm">{o.companyName}</TableCell>
                      <TableCell className="text-sm">{o.customerName}<span className="block text-xs text-muted-foreground">{o.customerPhone}</span></TableCell>
                      <TableCell><OrderStatusBadge order={o} /></TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatXaf(o.total)}</TableCell>
                      <TableCell className="text-right whitespace-nowrap text-sm">{formatXaf(o.commissionAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {pages > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm">Página {page} de {pages}</span>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
