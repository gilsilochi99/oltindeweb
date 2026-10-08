import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package } from 'lucide-react-native';
import { absoluteUrl, formatXaf } from '../../../src/lib/shop';
import { getSellerProducts, setProductStatus } from '../../../src/lib/business';
import { ManagedItemRow } from '../../../src/components/business/ManagedItemRow';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function SellerProductsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const products = useQuery({ queryKey: ['seller', 'products', id], queryFn: () => getSellerProducts(id) });
  const toggle = useMutation({
    mutationFn: ({ productId, publish }: { productId: string; publish: boolean }) => setProductStatus(productId, publish ? 'active' : 'draft'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'products', id] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
    },
    onError: (e: Error) => Alert.alert('No se pudo cambiar', e.message),
  });

  const open = (itemId: string) => router.push(`/business/${id}/product/${itemId}`);

  return (
    <>
      <Stack.Screen options={{ title: 'Mis productos' }} />
      {products.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={products.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="gap-2 pb-2">
              <Button onPress={() => open('new')}>Añadir producto</Button>
            </View>
          }
          renderItem={({ item }) => {
            const stock = item.variants.reduce((n, v) => n + (v.trackInventory ? v.stock : 0), 0);
            const tracks = item.variants.some((v) => v.trackInventory);
            return (
              <ManagedItemRow
                image={absoluteUrl(item.images[0]?.url)}
                title={item.title}
                subtitle={`${formatXaf(item.minPrice)}${tracks ? ` · ${stock} en stock` : ''}`}
                status={item.status}
                busy={toggle.isPending && toggle.variables?.productId === item.id}
                onToggle={(publish) => toggle.mutate({ productId: item.id, publish })}
                onPress={() => open(item.id)}
              />
            );
          }}
          refreshControl={<RefreshControl refreshing={products.isRefetching} onRefresh={() => products.refetch()} />}
          ListEmptyComponent={<EmptyState icon={Package} title="Todavía no tiene productos" description="Añada su primer producto para empezar a vender en la Tienda." />}
        />
      )}
    </>
  );
}
