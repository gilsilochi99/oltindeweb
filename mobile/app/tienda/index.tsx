import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart, Package, Search, Store } from 'lucide-react-native';
import { getActiveCategories, getStorefrontHome } from '../../src/lib/shop';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { CartButton } from '../../src/components/shop/CartButton';
import { Rail, Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function TiendaHomeScreen() {
  const home = useQuery({ queryKey: ['shop', 'home'], queryFn: getStorefrontHome });
  const categories = useQuery({ queryKey: ['shop', 'categories'], queryFn: getActiveCategories });

  const topCategories = (categories.data ?? []).filter((c) => !c.parentId);
  const data = home.data;

  return (
    <>
      <Stack.Screen options={{ title: 'Tienda', headerRight: () => <CartButton /> }} />
      <ScrollView
        contentContainerClassName="pb-10"
        refreshControl={<RefreshControl refreshing={home.isRefetching} onRefresh={() => { home.refetch(); categories.refetch(); }} />}
      >
        <View className="bg-primary px-4 pb-5 pt-3">
          <Text className="text-2xl font-extrabold text-black">Compra en Guinea Ecuatorial</Text>
          <Text className="mt-1 text-sm text-black/70">Productos de tiendas locales. Paga al recibir o con Muni Dinero.</Text>
          <Pressable
            onPress={() => router.push('/tienda/buscar')}
            className="mt-4 flex-row items-center gap-2.5 rounded-full bg-white px-4"
            style={{ height: 46 }}
          >
            <Search size={18} color="#8A8A8A" />
            <Text className="text-base text-muted-foreground">Buscar productos, marcas…</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 px-4 pt-4">
          <QuickLink icon={Package} label="Mis compras" onPress={() => router.push('/tienda/pedidos')} />
          <QuickLink icon={Heart} label="Deseos" onPress={() => router.push('/tienda/deseos')} />
        </View>

        {topCategories.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pt-4">
            {topCategories.map((c) => (
              <Chip key={c.id} label={c.name} onPress={() => router.push({ pathname: '/tienda/buscar', params: { categorySlug: c.slug, title: c.name } })} />
            ))}
          </ScrollView>
        ) : null}

        {home.isLoading ? (
          <LoadingState variant="list" />
        ) : !data || data.totalProducts === 0 ? (
          <EmptyState icon={Store} title="Todavía no hay productos" description="Pronto verás aquí los productos de las tiendas de Oltinde." />
        ) : (
          <>
            {data.deals.length > 0 ? (
              <Rail title="Ofertas" onSeeAll={() => router.push({ pathname: '/tienda/buscar', params: { onSaleOnly: '1', title: 'Ofertas' } })}>
                {data.deals.map((p) => <ProductCard key={p.id} product={p} />)}
              </Rail>
            ) : null}
            {data.featured.length > 0 ? (
              <Rail title="Destacados">{data.featured.map((p) => <ProductCard key={p.id} product={p} />)}</Rail>
            ) : null}
            {data.newest.length > 0 ? (
              <Rail title="Novedades" onSeeAll={() => router.push({ pathname: '/tienda/buscar', params: { sort: 'newest', title: 'Novedades' } })}>
                {data.newest.map((p) => <ProductCard key={p.id} product={p} />)}
              </Rail>
            ) : null}
            {data.bestSellers.length > 0 ? (
              <Rail title="Más vendidos" onSeeAll={() => router.push({ pathname: '/tienda/buscar', params: { sort: 'best_selling', title: 'Más vendidos' } })}>
                {data.bestSellers.map((p) => <ProductCard key={p.id} product={p} />)}
              </Rail>
            ) : null}
          </>
        )}
      </ScrollView>
    </>
  );
}

function QuickLink({ icon: Icon, label, onPress }: { icon: typeof Heart; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card py-3 active:opacity-70">
      <Icon size={17} color="#1A1C1C" />
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
    </Pressable>
  );
}
