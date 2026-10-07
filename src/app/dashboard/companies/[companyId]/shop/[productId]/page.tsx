'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SellerGate } from '@/components/shop/SellerGate';
import { ProductForm } from '@/components/shop/ProductForm';
import { getInventoryHistory, getProductCategories, getProductForEdit } from '@/lib/shop/data';
import { PRODUCT_STATUS_LABELS, type Product, type ProductCategory } from '@/lib/shop/types';

type Movement = Awaited<ReturnType<typeof getInventoryHistory>>[number];

const REASON_LABELS: Record<Movement['reason'], string> = {
  initial: 'Stock inicial',
  adjustment: 'Ajuste manual',
  sale: 'Venta',
  cancellation: 'Pedido cancelado',
  return: 'Devolución',
};

function InventoryHistory({ productId }: { productId: string }) {
  const [moves, setMoves] = useState<Movement[] | null>(null);

  useEffect(() => {
    getInventoryHistory(productId).then(setMoves);
  }, [productId]);

  if (moves === null) return <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (moves.length === 0) return <p className="text-sm text-muted-foreground py-6 text-center">Sin movimientos de stock todavía.</p>;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Fecha</TableHead>
            <TableHead>Variante</TableHead>
            <TableHead>Motivo</TableHead>
            <TableHead className="text-right">Cambio</TableHead>
            <TableHead className="text-right">Stock final</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moves.map(m => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap text-sm">{new Date(m.createdAt).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })}</TableCell>
              <TableCell className="text-sm">{m.variantTitle}</TableCell>
              <TableCell className="text-sm">
                {REASON_LABELS[m.reason]}
                {m.note && <span className="block text-xs text-muted-foreground">{m.note}</span>}
              </TableCell>
              <TableCell className={`text-right font-medium ${m.delta > 0 ? 'text-green-600' : 'text-red-600'}`}>{m.delta > 0 ? `+${m.delta}` : m.delta}</TableCell>
              <TableCell className="text-right">{m.stockAfter}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function EditProductPage({ params }: { params: Promise<{ companyId: string; productId: string }> }) {
  const { companyId, productId } = use(params);
  const router = useRouter();
  const [data, setData] = useState<{ product: Product; categories: ProductCategory[] } | null | 'missing'>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    Promise.all([getProductForEdit(productId), getProductCategories()]).then(([product, categories]) => {
      setData(product && product.companyId === companyId ? { product, categories } : 'missing');
    });
  }, [productId, companyId, formKey]);

  if (data === 'missing') notFound();

  return (
    <SellerGate companyId={companyId}>
      {company => (
        <div className="space-y-6 max-w-4xl">
          <div>
            <Link href={`/dashboard/companies/${companyId}/shop`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Volver a la tienda
            </Link>
            <h1 className="text-3xl font-bold font-headline mt-2 flex items-center gap-3 flex-wrap">
              Editar Producto
              {data && <Badge variant={data.product.status === 'active' ? 'default' : 'secondary'}>{PRODUCT_STATUS_LABELS[data.product.status]}</Badge>}
            </h1>
            <p className="text-muted-foreground">{company.name}</p>
          </div>
          {data === null ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <Tabs defaultValue="details">
              <TabsList>
                <TabsTrigger value="details">Detalles</TabsTrigger>
                <TabsTrigger value="inventory">Historial de stock</TabsTrigger>
              </TabsList>
              <TabsContent value="details" className="mt-4">
                <ProductForm
                  key={formKey}
                  companyId={companyId}
                  categories={data.categories}
                  initialData={data.product}
                  onSaved={() => {
                    // Reload so variant ids and loaded stock match the saved state.
                    setData(null);
                    setFormKey(k => k + 1);
                    router.refresh();
                  }}
                />
              </TabsContent>
              <TabsContent value="inventory" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Movimientos de stock</CardTitle>
                    <CardDescription>Últimos 100 cambios: ajustes, ventas y cancelaciones.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <InventoryHistory key={formKey} productId={productId} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </SellerGate>
  );
}
