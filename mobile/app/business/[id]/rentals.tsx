import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound } from 'lucide-react-native';
import { absoluteUrl, formatXaf } from '../../../src/lib/shop';
import { headlinePrice, kindLabel } from '../../../src/lib/rentals';
import { getAdvertiserListings, setRentalStatus } from '../../../src/lib/business';
import { ManagedItemRow } from '../../../src/components/business/ManagedItemRow';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function AdvertiserListingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const listings = useQuery({ queryKey: ['advertiser', 'listings', id], queryFn: () => getAdvertiserListings(id) });
  const toggle = useMutation({
    mutationFn: ({ listingId, publish }: { listingId: string; publish: boolean }) => setRentalStatus(listingId, publish ? 'active' : 'draft'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertiser', 'listings', id] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
    },
    onError: (e: Error) => Alert.alert('No se pudo cambiar', e.message),
  });

  const open = (itemId: string) => router.push(`/business/${id}/rental/${itemId}`);

  return (
    <>
      <Stack.Screen options={{ title: 'Mis anuncios de alquiler' }} />
      {listings.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={listings.data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="gap-2 pb-2">
              <Button onPress={() => open('new')}>Publicar anuncio</Button>
            </View>
          }
          renderItem={({ item }) => {
            const price = headlinePrice(item);
            return (
              <ManagedItemRow
                image={absoluteUrl(item.images[0]?.url)}
                title={item.title}
                subtitle={`${kindLabel(item.category, item.kind)} · ${item.city}${price ? ` · ${formatXaf(price.amount)} / ${price.unit}` : ''}`}
                status={item.status}
                busy={toggle.isPending && toggle.variables?.listingId === item.id}
                onToggle={(publish) => toggle.mutate({ listingId: item.id, publish })}
                onPress={() => open(item.id)}
              />
            );
          }}
          refreshControl={<RefreshControl refreshing={listings.isRefetching} onRefresh={() => listings.refetch()} />}
          ListEmptyComponent={<EmptyState icon={KeyRound} title="Todavía no tiene anuncios" description="Publique su primera casa o vehículo en alquiler." />}
        />
      )}
    </>
  );
}
