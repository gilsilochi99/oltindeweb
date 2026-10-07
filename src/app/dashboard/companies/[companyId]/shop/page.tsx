'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, ExternalLink, Loader2, MoreHorizontal, Package, PlusCircle, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SellerGate } from '@/components/shop/SellerGate';
import { StockAdjustDialog } from '@/components/shop/StockAdjustDialog';
import { getSellerProducts } from '@/lib/shop/data';
import { deleteProduct, setProductStatus } from '@/lib/shop/actions';
import { PRODUCT_STATUS_LABELS, formatXaf, type Product, type ProductStatus } from '@/lib/shop/types';
import type { Company } from '@/lib/types';

const LOW_STOCK = 5;

type Filter = 'all' | ProductStatus | 'out';

function priceLabel(p: Product) {
  if (p.variants.length === 0) return '—';
  return p.minPrice === p.maxPrice ? formatXaf(p.minPrice) : `${formatXaf(p.minPrice)} – ${formatXaf(p.maxPrice)}`;
}

function stockLabel(p: Product) {
  const tracked = p.variants.some(v => v.trackInventory);
  if (!tracked) return { text: 'Sin control de stock', warn: false };
  if (!p.inStock) return { text: 'Agotado', warn: true };
  return { text: `${p.totalStock} en stock`, warn: p.totalStock <= LOW_STOCK };
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const variant = status === 'active' ? 'default' : status === 'draft' ? 'secondary' : 'outline';
  return <Badge variant={variant}>{PRODUCT_STATUS_LABELS[status]}</Badge>;
}

function ShopProducts({ company }: { company: Company }) {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const load = useCallback(async () => {
    setProducts(await getSellerProducts(company.id));
  }, [company.id]);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    const list = products ?? [];
    return {
      all: list.length,
      active: list.filter(p => p.status === 'active').length,
      draft: list.filter(p => p.status === 'draft').length,
      archived: list.filter(p => p.status === 'archived').length,
      out: list.filter(p => p.status !== 'archived' && !p.inStock).length,
    };
  }, [products]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (products ?? []).filter(p => {
      const matchesFilter = filter === 'all' || (filter === 'out' ? p.status !== 'archived' && !p.inStock : p.status === filter);
      const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.variants.some(v => v.sku?.toLowerCase().includes(q));
      return matchesFilter && matchesQuery;
    });
  }, [products, filter, query]);

  const changeStatus = async (product: Product, status: ProductStatus) => {
    const result = await setProductStatus(product.id, status);
    if (!result.success) {
      toast({ title: 'No se pudo cambiar el estado', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Producto: ${PRODUCT_STATUS_LABELS[status].toLowerCase()}` });
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const result = await deleteProduct(deleting.id);
    setDeleting(null);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Producto eliminado' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><ShoppingBag className="w-7 h-7" /> Tienda</h1>
          <p className="text-muted-foreground">
            Productos de <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/tienda/vendedor/${company.id}`} target="_blank"><ExternalLink className="mr-2 h-4 w-4" /> Ver mi tienda</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/companies/${company.id}/shop/new`}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir producto
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Todos ({counts.all})</TabsTrigger>
            <TabsTrigger value="active">Publicados ({counts.active})</TabsTrigger>
            <TabsTrigger value="draft">Borradores ({counts.draft})</TabsTrigger>
            <TabsTrigger value="out">Agotados ({counts.out})</TabsTrigger>
            <TabsTrigger value="archived">Archivados ({counts.archived})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="relative sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por nombre o SKU" className="pl-8" />
        </div>
      </div>

      {products === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <Package className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-semibold">Todavía no tiene productos</p>
            <p className="text-sm text-muted-foreground">Añada su primer producto con precio, fotos y stock para empezar a vender en Oltinde.</p>
            <Button asChild><Link href={`/dashboard/companies/${company.id}/shop/new`}>Añadir producto</Link></Button>
          </CardContent>
        </Card>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">Ningún producto coincide con el filtro.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(product => {
            const stock = stockLabel(product);
            const cover = product.images[0]?.url;
            return (
              <Card key={product.id}>
                <CardContent className="p-4 flex gap-4">
                  <Link href={`/dashboard/companies/${company.id}/shop/${product.id}`} className="shrink-0">
                    {cover ? (
                      <Image src={cover} alt={product.title} width={80} height={80} className="w-20 h-20 rounded-md object-cover bg-muted" />
                    ) : (
                      <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center"><Package className="w-6 h-6 text-muted-foreground" /></div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/dashboard/companies/${company.id}/shop/${product.id}`} className="font-bold hover:underline line-clamp-1">{product.title}</Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <StatusBadge status={product.status} />
                          {product.isFeatured && <Badge variant="outline">Destacado</Badge>}
                          {product.isOnSale && <Badge variant="outline" className="border-red-500 text-red-600">En oferta</Badge>}
                          {product.options.length > 0 && <span className="text-xs text-muted-foreground">{product.variants.length} variantes</span>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><span className="sr-only">Acciones</span><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/companies/${company.id}/shop/${product.id}`}>Editar</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/tienda/p/${product.slug}`} target="_blank">{product.status === 'active' ? 'Ver en la tienda' : 'Vista previa'}</Link></DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setStockProduct(product)}>Ajustar stock</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {product.status !== 'active' && <DropdownMenuItem onClick={() => changeStatus(product, 'active')}>Publicar</DropdownMenuItem>}
                          {product.status === 'active' && <DropdownMenuItem onClick={() => changeStatus(product, 'draft')}>Pasar a borrador</DropdownMenuItem>}
                          {product.status !== 'archived' && <DropdownMenuItem onClick={() => changeStatus(product, 'archived')}>Archivar</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(product)}>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm">
                      <span className="font-semibold">{priceLabel(product)}</span>
                      <span className={stock.warn ? 'text-amber-600 flex items-center gap-1' : 'text-muted-foreground'}>
                        {stock.warn && <AlertTriangle className="w-3.5 h-3.5" />}{stock.text}
                      </span>
                      {product.salesCount > 0 && <span className="text-muted-foreground">{product.salesCount} vendidos</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <StockAdjustDialog product={stockProduct} onOpenChange={open => !open && setStockProduct(null)} onAdjusted={load} />

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{deleting?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              Se borrarán el producto, sus variantes y sus imágenes. Esta acción no se puede deshacer. Si solo quiere dejar de venderlo, archívelo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Sí, eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function CompanyShopPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <ShopProducts company={company} />}</SellerGate>;
}
