import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Car, Home, KeyRound, Search } from 'lucide-react-native';
import { getRentalsHome, kindLabel } from '../../src/lib/rentals';
import { RentalCard } from '../../src/components/rentals/RentalCard';
import { Chip, Rail } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function AlquilerHomeScreen() {
  const home = useQuery({ queryKey: ['rentals', 'home'], queryFn: getRentalsHome });
  const data = home.data;

  return (
    <>
      <Stack.Screen options={{ title: 'Alquiler' }} />
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => home.refetch()} />}
      >
        <View className="bg-primary px-4 pb-5 pt-3">
          <Text className="text-2xl font-semibold text-black">Alquila casas y coches</Text>
          <Text className="mt-1 text-sm text-black/70">Pisos, casas y vehículos de empresas de Guinea Ecuatorial. Por días o por meses.</Text>
          <Pressable
            onPress={() => router.push('/alquiler/buscar')}
            className="mt-4 flex-row items-center gap-2.5 rounded-full bg-white px-4"
            style={{ height: 46 }}
          >
            <Search size={18} color="#8A8A8A" />
            <Text className="text-base text-muted-foreground">Buscar por zona, tipo…</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-3 px-4 pt-4">
          <CategoryTile icon={Home} label="Casas y pisos" onPress={() => router.push({ pathname: '/alquiler/buscar', params: { category: 'property' } })} />
          <CategoryTile icon={Car} label="Coches" onPress={() => router.push({ pathname: '/alquiler/buscar', params: { category: 'vehicle' } })} />
        </View>
        <Pressable onPress={() => router.push('/alquiler/reservas')} className="mx-4 mt-3 flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 active:opacity-70">
          <CalendarCheck size={17} color="#1A1C1C" />
          <Text className="text-sm font-semibold text-foreground">Mis reservas</Text>
        </Pressable>

        {home.isLoading ? (
          <LoadingState variant="list" />
        ) : !data || data.total === 0 ? (
          <EmptyState icon={KeyRound} title="Todavía no hay anuncios" description="Pronto verás aquí casas y coches en alquiler." />
        ) : (
          <>
            {data.cityCounts.length > 1 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pt-4">
                {data.cityCounts.map((c) => (
                  <Chip key={c.city} label={`${c.city} (${c.count})`} onPress={() => router.push({ pathname: '/alquiler/buscar', params: { city: c.city } })} />
                ))}
              </ScrollView>
            ) : null}
            {data.featured.length > 0 ? (
              <Rail title="Destacados">{data.featured.map((l) => <RentalCard key={l.id} listing={l} />)}</Rail>
            ) : null}
            {data.properties.length > 0 ? (
              <Rail title="Casas y pisos" onSeeAll={() => router.push({ pathname: '/alquiler/buscar', params: { category: 'property' } })}>
                {data.properties.map((l) => <RentalCard key={l.id} listing={l} />)}
              </Rail>
            ) : null}
            {data.vehicles.length > 0 ? (
              <Rail title="Coches y vehículos" onSeeAll={() => router.push({ pathname: '/alquiler/buscar', params: { category: 'vehicle' } })}>
                {data.vehicles.map((l) => <RentalCard key={l.id} listing={l} />)}
              </Rail>
            ) : null}
            {data.kindCounts.length > 0 ? (
              <View className="mt-5 px-4">
                <Text className="text-lg font-semibold text-foreground">Por tipo</Text>
                <View className="flex-row flex-wrap gap-2 pt-3">
                  {data.kindCounts.map((k) => (
                    <Chip
                      key={`${k.category}-${k.kind}`}
                      label={`${kindLabel(k.category, k.kind)} (${k.count})`}
                      onPress={() => router.push({ pathname: '/alquiler/buscar', params: { category: k.category, kind: k.kind } })}
                    />
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

function CategoryTile({ icon: Icon, label, onPress }: { icon: typeof Home; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center gap-2 rounded-lg border border-border bg-card py-4 active:opacity-80" style={{ elevation: 1 }}>
      <View className="h-12 w-12 items-center justify-center rounded-full bg-primary">
        <Icon size={22} color="#000" />
      </View>
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
