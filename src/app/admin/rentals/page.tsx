'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { KeyRound, Loader2, MoreHorizontal, Search, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { adminSetRentalStatus, getAdminRentals } from '@/lib/rentals/engagement';
import { setRentalFeatured } from '@/lib/rentals/actions';
import { getRentalFeesForAdmin, saveRentalFees } from '@/lib/rentals/bookings';
import { BOOKING_STATUS_LABELS, RENTAL_STATUS_LABELS, kindLabel, type RentalBookingStatus, type RentalStatus } from '@/lib/rentals/types';
import { formatXaf, type ActionResult } from '@/lib/shop/types';

const ALL = '__all__';
type Data = NonNullable<Awaited<ReturnType<typeof getAdminRentals>>>;

function CommissionCard() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [value, setValue] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { getRentalFeesForAdmin().then(v => setValue(v === undefined ? null : String(v))); }, []);

  const save = async () => {
    setSaving(true);
    const result = await saveRentalFees(Number(value));
    setSaving(false);
    toast(result.success ? { title: 'Comisión guardada', description: 'Se aplica a las reservas nuevas.' } : { title: 'Error', description: result.message, variant: 'destructive' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisión de Oltinde</CardTitle>
        <CardDescription>Porcentaje sobre el importe de cada reserva aceptada. Se guarda en cada reserva al crearla; cambiarlo no afecta a las existentes.</CardDescription>
      </CardHeader>
      <CardContent>
        {value === null ? <Loader2 className="w-5 h-5 animate-spin" /> : (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label htmlFor="rental-commission">Comisión (%)</Label>
              <Input id="rental-commission" type="number" min={0} max={50} step={0.5} className="w-32" value={value} onChange={e => setValue(e.target.value)} disabled={!isAdmin} />
            </div>
            {isAdmin ? (
              <Button onClick={save} disabled={saving}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar</Button>
            ) : (
              <p className="text-sm text-muted-foreground">Solo un administrador puede cambiarla.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminRentalsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [status, setStatus] = useState<string>(ALL);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Data | null | undefined>(undefined);

  const load = useCallback(async () => {
    setData(undefined);
    setData((await getAdminRentals({ q: submitted, status: status === ALL ? undefined : (status as RentalStatus), featured: featuredOnly, page })) ?? null);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-headline">Alquileres</h1>
        <p className="text-muted-foreground">Destaque anuncios en la portada de Alquiler o retire los que incumplan las normas (quedan archivados y la empresa los ve en su panel).</p>
      </div>

      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Anuncios publicados', value: data.statusCounts.active ?? 0 },
            { label: 'Borradores', value: data.statusCounts.draft ?? 0 },
            { label: 'Reservas pendientes', value: data.bookingCounts.pending ?? 0 },
            { label: 'Reservas aceptadas', value: (data.bookingCounts.accepted ?? 0) + (data.bookingCounts.completed ?? 0) },
          ].map(t => (
            <Card key={t.label}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{t.label}</p><p className="text-2xl font-bold tabular-nums">{t.value}</p></CardContent></Card>
          ))}
        </div>
      )}

      <CommissionCard />

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle>Anuncios {data ? `(${data.total})` : ''}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <form className="relative flex-1 min-w-48" onSubmit={e => { e.preventDefault(); setPage(1); setSubmitted(query); }}>
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar por título, ciudad o empresa" className="pl-8" />
            </form>
            <Select value={status} onValueChange={v => { setStatus(v); setPage(1); }}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>Todos</SelectItem>
                {(Object.keys(RENTAL_STATUS_LABELS) as RentalStatus[]).map(s => <SelectItem key={s} value={s}>{RENTAL_STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={featuredOnly ? 'default' : 'outline'} onClick={() => { setFeaturedOnly(f => !f); setPage(1); }}><Star className="w-4 h-4 mr-2" />Destacados</Button>
          </div>
        </CardHeader>
        <CardContent>
          {data === undefined ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : data === null ? (
            <p className="text-center text-muted-foreground py-10">No tiene permiso para ver esta sección.</p>
          ) : data.listings.length === 0 ? (
            <p className="text-center text-muted-foreground py-10">Sin resultados.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anuncio</TableHead>
                    <TableHead>Empresa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Reservas</TableHead>
                    <TableHead className="text-right">Visitas</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.listings.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-56">
                          <div className="relative w-10 h-10 rounded bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                            {l.image ? <Image src={l.image} alt="" fill sizes="40px" className="object-cover" /> : <KeyRound className="w-4 h-4 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0">
                            <Link href={`/alquiler/${l.slug}`} target="_blank" className="font-medium hover:underline line-clamp-2">{l.title}</Link>
                            <p className="text-xs text-muted-foreground">{kindLabel(l.category, l.kind)} · {l.city}{l.ratingCount ? ` · ★ ${l.ratingAvg.toFixed(1)} (${l.ratingCount})` : ''}</p>
                          </div>
                          {l.isFeatured && <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 shrink-0" aria-label="Destacado" />}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm"><Link href={`/companies/${l.companyId}`} target="_blank" className="hover:underline">{l.companyName}</Link></TableCell>
                      <TableCell><Badge variant={l.status === 'active' ? 'default' : 'outline'}>{RENTAL_STATUS_LABELS[l.status]}</Badge></TableCell>
                      <TableCell className="text-right whitespace-nowrap text-sm">
                        {l.dailyPrice ? <div>{formatXaf(l.dailyPrice)} / {l.category === 'property' ? 'noche' : 'día'}</div> : null}
                        {l.monthlyPrice ? <div>{formatXaf(l.monthlyPrice)} / mes</div> : null}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{l.bookingCount}</TableCell>
                      <TableCell className="text-right tabular-nums">{l.viewCount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Acciones</span><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => act(() => setRentalFeatured(l.id, !l.isFeatured), l.isFeatured ? 'Ya no está destacado' : 'Anuncio destacado')}>
                              {l.isFeatured ? 'Quitar de destacados' : 'Destacar en Alquiler'}
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild><Link href={`/dashboard/companies/${l.companyId}/rentals/${l.id}`}>Editar</Link></DropdownMenuItem>
                            {l.status === 'active'
                              ? <DropdownMenuItem className="text-destructive" onClick={() => act(() => adminSetRentalStatus(l.id, 'archived'), 'Anuncio retirado')}>Retirar anuncio</DropdownMenuItem>
                              : <DropdownMenuItem onClick={() => act(() => adminSetRentalStatus(l.id, 'active'), 'Anuncio publicado')}>Volver a publicar</DropdownMenuItem>}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {data && data.pageCount > 1 && (
            <div className="flex justify-center items-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Anterior</Button>
              <span className="text-sm">Página {page} de {data.pageCount}</span>
              <Button variant="outline" size="sm" disabled={page >= data.pageCount} onClick={() => setPage(p => p + 1)}>Siguiente</Button>
            </div>
          )}
          {data && Object.keys(data.bookingCounts).length > 0 && (
            <p className="text-xs text-muted-foreground pt-4">
              Reservas en total: {(Object.entries(data.bookingCounts) as [RentalBookingStatus, number][]).map(([s, n]) => `${BOOKING_STATUS_LABELS[s].toLowerCase()} ${n}`).join(' · ')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
