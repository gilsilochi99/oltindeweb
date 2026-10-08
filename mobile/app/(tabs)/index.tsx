import { useState } from 'react';
import { Pressable, RefreshControl, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { FadeIn, FadeInDown, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, interpolate, Extrapolation } from 'react-native-reanimated';
import { ArrowRight, Bell, Building, ImageOff, KeyRound, Search, ShieldCheck, ShoppingBag, ShoppingCart } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useShopCart } from '../../src/hooks/use-shop-cart';
import { useActiveCompanies, useMenuDelDiaItems, usePharmaciesOnDuty } from '../../src/hooks/use-queries';
import { rpc } from '../../src/lib/api';
import { getStorefrontHome, formatXaf } from '../../src/lib/shop';
import { getRentalsHome } from '../../src/lib/rentals';
import { isPlaceholderImage } from '../../src/lib/image-utils';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { RentalCard } from '../../src/components/rentals/RentalCard';
import { Rail, NewTag } from '../../src/components/ui/Rail';
import { FadeInItem, PressableScale, tick } from '../../src/components/ui/motion';

// Mobile version of the website's homepage (src/app/page.tsx): the yellow
// hero with the search box and popular searches, the illustrated feature
// cards, the shop/rentals shelves and the "¿Tienes una empresa?" panel.

const POPULAR = ['Restaurantes en Malabo', 'Farmacias de guardia', 'Abogados', 'Hoteles en Bata', 'Pasaporte', 'Informática', 'Empleo'];

const FEATURES: { image: number; title: string; text: string; cta: string; href: string; isNew?: boolean }[] = [
  { image: require('../../assets/illustrations/tienda-online.svg'), title: 'Tienda Online', text: 'Productos de empresas locales. Pague al recibir o recoja en tienda.', cta: 'Ir a la tienda', href: '/tienda', isNew: true },
  { image: require('../../assets/illustrations/alquileres.svg'), title: 'Alquileres', text: 'Casas, pisos y coches por noches, días o meses.', cta: 'Buscar alquileres', href: '/alquiler', isNew: true },
  { image: require('../../assets/illustrations/directorio-empresas.svg'), title: 'Directorio de empresas', text: 'Busque empresas por ubicación o actividad.', cta: 'Comenzar a buscar', href: '/companies' },
  { image: require('../../assets/illustrations/guia-tramites.svg'), title: 'Guía de Trámites', text: 'Requisitos, costes y pasos de cada trámite.', cta: 'Explorar guía', href: '/procedures' },
  { image: require('../../assets/illustrations/anuncios-ofertas.svg'), title: 'Anuncios y Ofertas', text: 'Novedades y promociones de las empresas.', cta: 'Ver novedades', href: '/announcements' },
  { image: require('../../assets/illustrations/bolsa-trabajo.svg'), title: 'Bolsa de Trabajo', text: 'Las últimas ofertas de empleo del país.', cta: 'Ver empleos', href: '/jobs' },
  { image: require('../../assets/illustrations/eventos.svg'), title: 'Eventos', text: 'Ferias, conferencias y actividades.', cta: 'Ver eventos', href: '/events' },
  { image: require('../../assets/illustrations/lugares-turisticos.svg'), title: 'Lugares Turísticos', text: 'Playas, monumentos y museos que visitar.', cta: 'Explorar lugares', href: '/places' },
  { image: require('../../assets/illustrations/itinerarios-viaje.svg'), title: 'Itinerarios', text: 'Planes de viaje creados por la comunidad.', cta: 'Explorar itinerarios', href: '/itineraries' },
  { image: require('../../assets/illustrations/alta-empresa.svg'), title: 'Alta de tu empresa', text: 'Añada su empresa gratis y llegue a más clientes.', cta: 'Publicar mi empresa', href: '/business/new' },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const cart = useShopCart();
  const [query, setQuery] = useState('');

  const companies = useActiveCompanies();
  const { data: menuDelDia } = useMenuDelDiaItems();
  const { data: pharmacies } = usePharmaciesOnDuty();
  const shop = useQuery({ queryKey: ['shop', 'home'], queryFn: getStorefrontHome });
  const rentals = useQuery({ queryKey: ['rentals', 'home'], queryFn: getRentalsHome });
  const unread = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: () => rpc<{ isRead: boolean }[]>('getMyNotifications'),
    enabled: !!user,
    select: (list) => list.filter((n) => !n.isRead).length,
  });

  const shopProducts = shop.data ? [...shop.data.deals, ...shop.data.newest.filter((p) => !shop.data!.deals.some((d) => d.id === p.id))].slice(0, 12) : [];
  const cardWidth = (width - 16 * 2 - 12) / 2;

  // The logo bar gets a hairline and a white background once the page scrolls.
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const barStyle = useAnimatedStyle(() => ({
    borderBottomColor: `rgba(0,0,0,${interpolate(scrollY.value, [0, 40], [0, 0.1], Extrapolation.CLAMP)})`,
  }));

  const search = (q: string) => {
    if (!q.trim()) return router.push('/search');
    router.push({ pathname: '/search', params: { q: q.trim(), t: String(Date.now()) } });
  };

  const refreshing = shop.isRefetching || rentals.isRefetching || companies.isRefetching;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Animated.View style={[barStyle, { borderBottomWidth: 1 }]} className="flex-row items-center justify-between bg-background px-4 py-2.5">
        <Image source={require('../../assets/wordmark-logo.png')} style={{ width: 128, height: 32 }} contentFit="contain" accessibilityLabel="Oltinde" />
        <View className="flex-row items-center gap-1">
          <HeaderIcon icon={Bell} badge={unread.data} label="Avisos" onPress={() => router.push('/notifications')} />
          <HeaderIcon icon={ShoppingCart} badge={cart.itemCount} label="Carrito" onPress={() => router.push('/tienda/carrito')} />
        </View>
      </Animated.View>

      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerClassName="pb-10"
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { shop.refetch(); rentals.refetch(); companies.refetch(); }} colors={['#000']} progressBackgroundColor="#FFCD00" />}
      >
        {/* Hero — same panel as the website */}
        <Animated.View entering={FadeIn.duration(450)} className="mx-4 mt-3 overflow-hidden rounded-xl bg-primary px-5 pb-6 pt-6">
          <Image
            source={require('../../assets/illustrations/directorio-empresas.svg')}
            style={{ position: 'absolute', right: -24, top: 6, width: 150, height: 100, opacity: 0.22 }}
            contentFit="contain"
          />
          <Text className="text-[11px] font-bold uppercase tracking-widest text-black/70">El directorio verificado de Guinea Ecuatorial</Text>
          <Text className="mt-2 text-[32px] font-extrabold leading-9 tracking-tight text-black">
            Todo lo que buscas está <Text className="italic">aquí</Text>
          </Text>

          <View className="mt-5 flex-row items-center rounded-md bg-white p-1.5" style={{ elevation: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }}>
            <Search size={18} color="#555" style={{ marginLeft: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => search(query)}
              returnKeyType="search"
              placeholder='Ej: "empresas de construcción en Bata"'
              placeholderTextColor="#8A8A8A"
              className="h-11 flex-1 px-2.5 text-[15px] text-black"
            />
            <PressableScale onPress={() => search(query)} scaleTo={0.94} className="h-11 justify-center rounded bg-primary px-4">
              <Text className="text-sm font-extrabold uppercase text-black">Buscar</Text>
            </PressableScale>
          </View>

          <Text className="mt-4 text-xs font-medium text-black/70">Populares:</Text>
          <View className="mt-2 flex-row flex-wrap gap-2">
            {POPULAR.map((q, i) => (
              <Animated.View key={q} entering={FadeInDown.delay(150 + i * 40).duration(350)}>
                <Pressable onPress={() => { tick('selection'); search(q); }} className="rounded-full bg-white/70 px-3 py-1.5 active:bg-white">
                  <Text className="text-[13px] text-black">{q}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>

          <View className="mt-5 gap-2">
            <HeroFact icon={ShieldCheck} text="Empresas verificadas" />
            <HeroFact icon={Building} text={`${(companies.data?.length ?? 0).toLocaleString('es-ES')} empresas en el directorio`} />
            <HeroFact icon={ShoppingBag} text="Tienda online con pago al recibir" onPress={() => router.push('/tienda')} />
            <HeroFact icon={KeyRound} text="Alquiler de casas y coches" onPress={() => router.push('/alquiler')} />
          </View>
        </Animated.View>

        {/* Illustrated feature cards */}
        <View className="mt-6 flex-row flex-wrap gap-3 px-4">
          {FEATURES.map((f, i) => (
            <FadeInItem key={f.href} index={i} style={{ width: cardWidth }}>
              <PressableScale onPress={() => router.push(f.href as never)} scaleTo={0.96} className="h-full overflow-hidden rounded-lg border border-border bg-card">
                <View className="items-center bg-[#f7f7f7] px-3 pb-1 pt-4">
                  <Image source={f.image} style={{ width: cardWidth - 40, height: (cardWidth - 40) * 0.66 }} contentFit="contain" />
                  {f.isNew ? (
                    <View className="absolute left-2 top-2"><NewTag /></View>
                  ) : null}
                </View>
                <View className="flex-1 gap-1 p-3">
                  <Text className="text-[13px] font-extrabold uppercase leading-4 text-foreground" numberOfLines={2}>{f.title}</Text>
                  <Text className="flex-1 text-xs leading-4 text-foreground/70" numberOfLines={3}>{f.text}</Text>
                  <View className="mt-1.5 flex-row items-center gap-1">
                    <Text className="text-xs font-bold text-foreground">{f.cta}</Text>
                    <ArrowRight size={13} color="#1A1C1C" />
                  </View>
                </View>
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
          <Rail title="Menús del día" onSeeAll={() => router.push('/companies')}>
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
            <Text className="text-2xl font-extrabold leading-7 text-white">¿Tienes una empresa en Guinea Ecuatorial?</Text>
            <Text className="mt-2 text-sm leading-5 text-white/70">Publícala gratis, empieza a recibir clientes y vende tus productos en la Tienda.</Text>
            <View className="mt-5 flex-row flex-wrap gap-3">
              <PressableScale onPress={() => router.push('/business/new')} className="h-11 justify-center rounded-md bg-primary px-4">
                <Text className="text-sm font-bold text-black">Publicar mi empresa</Text>
              </PressableScale>
              <PressableScale onPress={() => router.push('/dashboard')} className="h-11 justify-center rounded-md border border-white/40 px-4">
                <Text className="text-sm font-bold text-white">Mi negocio</Text>
              </PressableScale>
            </View>
          </View>
        </FadeInItem>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}

function HeaderIcon({ icon: Icon, badge, label, onPress }: { icon: typeof Bell; badge?: number; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.88} haptic="selection" accessibilityLabel={label} className="h-10 w-10 items-center justify-center">
      <Icon size={22} color="#1A1C1C" />
      {badge ? (
        <View className="absolute right-0.5 top-0.5 min-w-[17px] items-center rounded-full bg-primary px-1">
          <Text className="text-[10px] font-extrabold text-black">{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

function HeroFact({ icon: Icon, text, onPress }: { icon: typeof Bell; text: string; onPress?: () => void }) {
  const content = (
    <View className="flex-row items-center gap-2">
      <Icon size={16} color="rgba(0,0,0,0.8)" />
      <Text className={`text-[13px] text-black/80 ${onPress ? 'underline' : ''}`}>{text}</Text>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{content}</Pressable> : content;
}

function MiniCard({ image, title, subtitle, extra, onPress }: { image?: string; title: string; subtitle?: string; extra?: string; onPress: () => void }) {
  const real = image && !isPlaceholderImage(image) ? image : undefined;
  return (
    <PressableScale onPress={onPress} scaleTo={0.97} className="w-44 overflow-hidden rounded-lg border border-border bg-card">
      <View className="h-28 w-full items-center justify-center bg-white">
        {real ? <Image source={{ uri: real }} style={{ width: '100%', height: '100%' }} contentFit="cover" transition={200} /> : <ImageOff size={22} color="#C4C4C4" />}
      </View>
      <View className="gap-0.5 p-3">
        <Text className="text-sm font-bold text-secondary underline" numberOfLines={1}>{title}</Text>
        {subtitle ? <Text className="text-xs text-foreground/70" numberOfLines={1}>{subtitle}</Text> : null}
        {extra ? <Text className="mt-0.5 text-sm font-extrabold text-foreground">{extra}</Text> : null}
      </View>
    </PressableScale>
  );
}
