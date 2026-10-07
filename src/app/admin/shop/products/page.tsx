'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, MoreHorizontal, Package, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { getAdminProducts } from '@/lib/shop/engagement';
import { setProductFeatured, setProductStatus } from '@/lib/shop/actions';
import { PRODUCT_STATUS_LABELS, formatXaf, type ActionResult, type ProductStatus } from '@/lib/shop/types';

const ALL = '__all__';
type Row = Awaited<ReturnType<typeof getAdminProducts>>['items'][number];

export default function AdminShopProductsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Row[]; total: number } | null>(null);

  const load = useCallback(async () => {
    setData(null);
    setData(await getAdminProducts({ q: submitted, status: status === ALL ? undefined : (status as ProductStatus), featured: featuredOnly, page }));
  }, [submitted, status, featuredOnly, page]);

  useEffect(() => { load(); }, [load]);

  const act = async (fn: () => Promise<ActionResult>, ok: string) => {
    const result = await fn();
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: ok });
    load();
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / 30)) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Productos de la Tienda</h1>
        <p className="text-muted-foreground">Destaque productos en la portada o retire los que incumplan las normas (quedan archivados y el vendedor los ve en su panel).</p>
      </div>
      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Productos {data ? `(${data.total})` : ''}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <form className="relative flex-1 min-w-48" onSubmit={e => { e.preventDefault(); setPage(1); setSubmitted(query); }}>
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por producto, marca o empresa" className="pl-8" />
            </form>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {(Object.keys(PRODUCT_STATUS_LABELS) as ProductStatus[]).map(s => <SelectItem key={s} value={s}>{PRODUCT_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={featuredOnly ? 'default' : 'outline'} onClick={() => { setFeaturedOnly(f => !f); setPage(1); }}><Star className="w-4 h-4 mr-2" />Destacados</Button>
          </div>
        </CardHeader>
        <CardContent>
          {!data ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : data.items.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Sin resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map(p => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-56">
                          <div className="relative w-10 h-10 rounded bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {p.image ? <Image src={p.image} alt="" fill sizes="40px" className="object-cover" /> : <Package className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <Link href={`/tienda/p/${p.slug}`} target="_blank" className="font-medium hover:underline line-clamp-2">{p.title}</Link>
                          {p.isFeatured && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 shrink-0" aria-label="Destacado" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm"><Link href={`/tienda/vendedor/${p.companyId}`} target="_blank" className="hover:underline">{p.companyName}</Link></TableCell>
                      <TableCell><Badge variant={p.status === 'active' ? 'default' : 'outline'}>{PRODUCT_STATUS_LABELS[p.status]}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap">{formatXaf(p.minPrice)}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.salesCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.viewCount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Acciones</span><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => act(() => setProductFeatured(p.id, !p.isFeatured), p.isFeatured ? 'Ya no está destacado' : 'Producto destacado')}>
                              {p.isFeatured ? 'Quitar de destacados' : 'Destacar en la portada'}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/dashboard/companies/${p.companyId}/shop/${p.id}`}>Editar</Link></DropdownMenuItem>
                            {p.status === 'active'
                              ? <DropdownMenuItem className="text-destructive" onClick={() => act(() => setProductStatus(p.id, 'archived'), 'Producto retirado de la tienda')}>Retirar de la tienda</DropdownMenuItem>
                              : <DropdownMenuItem onClick={() => act(() => setProductStatus(p.id, 'active'), 'Producto publicado')}>Publicar</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
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
