import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import { getCheckoutOrders } from '../../../src/lib/shop';
import { OrderCard } from '../../../src/components/shop/OrderCard';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

// Shown right after checkout (one order per seller).
export default function OrderPlacedScreen() {
  const { checkoutId } = useLocalSearchParams<{ checkoutId: string }>();
  const { data: orders, isLoading } = useQuery({
    queryKey: ['shop', 'checkout', checkoutId],
    queryFn: () => getCheckoutOrders(checkoutId),
    enabled: !!checkoutId,
  });

  if (isLoading) return <LoadingState />;
  if (!orders || orders.length === 0) return <EmptyState title="Pedido no encontrado" />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Pedido realizado', headerBackVisible: false }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
        <View className="items-center gap-2 py-4">
          <CheckCircle2 size={52} color="#15803D" />
          <Text className="text-center text-xl font-extrabold text-foreground">¡Gracias por su pedido!</Text>
          <Text className="text-center text-sm text-muted-foreground">
            {orders.length > 1 ? `Hemos enviado ${orders.length} pedidos, uno a cada tienda.` : 'Hemos enviado su pedido a la tienda.'} El vendedor
            le contactará por teléfono para confirmarlo. Recibirá un aviso cuando cambie de estado.
          </Text>
        </View>
        {orders.map((order) => <OrderCard key={order.id} order={order} />)}
        <Button onPress={() => router.replace('/tienda/pedidos')}>Ver mis compras</Button>
        <Button variant="outline" onPress={() => router.replace('/tienda')}>Seguir comprando</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
