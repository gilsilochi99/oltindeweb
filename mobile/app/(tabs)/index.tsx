import { Pressable, RefreshControl, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { Briefcase, HeartPulse, ImageOff, Search, UserRound, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import { useActiveCompanies, useMenuDelDiaItems, usePharmaciesOnDuty } from '../../src/hooks/use-queries';
import { getStorefrontHome, formatXaf } from '../../src/lib/shop';
import { getRentalsHome } from '../../src/lib/rentals';
import { isPlaceholderImage } from '../../src/lib/image-utils';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { RentalCard } from '../../src/components/rentals/RentalCard';
import { Rail, NewTag } from '../../src/components/ui/Rail';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { FadeInItem, PressableScale, tick } from '../../src/components/ui/motion';

// Mobile version of the website's homepage (src/app/page.tsx): the yellow
// hero with the search box and popular searches, the illustrated feature
// cards, the shop/rentals shelves and the "¿Tienes una empresa?" panel.

const POPULAR = ['Restaurantes en Malabo', 'Farmacias de guardia', 'Abogados', 'Hoteles en Bata', 'Pasaporte', 'Informática', 'Empleo'];

const ill = {
  tienda: require('../../assets/illustrations/tienda-online.svg'),
  alquiler: require('../../assets/illustrations/alquileres.svg'),
  empresas: require('../../assets/illustrations/directorio-empresas.svg'),
  tramites: require('../../assets/illustrations/guia-tramites.svg'),
  anuncios: require('../../assets/illustrations/anuncios-ofertas.svg'),
  empleo: require('../../assets/illustrations/bolsa-trabajo.svg'),
  eventos: require('../../assets/illustrations/eventos.svg'),
  lugares: require('../../assets/illustrations/lugares-turisticos.svg'),
  itinerarios: require('../../assets/illustrations/itinerarios-viaje.svg'),
  alta: require('../../assets/illustrations/alta-empresa.svg'),
};

// Big tiles for the two newest sections.
const FEATURED: { image: number; title: string; text: string; href: string; bg: string }[] = [
  { image: ill.tienda, title: 'Tienda', text: 'Compra a tiendas locales y paga al recibir.', href: '/tienda', bg: '#FFF1BF' },
  { image: ill.alquiler, title: 'Alquiler', text: 'Casas y coches por días o meses.', href: '/alquiler', bg: '#E4EEF6' },
];

// Everything else, as app tiles with the website's illustrations (or an
// icon, for sections the website has no illustration for).
const TILES: { image?: number; icon?: LucideIcon; label: string; href: string }[] = [
  { image: ill.empresas, label: 'Empresas', href: '/companies' },
  { icon: UtensilsCrossed, label: 'Comida', href: '/food' },
  { icon: Briefcase, label: 'Servicios', href: '/services' },
  { icon: UserRound, label: 'Profesionales', href: '/professionals' },
  { icon: HeartPulse, label: 'Salud', href: '/health' },
  { image: ill.tramites, label: 'Trámites', href: '/procedures' },
  { image: ill.anuncios, label: 'Ofertas y anuncios', href: '/announcements' },
  { image: ill.empleo, label: 'Empleo', href: '/jobs' },
  { image: ill.eventos, label: 'Eventos', href: '/events' },
  { image: ill.lugares, label: 'Turismo', href: '/places' },
  { image: ill.itinerarios, label: 'Itinerarios', href: '/itineraries' },
  { image: ill.alta, label: 'Publicar empresa', href: '/business/new' },
];

const TILE_GAP = 12;

export default function HomeScreen() {
  const { width } = useWindowDimensions();

  const companies = useActiveCompanies();
  const { data: menuDelDia } = useMenuDelDiaItems();
  const { data: pharmacies } = usePharmaciesOnDuty();
  const shop = useQuery({ queryKey: ['shop', 'home'], queryFn: getStorefrontHome });
  const rentals = useQuery({ queryKey: ['rentals', 'home'], queryFn: getRentalsHome });

  const shopProducts = shop.data ? [...shop.data.deals, ...shop.data.newest.filter((p) => !shop.data!.deals.some((d) => d.id === p.id))].slice(0, 12) : [];
  const tileWidth = (width - 16 * 2 - TILE_GAP * 3) / 4;

  // The top bar gets a hairline once the page scrolls.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });

  const search = (q: string) => {
    if (!q.trim()) return router.push('/search');
    router.push({ pathname: '/search', params: { q: q.trim(), t: String(Date.now()) } });
  };

  const refreshing = shop.isRefetching || rentals.isRefetching || companies.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader scrollY={scrollY} />

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { shop.refetch(); rentals.refetch(); companies.refetch(); }} colors={['#000']} progressBackgroundColor="#FFCD00" />}
      >
        {/* Hero — clean, like the Tienda page: title, one line, search bar */}
        <Animated.View entering={FadeIn.duration(250)}>
          <View className="bg-primary px-4 pb-6 pt-5">
            <Text className="text-[28px] font-semibold leading-8 tracking-tight text-black">
              Todo lo que buscas está <Text className="italic">aquí</Text>
            </Text>
            <Text className="mt-1.5 text-sm text-black/70">Empresas, trámites, tienda y alquileres de Guinea Ecuatorial.</Text>
            <PressableScale
              onPress={() => router.navigate('/search')}
              scaleTo={0.98}
              haptic="selection"
              className="mt-4 flex-row items-center gap-2.5 rounded-full bg-white px-4"
              style={{ height: 50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, borderRadius: 999, backgroundColor: '#FFFFFF', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}
            >
              <Search size={19} color="#555" />
              <Text className="flex-1 text-[15px] text-black/50" numberOfLines={1}>Busca empresas, trámites, productos…</Text>
            </PressableScale>
          </View>
        </Animated.View>

        {/* Popular searches: one swipeable row under the hero */}
        <Animated.View entering={FadeIn.delay(80).duration(250)}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-4 pt-4">
          {POPULAR.map((q) => (
            <Pressable key={q} onPress={() => { tick('selection'); search(q); }} className="rounded-full border border-border bg-card px-3.5 py-2 active:bg-muted">
              <Text className="text-[13px] font-medium text-foreground">{q}</Text>
            </Pressable>
          ))}
        </ScrollView>
        </Animated.View>

        {/* Featured: Tienda and Alquiler as two big app tiles */}
        <View className="flex-row gap-3 px-4 pt-5">
          {FEATURED.map((f, i) => (
            <FadeInItem key={f.href} index={i} style={{ flex: 1 }}>
              <PressableScale onPress={() => router.push(f.href as never)} scaleTo={0.96} className="overflow-hidden rounded-xl" style={{ height: 156, backgroundColor: f.bg }}>
                <View className="p-3.5">
                  <NewTag />
                  <Text className="mt-2 text-lg font-semibold leading-5 text-black">{f.title}</Text>
                  <Text className="mt-0.5 text-xs leading-4 text-black/65" numberOfLines={2}>{f.text}</Text>
                </View>
                <Image source={f.image} style={{ position: 'absolute', right: -6, bottom: -4, width: 104, height: 76 }} contentFit="contain" />
              </PressableScale>
            </FadeInItem>
          ))}
        </View>

        {/* The rest of Oltinde: a grid of app tiles */}
        <Text className="mt-7 px-4 text-lg font-semibold text-foreground">Explora Oltinde</Text>
        <View className="flex-row flex-wrap px-4 pt-3" style={{ gap: TILE_GAP }}>
          {TILES.map((t, i) => (
            <FadeInItem key={t.href} index={i} style={{ width: tileWidth }}>
              <PressableScale onPress={() => router.push(t.href as never)} scaleTo={0.92} className="items-center">
                <View className="items-center justify-center rounded-2xl bg-[#F3F3F3]" style={{ width: tileWidth, height: tileWidth }}>
                  {t.image ? (
                    <Image source={t.image} style={{ width: tileWidth - 14, height: tileWidth - 14 }} contentFit="contain" />
                  ) : t.icon ? (
                    <View className="items-center justify-center rounded-full bg-primary" style={{ width: tileWidth * 0.56, height: tileWidth * 0.56 }}>
                      <t.icon size={tileWidth * 0.28} color="#000" strokeWidth={1.8} />
                    </View>
                  ) : null}
                </View>
                <Text className="mt-1.5 text-center text-[12px] font-semibold leading-4 text-foreground" numberOfLines={2}>{t.label}</Text>
              </PressableScale>
            </FadeInItem>
          ))}
        </View>

        {shopProducts.length > 0 ? (
          <Rail title="Tienda Oltinde" isNew subtitle="Productos locales en XAF, con pago al recibir." onSeeAll={() => router.push('/tienda')}>
            {shopProducts.map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        ) : null}

        {rentals.data && rentals.data.total > 0 ? (
          <Rail title="Alquiler" isNew subtitle="Casas, pisos y coches por días o meses." onSeeAll={() => router.push('/alquiler')}>
            {[...rentals.data.featured, ...rentals.data.properties, ...rentals.data.vehicles]
              .filter((l, i, all) => all.findIndex((x) => x.id === l.id) === i)
              .slice(0, 10)
              .map((l) => <RentalCard key={l.id} listing={l} />)}
          </Rail>
        ) : null}

        {menuDelDia && menuDelDia.length > 0 ? (
          <Rail title="Menús del día" onSeeAll={() => router.push('/food')}>
            {menuDelDia.slice(0, 8).map((item) => (
              <MiniCard
                key={item.id}
                image={item.image}
                title={item.name}
                subtitle={item.companyName}
                extra={formatXaf(item.price)}
                onPress={() => router.push(`/companies/${item.companyId}`)}
              />
            ))}
          </Rail>
        ) : null}

        {pharmacies && pharmacies.length > 0 ? (
          <Rail title="Farmacias de guardia" onSeeAll={() => router.push('/health')}>
            {pharmacies.slice(0, 8).map((p) => (
              <MiniCard key={p.id} image={p.image} title={p.name} subtitle="De guardia hoy" onPress={() => router.push(`/health/${p.id}`)} />
            ))}
          </Rail>
        ) : null}

        {/* "¿Tienes una empresa?" — the website's black panel */}
        <FadeInItem className="mx-4 mt-8">
          <View className="rounded-lg bg-[#111111] p-6">
            <Text className="text-2xl font-semibold leading-7 text-white">¿Tienes una empresa en Guinea Ecuatorial?</Text>
            <Text className="mt-2 text-sm leading-5 text-white/70">Publícala gratis, empieza a recibir clientes y vende tus productos en la Tienda.</Text>
            <View className="mt-5 flex-row flex-wrap gap-3">
              <PressableScale onPress={() => router.push('/business/new')} className="h-11 justify-center rounded-md bg-primary px-4">
                <Text className="text-sm font-semibold text-black">Publicar mi empresa</Text>
              </PressableScale>
              <PressableScale onPress={() => router.push('/dashboard')} className="h-11 justify-center rounded-md border border-white/40 px-4">
                <Text className="text-sm font-semibold text-white">Mi negocio</Text>
              </PressableScale>
            </View>
          </View>
        </FadeInItem>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}



function MiniCard({ image, title, subtitle, extra, onPress }: { image?: string; title: string; subtitle?: string; extra?: string; onPress: () => void }) {
  const real = image && !isPlaceholderImage(image) ? image : undefined;
  return (
    <PressableScale onPress={onPress} scaleTo={0.97} className="w-44 overflow-hidden rounded-lg border border-border bg-card">
      <View className="h-28 w-full items-center justify-center bg-white">
        {real ? <Image source={{ uri: real }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} /> : <ImageOff size={22} color="#C4C4C4" />}
      </View>
      <View className="gap-0.5 p-3">
        <Text className="text-sm font-semibold text-secondary underline" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text className="text-xs text-foreground/70" numberOfLines={1}>{subtitle}</Text> : null}
        {extra ? <Text className="mt-0.5 text-sm font-semibold text-foreground">{extra}</Text> : null}
      </View>
    </PressableScale>
  );
}
