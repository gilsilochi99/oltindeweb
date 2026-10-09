import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, MapPin, Star, Store } from 'lucide-react-native';
import { useCompany } from '../../../src/hooks/use-queries';
import { ProductBrowser } from '../../../src/components/shop/ProductBrowser';
import { CartButton } from '../../../src/components/shop/CartButton';
import { Button } from '../../../src/components/ui/Button';

// A seller's own store (web: /tienda/vendedor/[companyId]): who they are,
// then all their products.
export default function SellerStoreScreen() {
  const { companyId } = useLocalSearchParams<{ companyId: string }>();
  const { data: company } = useCompany(companyId);
  const city = company?.branches?.[0]?.location?.city;
  const reviews = company?.reviews ?? [];
  const rating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const header = company ? (
    <View className="gap-3 rounded-xl border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg border border-border bg-white p-1">
          {company.logo ? (
            <Image source={{ uri: company.logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
          ) : (
            <Store size={26} color="#8A8A8A" />
          )}
        </View>
        <View className="flex-1 gap-1">
          <View className="flex-row items-center gap-1.5">
            <Text className="flex-shrink text-lg font-semibold text-foreground" numberOfLines={2}>{company.name}</Text>
            {company.isVerified ? <BadgeCheck size={18} color="#1976D2" /> : null}
          </View>
          <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1">
            {city ? (
              <View className="flex-row items-center gap-1">
                <MapPin size={13} color="#6B6B6B" />
                <Text className="text-xs text-muted-foreground">{city}</Text>
              </View>
            ) : null}
            <Text className="text-xs text-muted-foreground">{company.category}</Text>
            {reviews.length ? (
              <View className="flex-row items-center gap-1">
                <Star size={13} color="#1A1C1C" fill="#1A1C1C" />
                <Text className="text-xs text-foreground">{rating.toFixed(1)} ({reviews.length})</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>
      <Button variant="outline" onPress={() => router.push(`/companies/${company.id}`)}>Ver perfil de la empresa</Button>
    </View>
  ) : null;

  return (
    <>
      <Stack.Screen options={{ title: company ? `Tienda de ${company.name}` : 'Tienda', headerRight: () => <CartButton /> }} />
      <ProductBrowser companyId={companyId} header={header} placeholder="Buscar en esta tienda…" />
    </>
  );
}
