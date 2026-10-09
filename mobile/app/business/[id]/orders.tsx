import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useFoodOrdersByCompany, useUpdateFoodOrderStatus } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { FoodOrderStatus } from '../../../src/lib/types';

const STATUS_FLOW: FoodOrderStatus[] = ['placed', 'confirmed', 'preparing', 'ready', 'completed'];
const STATUS_LABELS: Record<FoodOrderStatus, string> = {
  placed: 'Recibido',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  ready: 'Listo',
  completed: 'Completado',
  cancelled: 'Cancelado',
};

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

export default function OrdersManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: orders, isLoading } = useFoodOrdersByCompany(id);
  const updateStatus = useUpdateFoodOrderStatus(id);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Pedidos' }} />
      {isLoading ? (
        <LoadingState />
      ) : !orders || orders.length === 0 ? (
        <EmptyState title="Todavía no tienes pedidos" description="Cuando un cliente pida a través de la app, aparecerá aquí." />
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-4">
          {orders.map((order) => (
            <View key={order.id} className="gap-3 rounded-lg border border-border bg-card p-3.5">
              <View className="flex-row items-start justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{order.customerName}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {order.customerPhone} · {format(new Date(order.createdAt), "d MMM, HH:mm", { locale: es })}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-foreground">{formatPrice(order.subtotal)}</Text>
              </View>

              <View className="gap-1 border-t border-border pt-2">
                {order.items.map((item, i) => (
                  <View key={i}>
                    <Text className="text-sm text-foreground">
                      {item.quantity}× {item.name}
                    </Text>
                    {item.selectedOptions?.map((opt, j) => (
                      <Text key={j} className="ml-4 text-xs text-muted-foreground">
                        {opt.optionName}
                      </Text>
                    ))}
                  </View>
                ))}
              </View>

              <View className="flex-row flex-wrap items-center gap-1.5 border-t border-border pt-2">
                <Text className="mr-1 text-xs text-muted-foreground">
                  {order.deliveryMethod === 'situka' ? 'Envío' : 'Recogida'} · {order.paymentMethod === 'muni_dinero' ? 'Muni Dinero' : 'Efectivo'}
                </Text>
              </View>

              {order.status === 'cancelled' ? (
                <View className="self-start rounded-full bg-muted px-3 py-1.5">
                  <Text className="text-xs font-semibold text-muted-foreground">Cancelado</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap gap-2">
                  {STATUS_FLOW.map((status) => {
                    const selected = order.status === status;
                    return (
                      <Pressable
                        key={status}
                        disabled={selected}
                        onPress={() => updateStatus.mutate({ order, status })}
                        className={`rounded-full px-3 py-1.5 ${selected ? 'bg-primary' : 'bg-muted'}`}
                      >
                        <Text className={`text-xs font-semibold ${selected ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                          {STATUS_LABELS[status]}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
