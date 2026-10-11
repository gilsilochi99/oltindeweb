import { Alert, FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BarChart3, CalendarCheck, KeyRound } from 'lucide-react-native';
import { absoluteUrl, formatXaf } from '../../../src/lib/shop';
import { headlinePrice, kindLabel } from '../../../src/lib/rentals';
import { PRIVATE_SCOPE, getAdvertiserListings, getMyPrivateRentalsInfo, setRentalStatus } from '../../../src/lib/business';
import { ManagedItemRow } from '../../../src/components/business/ManagedItemRow';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

export default function AdvertiserListingsScreen() {
  // id: a company, or 'me' for "Mis alquileres" as a private advertiser.
  const { id } = useLocalSearchParams<{ id: string }>();
  const isPrivate = id === PRIVATE_SCOPE;
  const queryClient = useQueryClient();
  const info = useQuery({ queryKey: ['advertiser', 'private-info'], queryFn: getMyPrivateRentalsInfo, enabled: isPrivate });
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
      <Stack.Screen options={{ title: isPrivate ? 'Mis alquileres' : 'Mis anuncios de alquiler' }} />
      {listings.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={listings.data ?? []}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          ListHeaderComponent={
            <View className="gap-3 pb-2">
              {isPrivate ? (
                <Text className="text-sm text-muted-foreground">
                  Alquile lo que tenga como particular: sillas, carpas, sonido, herramientas, un salón, su coche… Hasta {info.data?.limit ?? 5} anuncios publicados a la vez.
                </Text>
              ) : null}
              {isPrivate && info.data && !info.data.emailVerified ? (
                <View className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <Text className="text-sm text-amber-900">Confirme su correo electrónico (con el enlace que le enviamos al registrarse) para poder publicar. Después cierre sesión y vuelva a entrar.</Text>
                </View>
              ) : null}
              <Button onPress={() => open('new')}>Publicar anuncio</Button>
              {isPrivate ? (
                <View className="flex-row gap-2">
                  <Pressable onPress={() => router.push(`/business/${id}/bookings`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5">
                    <CalendarCheck size={16} color="#1A1C1C" />
                    <Text className="text-sm font-medium text-foreground">Reservas recibidas</Text>
                  </Pressable>
                  <Pressable onPress={() => router.push(`/business/${id}/stats`)} className="flex-1 flex-row items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2.5">
                    <BarChart3 size={16} color="#1A1C1C" />
                    <Text className="text-sm font-medium text-foreground">Estadísticas</Text>
                  </Pressable>
                </View>
              ) : null}
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
          ListEmptyComponent={<EmptyState icon={KeyRound} title="Todavía no tiene anuncios" description="Publique lo que alquila: casas, vehículos, equipos para eventos, herramientas o espacios." action={{ label: 'Publicar un anuncio', onPress: () => open('new') }} />}
        />
      )}
    </>
  );
}
