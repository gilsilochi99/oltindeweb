'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Car, Home, KeyRound, Loader2, MoreHorizontal, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { SellerGate } from '@/components/shop/SellerGate';
import { deleteRentalListing, getAdvertiserListings, setRentalStatus } from '@/lib/rentals/actions';
import { RENTAL_STATUS_LABELS, headlinePrice, kindLabel, type RentalListing, type RentalStatus } from '@/lib/rentals/types';
import { formatXaf } from '@/lib/shop/types';
import type { Company } from '@/lib/types';

type Filter = 'all' | RentalStatus;

function Listings({ company }: { company: Company }) {
  const { toast } = useToast();
  const [items, setItems] = useState<RentalListing[] | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [deleting, setDeleting] = useState<RentalListing | null>(null);

  const load = useCallback(async () => setItems(await getAdvertiserListings(company.id)), [company.id]);
  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => (items ?? []).filter(l => filter === 'all' || l.status === filter), [items, filter]);
  const count = (s: Filter) => (items ?? []).filter(l => s === 'all' || l.status === s).length;

  const changeStatus = async (l: RentalListing, status: RentalStatus) => {
    const r = await setRentalStatus(l.id, status);
    if (!r.success) {
      toast({ title: 'No se pudo cambiar el estado', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: `Anuncio: ${RENTAL_STATUS_LABELS[status].toLowerCase()}` });
    load();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    const r = await deleteRentalListing(deleting.id);
    setDeleting(null);
    if (!r.success) {
      toast({ title: 'No se pudo eliminar', description: r.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Anuncio eliminado' });
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2"><KeyRound className="w-7 h-7" /> Alquileres</h1>
          <p className="text-muted-foreground">Inmuebles y vehículos de <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link></p>
        </div>
        <Button asChild><Link href={`/dashboard/companies/${company.id}/rentals/new`}><PlusCircle className="mr-2 h-4 w-4" /> Nuevo anuncio</Link></Button>
      </div>

      <Tabs value={filter} onValueChange={v => setFilter(v as Filter)}>
        <TabsList>
          <TabsTrigger value="all">Todos ({count('all')})</TabsTrigger>
          <TabsTrigger value="active">Publicados ({count('active')})</TabsTrigger>
          <TabsTrigger value="draft">Borradores ({count('draft')})</TabsTrigger>
          <TabsTrigger value="archived">Archivados ({count('archived')})</TabsTrigger>
        </TabsList>
      </Tabs>

      {items === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : items.length === 0 ? (
        <Card><CardContent className="py-16 text-center space-y-3">
          <KeyRound className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Todavía no tiene anuncios de alquiler</p>
          <p className="text-sm text-muted-foreground">Publique sus pisos, casas, oficinas o vehículos con precios por día, noche o mes.</p>
          <Button asChild><Link href={`/dashboard/companies/${company.id}/rentals/new`}>Crear el primero</Link></Button>
        </CardContent></Card>
      ) : visible.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No hay anuncios en esta sección.</p>
      ) : (
        <div className="space-y-3">
          {visible.map(l => {
            const price = headlinePrice(l);
            const cover = l.images[0]?.url;
            return (
              <Card key={l.id}>
                <CardContent className="p-4 flex gap-4">
                  <Link href={`/dashboard/companies/${company.id}/rentals/${l.id}`} className="relative w-28 h-20 shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                    {cover ? <Image src={cover} alt="" fill sizes="112px" className="object-cover" /> : l.category === 'property' ? <Home className="w-6 h-6 text-muted-foreground" /> : <Car className="w-6 h-6 text-muted-foreground" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <Link href={`/dashboard/companies/${company.id}/rentals/${l.id}`} className="font-bold hover:underline line-clamp-1">{l.title}</Link>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <Badge variant={l.status === 'active' ? 'default' : 'secondary'}>{RENTAL_STATUS_LABELS[l.status]}</Badge>
                          <span className="text-muted-foreground">{kindLabel(l.category, l.kind)} · {l.city}</span>
                          {l.shortTermEnabled && <Badge variant="outline">Por {l.category === 'property' ? 'noches' : 'días'}</Badge>}
                          {l.longTermEnabled && <Badge variant="outline">Por meses</Badge>}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0 shrink-0"><span className="sr-only">Acciones</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild><Link href={`/dashboard/companies/${company.id}/rentals/${l.id}`}>Editar</Link></DropdownMenuItem>
                          <DropdownMenuItem asChild><Link href={`/alquiler/${l.slug}`} target="_blank">{l.status === 'active' ? 'Ver anuncio' : 'Vista previa'}</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {l.status !== 'active' && <DropdownMenuItem onClick={() => changeStatus(l, 'active')}>Publicar</DropdownMenuItem>}
                          {l.status === 'active' && <DropdownMenuItem onClick={() => changeStatus(l, 'draft')}>Pasar a borrador</DropdownMenuItem>}
                          {l.status !== 'archived' && <DropdownMenuItem onClick={() => changeStatus(l, 'archived')}>Archivar</DropdownMenuItem>}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive" onClick={() => setDeleting(l)}>Eliminar</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <p className="text-sm mt-2">
                      {price ? <><span className="font-semibold">{formatXaf(price.amount)}</span><span className="text-muted-foreground"> / {price.unit}</span></> : <span className="text-muted-foreground">Sin precio</span>}
                      <span className="text-muted-foreground"> · {l.viewCount} visitas</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleting} onOpenChange={open => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar &quot;{deleting?.title}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>Se borrarán el anuncio y sus fotos. Si solo quiere dejar de mostrarlo, archívelo.</AlertDialogDescription>
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

export default function RentalsDashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <Listings company={company} />}</SellerGate>;
}
