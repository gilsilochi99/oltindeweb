import { FlatList, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react-native';
import { getMyOrders } from '../../src/lib/shop';
import { OrderCard } from '../../src/components/shop/OrderCard';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function MyOrdersScreen() {
  const orders = useQuery({ queryKey: ['shop', 'orders'], queryFn: getMyOrders });

  return (
    <>
      <Stack.Screen options={{ title: 'Mis compras' }} />
      {orders.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={orders.data ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          renderItem={({ item }) => <OrderCard order={item} />}
          refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => orders.refetch()} />}
          ListEmptyComponent={<EmptyState icon={Package} title="Todavía no ha comprado nada" description="Sus pedidos de la Tienda aparecerán aquí." />}
        />
      )}
    </>
  );
}
