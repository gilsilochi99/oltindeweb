'use client';

import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Loader2, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SellerGate } from '@/components/shop/SellerGate';
import { getSellerStats } from '@/lib/shop/engagement';
import { formatXaf, type SellerStats } from '@/lib/shop/types';
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

// Single-series column chart (daily delivered revenue). One hue, no legend
// (the card title names the series), recessive gridlines, per-bar hover
// tooltip with a hit area taller than the bar, and a table view.
function DailyRevenueChart({ daily }: { daily: SellerStats['daily'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const max = Math.max(...daily.map(d => d.revenue), 1);
  const ticks = [0, 0.5, 1].map(f => Math.round(max * f));
  const labelEvery = Math.ceil(daily.length / 8);

  if (asTable) {
    return (
      <div className="space-y-2">
        <div className="flex justify-end"><Button variant="link" size="sm" onClick={() => setAsTable(false)}>Ver gráfico</Button></div>
        <div className="max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-muted-foreground"><th className="py-1 font-medium">Día</th><th className="py-1 font-medium text-right">Pedidos</th><th className="py-1 font-medium text-right">Ventas entregadas</th></tr></thead>
            <tbody>
              {daily.map(d => (
                <tr key={d.date} className="border-t"><td className="py-1">{shortDate(d.date)}</td><td className="py-1 text-right tabular-nums">{d.orders}</td><td className="py-1 text-right tabular-nums">{formatXaf(d.revenue)}</td></tr>
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
        <div className="flex flex-col justify-between h-48 text-[11px] text-muted-foreground tabular-nums text-right w-16 shrink-0 -mt-1.5 pb-0">
          {[...ticks].reverse().map(t => <span key={t}>{t.toLocaleString('es-ES')}</span>)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-48" role="img" aria-label={`Ventas entregadas por día. Máximo ${formatXaf(max)}.`}>
            {[0, 0.5, 1].map(f => <div key={f} className="absolute inset-x-0 border-t border-muted" style={{ bottom: `${f * 100}%` }} aria-hidden />)}
            <div className="absolute inset-0 flex items-end gap-[2px]">
              {daily.map((d, i) => (
                <div
                  key={d.date}
                  className="relative flex-1 h-full flex items-end justify-center cursor-default"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  <div
                    className="w-full max-w-6 rounded-t bg-[#2a78d6] dark:bg-[#3987e5] transition-opacity"
                    style={{ height: d.revenue > 0 ? `max(2px, ${(d.revenue / max) * 100}%)` : 0, opacity: hover === null || hover === i ? 1 : 0.45 }}
                  />
                  {hover === i && (
                    <div className={`absolute bottom-full mb-2 z-10 whitespace-nowrap rounded-md border bg-popover text-popover-foreground shadow-md px-3 py-2 text-xs ${i > daily.length / 2 ? 'right-0' : 'left-0'}`}>
                      <p className="font-semibold">{shortDate(d.date)}</p>
                      <p>Ventas: <span className="tabular-nums font-medium">{formatXaf(d.revenue)}</span></p>
                      <p>Pedidos: <span className="tabular-nums font-medium">{d.orders}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-[2px] mt-1 text-[11px] text-muted-foreground">
            {daily.map((d, i) => <span key={d.date} className="flex-1 text-center overflow-visible whitespace-nowrap">{i % labelEvery === 0 ? shortDate(d.date) : ''}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stats({ company }: { company: Company }) {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<SellerStats | null | undefined>(undefined);

  useEffect(() => {
    setStats(undefined);
    getSellerStats(company.id, days).then(s => setStats(s ?? null));
  }, [company.id, days]);

  const conversion = useMemo(() => (stats && stats.views > 0 ? (stats.orders / stats.views) * 100 : 0), [stats]);
  const base = `/dashboard/companies/${company.id}/shop`;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold font-headline">Estadísticas</h1>
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
          {(stats.open > 0 || stats.unansweredQuestions > 0) && (
            <div className="flex flex-wrap gap-3">
              {stats.open > 0 && (
                <Link href={`${base}/orders`} className="flex items-center gap-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-3 py-2 text-sm hover:underline">
                  <AlertTriangle className="w-4 h-4" />{stats.open} {stats.open === 1 ? 'pedido espera' : 'pedidos esperan'} su atención
                </Link>
              )}
              {stats.unansweredQuestions > 0 && (
                <Link href={`${base}/questions`} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:underline">
                  <MessageCircleQuestion className="w-4 h-4" />{stats.unansweredQuestions} {stats.unansweredQuestions === 1 ? 'pregunta' : 'preguntas'} sin responder
                </Link>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Tile label="Ventas entregadas" value={formatXaf(stats.revenue)} hint={`Neto tras comisión: ${formatXaf(stats.netRevenue)}`} />
            <Tile label="Pedidos" value={String(stats.orders)} hint={`${stats.delivered} entregados · ${stats.cancelled} cancelados`} />
            <Tile label="Ticket medio" value={formatXaf(stats.averageOrder)} hint={`${stats.unitsSold} unidades vendidas`} />
            <Tile label="Visitas a productos" value={stats.views.toLocaleString('es-ES')} hint={stats.views > 0 ? `Conversión aprox. ${conversion.toFixed(1)}% (total histórico)` : undefined} />
          </div>

          <Card>
            <CardHeader className="pb-0"><CardTitle className="text-base">Ventas entregadas por día (XAF)</CardTitle></CardHeader>
            <CardContent><DailyRevenueChart daily={stats.daily} /></CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-base">Más vendidos</CardTitle></CardHeader>
              <CardContent>
                {stats.topProducts.length === 0 ? <p className="text-sm text-muted-foreground">Sin ventas en este periodo.</p> : (
                  <ol className="space-y-2 text-sm">
                    {stats.topProducts.map((p, i) => (
                      <li key={p.productId ?? p.title} className="flex justify-between gap-3">
                        <span className="truncate"><span className="text-muted-foreground mr-2">{i + 1}.</span>{p.productId ? <Link href={`${base}/${p.productId}`} className="hover:underline">{p.title}</Link> : p.title}</span>
                        <span className="whitespace-nowrap tabular-nums text-muted-foreground">{p.units} uds · {formatXaf(p.revenue)}</span>
                      </li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Stock bajo</CardTitle></CardHeader>
              <CardContent>
                {stats.lowStock.length === 0 ? <p className="text-sm text-muted-foreground">Todo en orden: ningún producto publicado con 5 unidades o menos.</p> : (
                  <ul className="space-y-2 text-sm">
                    {stats.lowStock.map(p => (
                      <li key={p.productId} className="flex justify-between gap-3">
                        <Link href={`${base}/${p.productId}`} className="truncate hover:underline">{p.title}</Link>
                        <span className={`whitespace-nowrap font-medium flex items-center gap-1 ${p.stock === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />{p.stock === 0 ? 'Agotado' : `${p.stock} uds`}
                        </span>
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

export default function SellerStatsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <Stats company={company} />}</SellerGate>;
}
