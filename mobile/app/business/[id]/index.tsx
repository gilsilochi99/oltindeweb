import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import {
  BarChart3,
  CalendarCheck,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  MessageCircleQuestion,
  Settings2,
  TicketPercent,
  ImageOff,
  KeyRound,
  Megaphone,
  Package,
  Pencil,
  Receipt,
  ShoppingBag,
  Star,
  UtensilsCrossed,
} from 'lucide-react-native';
import { useCompany, useSetCompanyActive } from '../../../src/hooks/use-queries';
import { companyHasFeature, type PremiumFeature } from '../../../src/lib/types';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { StarRating, averageRating } from '../../../src/components/ui/StarRating';


function ManageRow({ icon: Icon, label, subtitle, onPress }: { icon: typeof Pencil; label: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon size={18} color="#1A1C1C" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      <ChevronRight size={18} color="#8A8A8A" />
    </Pressable>
  );
}

export default function ManageBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const setActive = useSetCompanyActive(id);

  if (isLoading) return <LoadingState />;
  if (!company) return <EmptyState title="Negocio no encontrado" />;

  // Same rule as the web dashboard: Premium, and the feature allowed for the
  // company's category in Admin → Funciones Premium.
  const has = (feature: PremiumFeature) => companyHasFeature(company, feature);

  const toggleActive = (value: boolean) => {
    if (!value) {
      Alert.alert('Ocultar negocio', '¿Ocultar este negocio del directorio? No aparecerá en las búsquedas hasta que lo reactives.', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ocultar', style: 'destructive', onPress: () => setActive.mutate(false) },
      ]);
    } else {
      setActive.mutate(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: company.name }} />
      <ScrollView contentContainerClassName="gap-6 p-4">
        <View className="flex-row items-center gap-3">
          <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
            {company.logo ? (
              <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            ) : (
              <ImageOff size={20} color="#C4C4C4" />
            )}
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-lg font-semibold text-foreground">{company.name}</Text>
            <StarRating rating={averageRating(company.reviews)} count={company.reviews.length} size={13} />
          </View>
        </View>

        <View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-3.5">
          <View>
            <Text className="text-sm font-semibold text-foreground">Visible en el directorio</Text>
            <Text className="text-xs text-muted-foreground">
              {company.isActive === false ? 'Oculto — los clientes no pueden verlo' : 'Los clientes pueden ver y contactar tu negocio'}
            </Text>
          </View>
          <Switch value={company.isActive !== false} onValueChange={toggleActive} />
        </View>

        <View className="gap-2.5">
          <ManageRow icon={Pencil} label="Editar información" subtitle="Nombre, descripción, contacto, sucursal" onPress={() => router.push(`/business/${id}/edit`)} />
          {has('shop') ? (
            <>
              <ManageRow icon={Package} label="Tienda: productos" subtitle="Publica u oculta tus productos" onPress={() => router.push(`/business/${id}/products`)} />
              <ManageRow icon={Receipt} label="Tienda: pedidos" subtitle="Confirma y entrega los pedidos de tus clientes" onPress={() => router.push(`/business/${id}/shop-orders`)} />
              <ManageRow icon={MessageCircleQuestion} label="Tienda: preguntas" subtitle="Responde las dudas de tus clientes" onPress={() => router.push(`/business/${id}/questions`)} />
              <ManageRow icon={TicketPercent} label="Tienda: cupones" subtitle="Códigos de descuento para tus clientes" onPress={() => router.push(`/business/${id}/coupons`)} />
              <ManageRow icon={Settings2} label="Tienda: ajustes" subtitle="Recogida, envíos, pagos y pedido mínimo" onPress={() => router.push(`/business/${id}/shop-settings`)} />
            </>
          ) : null}
          {has('rentals') ? (
            <>
              <ManageRow icon={KeyRound} label="Alquileres: anuncios" subtitle="Tus casas y vehículos en alquiler" onPress={() => router.push(`/business/${id}/rentals`)} />
              <ManageRow icon={CalendarCheck} label="Alquileres: reservas" subtitle="Acepta o rechaza las solicitudes" onPress={() => router.push(`/business/${id}/bookings`)} />
            </>
          ) : null}
          {has('shop') || has('rentals') ? (
            <ManageRow icon={BarChart3} label="Estadísticas" subtitle="Ventas, reservas y visitas" onPress={() => router.push(`/business/${id}/stats`)} />
          ) : null}
          {has('menu') ? (
            <>
              <ManageRow icon={UtensilsCrossed} label="Menú" subtitle="Gestiona los productos de tu carta" onPress={() => router.push(`/business/${id}/menu`)} />
              <ManageRow icon={ShoppingBag} label="Pedidos de comida" subtitle="Pedidos recibidos y su estado" onPress={() => router.push(`/business/${id}/orders`)} />
            </>
          ) : null}
          {has('jobs') ? (
            <ManageRow icon={ClipboardList} label="Empleos" subtitle="Publica y gestiona ofertas de empleo" onPress={() => router.push(`/business/${id}/jobs`)} />
          ) : null}
          {has('events') ? (
            <ManageRow icon={CalendarDays} label="Eventos" subtitle="Eventos organizados por tu negocio" onPress={() => router.push(`/business/${id}/events`)} />
          ) : null}
          {has('documents') ? (
            <ManageRow icon={FileText} label="Documentos" subtitle="Catálogos, tarifas y otros archivos para tus clientes" onPress={() => router.push(`/business/${id}/documents`)} />
          ) : null}
          {has('offers') || has('announcements') ? (
            <ManageRow icon={Megaphone} label="Ofertas y anuncios" subtitle="Publica promociones y novedades" onPress={() => router.push(`/business/${id}/news`)} />
          ) : null}
        </View>

        {!company.isPremium ? (
          <View className="gap-1.5 rounded-lg border border-primary bg-primary/10 p-4">
            <View className="flex-row items-center gap-2">
              <Star size={16} color="#B38F00" fill="#FFCD00" />
              <Text className="text-sm font-semibold text-foreground">Funciones Premium</Text>
            </View>
            <Text className="text-sm text-foreground">
              Con Premium tu negocio puede vender en la Tienda, publicar alquileres, ofertas, empleos y eventos. Contacta con Oltinde para activarlo.
            </Text>
          </View>
        ) : null}

        <Pressable onPress={() => router.push(`/companies/${id}`)}>
          <Text className="text-center text-sm font-medium text-secondary">Ver perfil público →</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
