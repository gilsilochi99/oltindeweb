import { FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react-native';
import { getWishlistProducts } from '../../src/lib/shop';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { CartButton } from '../../src/components/shop/CartButton';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

const GAP = 12;

export default function WishlistScreen() {
  const { width } = useWindowDimensions();
  const wishlist = useQuery({ queryKey: ['shop', 'wishlist'], queryFn: getWishlistProducts });

  return (
    <>
      <Stack.Screen options={{ title: 'Lista de deseos', headerRight: () => <CartButton /> }} />
      {wishlist.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={wishlist.data ?? []}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ padding: 16, gap: GAP, flexGrow: 1 }}
          renderItem={({ item }) => <ProductCard product={item} width={(width - 32 - GAP) / 2} />}
          refreshControl={<RefreshControl refreshing={wishlist.isRefetching} onRefresh={() => wishlist.refetch()} />}
          ListEmptyComponent={<EmptyState icon={Heart} title="Su lista está vacía" description="Toque el corazón de un producto para guardarlo aquí." />}
        />
      )}
    </>
  );
}
