import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MapPin, ShoppingBag, UtensilsCrossed } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { cancelFoodOrder, getFoodOrdersByCustomer } from '../../src/lib/data';
import { formatXaf } from '../../src/lib/shop';
import type { FoodOrder, FoodOrderStatus } from '../../src/lib/types';
import { Button } from '../../src/components/ui/Button';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FadeInItem } from '../../src/components/ui/motion';

const STATUS: Record<FoodOrderStatus, { label: string; bg: string; fg: string }> = {
  placed: { label: 'Recibido', bg: '#DBEAFE', fg: '#1E40AF' },
  confirmed: { label: 'Confirmado', bg: '#E0E7FF', fg: '#3730A3' },
  preparing: { label: 'Preparando', bg: '#FEF3C7', fg: '#92400E' },
  ready: { label: 'Listo', bg: '#DCFCE7', fg: '#166534' },
  completed: { label: 'Completado', bg: '#F3F4F6', fg: '#1F2937' },
  cancelled: { label: 'Cancelado', bg: '#FEE2E2', fg: '#991B1B' },
};
const DELIVERY = { pickup: 'Recoger en el local', situka: 'Entrega con Situka' } as const;

// The customer's food orders (web: /dashboard/orders), newest first; open
// ones can still be cancelled.
export default function MyFoodOrdersScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const orders = useQuery({ queryKey: ['foodOrders', 'mine', uid], queryFn: () => getFoodOrdersByCustomer(uid), enabled: !!uid });
  const cancel = useMutation({
    mutationFn: (orderId: string) => cancelFoodOrder(orderId, uid),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodOrders', 'mine'] }),
    onError: (e: Error) => Alert.alert('No se pudo cancelar', e.message),
  });

  const confirmCancel = (order: FoodOrder) =>
    Alert.alert('¿Cancelar este pedido?', `Se notificará a ${order.companyName}. Esta acción no se puede deshacer.`, [
      { text: 'Volver', style: 'cancel' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel.mutate(order.id) },
    ]);

  return (
    <>
      <Stack.Screen options={{ title: 'Mis pedidos de comida' }} />
      {orders.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={orders.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => orders.refetch()} />}
          ListEmptyComponent={
            <View className="gap-4">
              <EmptyState icon={UtensilsCrossed} title="Todavía no ha hecho ningún pedido" description="Pida comida de los restaurantes de Oltinde." />
              <Button variant="outline" onPress={() => router.push('/food')}>Explorar restaurantes</Button>
            </View>
          }
          renderItem={({ item, index }) => {
            const s = STATUS[item.status];
            const canCancel = item.status === 'placed' || item.status === 'confirmed';
            return (
              <FadeInItem index={index}>
                <View className="gap-3 rounded-lg border border-border bg-card p-4">
                  <View className="flex-row items-start justify-between gap-2">
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <ShoppingBag size={15} color="#1A1C1C" />
                        <Text
                          className="flex-shrink text-[15px] font-semibold text-foreground"
                          onPress={() => router.push(`/companies/${item.companyId}`)}
                          numberOfLines={1}
                        >
                          {item.companyName}
                        </Text>
                      </View>
                      <Text className="mt-0.5 text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString('es-ES')}</Text>
                    </View>
                    <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: s.bg }}>
                      <Text className="text-xs font-semibold" style={{ color: s.fg }}>{s.label}</Text>
                    </View>
                  </View>
                  <View className="gap-1 border-t border-border pt-3">
                    {item.items.map((line, i) => (
                      <View key={i} className="flex-row justify-between gap-3">
                        <Text className="flex-1 text-sm text-foreground">{line.quantity}× {line.name}</Text>
                        <Text className="text-sm text-muted-foreground">{formatXaf(line.price * line.quantity)}</Text>
                      </View>
                    ))}
                    <View className="mt-1 flex-row justify-between border-t border-border pt-2">
                      <Text className="text-sm font-semibold text-foreground">Subtotal</Text>
                      <Text className="text-sm font-semibold text-foreground">{formatXaf(item.subtotal)}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <MapPin size={12} color="#6B6B6B" />
                    <Text className="text-xs text-muted-foreground">{DELIVERY[item.deliveryMethod]}</Text>
                  </View>
                  {canCancel ? (
                    <Button variant="outline" onPress={() => confirmCancel(item)} loading={cancel.isPending && cancel.variables === item.id}>
                      Cancelar pedido
                    </Button>
                  ) : null}
                </View>
              </FadeInItem>
            );
          }}
        />
      )}
    </>
  );
}
