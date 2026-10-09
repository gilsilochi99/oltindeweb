import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Route } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { deleteItinerary, getMyItineraries } from '../../src/lib/creator';
import { Button } from '../../src/components/ui/Button';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FadeInItem, PressableScale } from '../../src/components/ui/motion';

// The user's own itineraries (web: /dashboard/itineraries).
export default function MyItinerariesScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const itineraries = useQuery({ queryKey: ['itineraries', 'mine', uid], queryFn: () => getMyItineraries(uid), enabled: !!uid });
  const remove = useMutation({
    mutationFn: (id: string) => deleteItinerary(id, uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['itineraries'] }),
    onError: (e: Error) => Alert.alert('No se pudo eliminar', e.message),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Mis itinerarios' }} />
      {itineraries.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={itineraries.data ?? []}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={itineraries.isRefetching} onRefresh={() => itineraries.refetch()} />}
          ListHeaderComponent={
            <View className="gap-2 pb-2">
              <Text className="text-sm text-muted-foreground">Comparta sus rutas favoritas por Guinea Ecuatorial, día a día.</Text>
              <Button onPress={() => router.push('/itineraries/editar')}>Nuevo itinerario</Button>
            </View>
          }
          ListEmptyComponent={<EmptyState icon={Route} title="Todavía no tiene itinerarios" description="Cree uno con los lugares y empresas que recomienda visitar." />}
          renderItem={({ item, index }) => (
            <FadeInItem index={index}>
              <View className="gap-3 rounded-lg border border-border bg-card p-3">
                <PressableScale scaleTo={0.98} onPress={() => router.push(`/itineraries/${item.id}`)} className="gap-1">
                  <Text className="text-[15px] font-semibold text-foreground" numberOfLines={2}>{item.title}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {item.city} · {item.durationDays} {item.durationDays === 1 ? 'día' : 'días'} · {item.stops.length} paradas
                    {item.visibility === 'unlisted' ? ' · No listado' : ''}
                  </Text>
                </PressableScale>
                <View className="flex-row gap-2">
                  <Button variant="outline" className="flex-1" onPress={() => router.push({ pathname: '/itineraries/editar', params: { id: item.id } })}>
                    Editar
                  </Button>
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onPress={() =>
                      Alert.alert('Eliminar itinerario', `¿Eliminar "${item.title}"? No se puede deshacer.`, [
                        { text: 'Cancelar', style: 'cancel' },
                        { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(item.id) },
                      ])
                    }
                  >
                    Eliminar
                  </Button>
                </View>
              </View>
            </FadeInItem>
          )}
        />
      )}
    </>
  );
}
