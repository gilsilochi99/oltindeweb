'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerGate } from '@/components/shop/SellerGate';
import { getRentalStats } from '@/lib/rentals/engagement';
import { formatXaf } from '@/lib/shop/types';
import type { RentalStats } from '@/lib/rentals/types';
import type { Company } from '@/lib/types';

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tabular-nums mt-1">{value}</p>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </CardContent>
    </Card>
  );
}

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });

// Single-series column chart: booking requests per day. One hue, no legend
// (the card title names the series), recessive gridlines, per-bar tooltip
// (with how many were accepted) and a table view.
function DailyRequestsChart({ daily }: { daily: RentalStats['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(...daily.map(d => d.requests), 1);
  const ticks = [0, Math.round(max / 2), max];
  const labelEvery = Math.ceil(daily.length / 8);

  if (asTable) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end"><Button variant="link" size="sm" onClick={() => setAsTable(false)}>Ver gráfico</Button></div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Día</th><th className="py-1 font-medium text-right">Solicitudes</th><th className="py-1 font-medium text-right">Aceptadas</th></tr></thead>
            <tbody>
              {daily.map(d => (
                <tr key={d.date} className="border-t"><td className="py-1">{shortDate(d.date)}</td><td className="py-1 text-right tabular-nums">{d.requests}</td><td className="py-1 text-right tabular-nums">{d.accepted}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end"><Button variant="link" size="sm" onClick={() => setAsTable(true)}>Ver como tabla</Button></div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between h-48 text-[11px] text-muted-foreground tabular-nums text-right w-8 shrink-0 -mt-1.5">
          {[...ticks].reverse().map((t, i) => <span key={i}>{t}</span>)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-48" role="img" aria-label={`Solicitudes de reserva por día. Máximo ${max}.`}>
            {[0, 0.5, 1].map(f => <div key={f} className="absolute inset-x-0 border-t border-muted" style={{ bottom: `${f * 100}%` }} aria-hidden />)}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {daily.map((d, i) => (
                <div key={d.date} className="relative flex-1 h-full flex items-end justify-center cursor-default" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <div
                    className="w-full max-w-6 rounded-t bg-[#2a78d6] dark:bg-[#3987e5] transition-opacity"
                    style={{ height: d.requests > 0 ? `max(2px, ${(d.requests / max) * 100}%)` : 0, opacity: hover === null || hover === i ? 1 : 0.45 }}
                  />
                  {hover === i && (
                    <div className={`absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs ${i > daily.length / 2 ? 'right-0' : 'left-0'}`}>
                      <p className="font-semibold">{shortDate(d.date)}</p>
                      <p>Solicitudes: <span className="tabular-nums font-medium">{d.requests}</span></p>
                      <p>Aceptadas: <span className="tabular-nums font-medium">{d.accepted}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-[2px] mt-1 text-[11px] text-muted-foreground">
            {daily.map((d, i) => <span key={d.date} className="flex-1 text-center whitespace-nowrap">{i % labelEvery === 0 ? shortDate(d.date) : ''}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats({ company }: { company: Company }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<RentalStats | null | undefined>(undefined);

  useEffect(() => {
    setStats(undefined);
    getRentalStats(company.id, days).then(s => setStats(s ?? null));
  }, [company.id, days]);

  const base = `/dashboard/companies/${company.id}/rentals`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-headline">Estadísticas de alquiler</h1>
          <p className="text-muted-foreground">{company.name}</p>
        </div>
        <Tabs value={String(days)} onValueChange={v => setDays(Number(v))}>
          <TabsList>
            <TabsTrigger value="7">7 días</TabsTrigger>
            <TabsTrigger value="30">30 días</TabsTrigger>
            <TabsTrigger value="90">90 días</TabsTrigger>
            <TabsTrigger value="365">1 año</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {stats === undefined ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : stats === null ? (
        <p className="text-muted-foreground">No se pudieron cargar las estadísticas.</p>
      ) : (
        <>
          {stats.pending > 0 && (
            <Link href={`${base}/bookings`} className="inline-flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm hover:underline">
              <AlertTriangle className="w-4 h-4" />{stats.pending} {stats.pending === 1 ? 'solicitud espera' : 'solicitudes esperan'} su respuesta
            </Link>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile label="Ingresos reservados" value={formatXaf(stats.revenue)} hint={stats.commission > 0 ? `Neto tras comisión: ${formatXaf(stats.revenue - stats.commission)}` : 'Reservas aceptadas y finalizadas'} />
            <Tile label="Solicitudes" value={String(stats.requests)} hint={`${stats.accepted} aceptadas · ${stats.rejected} rechazadas · ${stats.cancelled} canceladas`} />
            <Tile label="Tasa de aceptación" value={`${Math.round(stats.acceptanceRate * 100)}%`} hint="Entre las solicitudes respondidas" />
            <Tile
              label="Ocupación vendida"
              value={`${stats.unitsBooked} ${stats.unitsBooked === 1 ? 'día/noche' : 'días/noches'}`}
              hint={stats.monthsBooked ? `+ ${stats.monthsBooked} ${stats.monthsBooked === 1 ? 'mes' : 'meses'} de alquiler mensual` : `${stats.views.toLocaleString('es-ES')} visitas a sus anuncios (total)`}
            />
          </div>

          <Card>
            <CardHeader className="pb-0"><CardTitle className="text-base">Solicitudes de reserva por día</CardTitle></CardHeader>
            <CardContent><DailyRequestsChart daily={stats.daily} /></CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Anuncios con más interés</CardTitle></CardHeader>
              <CardContent>
                {stats.topListings.length === 0 ? <p className="text-sm text-muted-foreground">Sin visitas ni solicitudes en este periodo.</p> : (
                  <ol className="space-y-2 text-sm">
                    {stats.topListings.map((l, i) => (
                      <li key={l.listingId ?? l.title} className="flex justify-between gap-3">
                        <span className="truncate"><span className="text-muted-foreground mr-2">{i + 1}.</span>{l.listingId ? <Link href={`${base}/${l.listingId}`} className="hover:underline">{l.title}</Link> : l.title}</span>
                        <span className="whitespace-nowrap tabular-nums text-muted-foreground">{l.views} visitas · {l.requests} solic. · {l.accepted} acept.</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Próximas llegadas</CardTitle></CardHeader>
              <CardContent>
                {stats.upcoming.length === 0 ? <p className="text-sm text-muted-foreground">No hay reservas aceptadas próximas.</p> : (
                  <ul className="space-y-2 text-sm">
                    {stats.upcoming.map(b => (
                      <li key={b.id} className="flex justify-between gap-3">
                        <span className="truncate">{b.customerName} · {b.listingTitle}</span>
                        <span className="whitespace-nowrap tabular-nums text-muted-foreground">{shortDate(b.startDate)} → {shortDate(b.endDate)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

export default function RentalStatsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <Stats company={company} />}</SellerGate>;
}
