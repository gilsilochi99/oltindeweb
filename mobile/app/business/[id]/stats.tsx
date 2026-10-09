import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react-native';
import { getRentalStats, getSellerStats } from '../../../src/lib/business';
import { formatXaf } from '../../../src/lib/shop';
import { formatIsoDate } from '../../../src/lib/rentals';
import { useCompany } from '../../../src/hooks/use-queries';
import { companyHasFeature } from '../../../src/lib/types';
import { Chip } from '../../../src/components/ui/Rail';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

const PERIODS = [
  { days: 7, label: '7 días' },
  { days: 30, label: '30 días' },
  { days: 90, label: '90 días' },
  { days: 365, label: '1 año' },
];

export default function BusinessStatsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [days, setDays] = useState(30);
  const { data: company } = useCompany(id);
  const hasShop = !!company && companyHasFeature(company, 'shop');
  const hasRentals = !!company && companyHasFeature(company, 'rentals');
  const shop = useQuery({ queryKey: ['seller', 'stats', id, days], queryFn: () => getSellerStats(id, days), enabled: hasShop });
  const rentals = useQuery({ queryKey: ['advertiser', 'stats', id, days], queryFn: () => getRentalStats(id, days), enabled: hasRentals });

  if (!company) return <LoadingState />;
  if (!hasShop && !hasRentals) return <EmptyState title="Sin estadísticas" description="Las estadísticas están disponibles para la Tienda y los Alquileres." />;

  const refreshing = shop.isRefetching || rentals.isRefetching;
  return (
    <>
      <Stack.Screen options={{ title: 'Estadísticas' }} />
      <ScrollView
        contentContainerClassName="gap-5 p-4 pb-10"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { shop.refetch(); rentals.refetch(); }} />}
      >
        <View className="flex-row flex-wrap gap-2">
          {PERIODS.map((p) => <Chip key={p.days} label={p.label} selected={days === p.days} onPress={() => setDays(p.days)} />)}
        </View>

        {hasShop ? (
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Tienda</Text>
            {shop.isLoading ? <LoadingState /> : shop.data ? (
              <>
                {shop.data.open > 0 ? (
                  <Alert text={`${shop.data.open} ${shop.data.open === 1 ? 'pedido espera' : 'pedidos esperan'} su atención`} onPress={() => router.push(`/business/${id}/shop-orders`)} />
                ) : null}
                <View className="flex-row flex-wrap gap-3">
                  <Tile label="Ventas entregadas" value={formatXaf(shop.data.revenue)} hint={`Neto: ${formatXaf(shop.data.netRevenue)}`} />
                  <Tile label="Pedidos" value={String(shop.data.orders)} hint={`${shop.data.delivered} entregados · ${shop.data.cancelled} cancelados`} />
                  <Tile label="Ticket medio" value={formatXaf(shop.data.averageOrder)} hint={`${shop.data.unitsSold} unidades`} />
                  <Tile label="Visitas" value={shop.data.views.toLocaleString('es-ES')} hint="A sus productos (total)" />
                </View>
                <DailyBars title="Pedidos por día" values={shop.data.daily.map((d) => ({ date: d.date, value: d.orders }))} />
                <List
                  title="Más vendidos"
                  empty="Sin ventas en este periodo."
                  rows={shop.data.topProducts.map((p) => ({ key: p.productId ?? p.title, left: p.title, right: `${p.units} uds · ${formatXaf(p.revenue)}` }))}
                />
                {shop.data.lowStock.length ? (
                  <List title="Stock bajo" empty="" rows={shop.data.lowStock.map((p) => ({ key: p.productId, left: p.title, right: p.stock === 0 ? 'Agotado' : `${p.stock} uds`, warn: true }))} />
                ) : null}
              </>
            ) : <Text className="text-sm text-muted-foreground">No se pudieron cargar.</Text>}
          </View>
        ) : null}

        {hasRentals ? (
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Alquileres</Text>
            {rentals.isLoading ? <LoadingState /> : rentals.data ? (
              <>
                {rentals.data.pending > 0 ? (
                  <Alert text={`${rentals.data.pending} ${rentals.data.pending === 1 ? 'solicitud espera' : 'solicitudes esperan'} su respuesta`} onPress={() => router.push(`/business/${id}/bookings`)} />
                ) : null}
                <View className="flex-row flex-wrap gap-3">
                  <Tile label="Ingresos reservados" value={formatXaf(rentals.data.revenue)} hint="Aceptadas y finalizadas" />
                  <Tile label="Solicitudes" value={String(rentals.data.requests)} hint={`${rentals.data.accepted} aceptadas · ${rentals.data.rejected} rechazadas`} />
                  <Tile label="Aceptación" value={`${Math.round(rentals.data.acceptanceRate * 100)}%`} hint="De las respondidas" />
                  <Tile
                    label="Ocupación vendida"
                    value={`${rentals.data.unitsBooked} días/noches`}
                    hint={rentals.data.monthsBooked ? `+ ${rentals.data.monthsBooked} meses` : `${rentals.data.views} visitas (total)`}
                  />
                </View>
                <DailyBars title="Solicitudes por día" values={rentals.data.daily.map((d) => ({ date: d.date, value: d.requests }))} />
                <List
                  title="Anuncios con más interés"
                  empty="Sin visitas ni solicitudes en este periodo."
                  rows={rentals.data.topListings.map((l) => ({ key: l.listingId ?? l.title, left: l.title, right: `${l.views} visitas · ${l.requests} solic.` }))}
                />
                <List
                  title="Próximas llegadas"
                  empty="No hay reservas aceptadas próximas."
                  rows={rentals.data.upcoming.map((b) => ({ key: b.id, left: `${b.customerName} · ${b.listingTitle}`, right: formatIsoDate(b.startDate) }))}
                />
              </>
            ) : <Text className="text-sm text-muted-foreground">No se pudieron cargar.</Text>}
          </View>
        ) : null}
      </ScrollView>
    </>
  );
}

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="rounded-lg border border-border bg-card p-3" style={{ width: '48%', elevation: 1 }}>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="mt-1 text-lg font-semibold text-foreground" numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      {hint ? <Text className="text-[11px] text-muted-foreground" numberOfLines={2}>{hint}</Text> : null}
    </View>
  );
}

function Alert({ text, onPress }: { text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2.5">
      <AlertTriangle size={16} color="#92400E" />
      <Text className="flex-1 text-sm font-medium text-amber-900">{text}</Text>
    </Pressable>
  );
}

// Single-series column chart: one bar per day, the title names the series.
// The busiest day is labelled so the scale is readable without an axis.
function DailyBars({ title, values }: { title: string; values: { date: string; value: number }[] }) {
  const max = Math.max(...values.map((v) => v.value), 0);
  const busiest = values.find((v) => v.value === max && max > 0);
  return (
    <View className="gap-2 rounded-lg border border-border bg-card p-3" style={{ elevation: 1 }}>
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {max === 0 ? (
        <Text className="text-xs text-muted-foreground">Nada en este periodo.</Text>
      ) : (
        <>
          <View className="h-24 flex-row items-end" style={{ gap: values.length > 60 ? 0 : 2 }}>
            {values.map((v) => (
              <View key={v.date} className="flex-1 rounded-t-sm" style={{ height: v.value ? `${Math.max(4, (v.value / max) * 100)}%` : 0, backgroundColor: '#2a78d6' }} />
            ))}
          </View>
          <View className="flex-row justify-between">
            <Text className="text-[11px] text-muted-foreground">{formatIsoDate(values[0].date)}</Text>
            <Text className="text-[11px] text-muted-foreground">{formatIsoDate(values[values.length - 1].date)}</Text>
          </View>
          {busiest ? <Text className="text-xs text-muted-foreground">Día con más actividad: {formatIsoDate(busiest.date)} ({busiest.value})</Text> : null}
        </>
      )}
    </View>
  );
}

function List({ title, rows, empty }: { title: string; rows: { key: string; left: string; right: string; warn?: boolean }[]; empty: string }) {
  return (
    <View className="gap-2 rounded-lg border border-border bg-card p-3" style={{ elevation: 1 }}>
      <Text className="text-sm font-semibold text-foreground">{title}</Text>
      {rows.length === 0 ? <Text className="text-xs text-muted-foreground">{empty}</Text> : rows.map((r, i) => (
        <View key={r.key} className="flex-row justify-between gap-3">
          <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>{i + 1}. {r.left}</Text>
          <Text className={`text-xs ${r.warn ? 'font-semibold text-amber-700' : 'text-muted-foreground'}`}>{r.right}</Text>
        </View>
      ))}
    </View>
  );
}
