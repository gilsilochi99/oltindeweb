import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { MessageCircle, Phone, Receipt } from 'lucide-react-native';
import { DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS, formatXaf, type ShopOrderStatus } from '../../../src/lib/shop';
import { ORDER_ACTION_LABELS, ORDER_TRANSITIONS, getSellerOrders, setOrderPaymentStatus, updateOrderStatus, type SellerOrder } from '../../../src/lib/business';
import { OrderStatusPill } from '../../../src/components/shop/OrderCard';
import { Chip } from '../../../src/components/ui/Rail';
import { ReasonModal } from '../../../src/components/ui/ReasonModal';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

type Filter = 'open' | ShopOrderStatus | undefined;
const FILTERS: { value: Filter; label: string }[] = [
  { value: 'open', label: 'Abiertos' },
  { value: 'pending', label: 'Pendientes' },
  { value: 'delivered', label: 'Entregados' },
  { value: 'cancelled', label: 'Cancelados' },
  { value: undefined, label: 'Todos' },
];

export default function SellerOrdersScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<Filter>('open');
  const orders = useQuery({ queryKey: ['seller', 'orders', id, filter], queryFn: () => getSellerOrders(id, filter) });

  return (
    <>
      <Stack.Screen options={{ title: 'Pedidos de la Tienda' }} />
      <View className="border-b border-border px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTERS.map((f) => (
            <Chip
              key={f.label}
              label={`${f.label}${f.value && f.value !== 'open' && orders.data?.counts[f.value] ? ` (${orders.data.counts[f.value]})` : ''}`}
              selected={filter === f.value}
              onPress={() => setFilter(f.value)}
            />
          ))}
        </ScrollView>
      </View>
      {orders.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={orders.data?.orders ?? []}
          keyExtractor={(o) => o.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          renderItem={({ item }) => <SellerOrderCard order={item} />}
          refreshControl={<RefreshControl refreshing={orders.isRefetching} onRefresh={() => orders.refetch()} />}
          ListEmptyComponent={<EmptyState icon={Receipt} title="No hay pedidos" description="Los pedidos de sus productos aparecerán aquí." />}
        />
      )}
    </>
  );
}

function SellerOrderCard({ order }: { order: SellerOrder }) {
  const queryClient = useQueryClient();
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['seller', 'orders'] });
  const change = useMutation({
    mutationFn: ({ status, note }: { status: ShopOrderStatus; note?: string }) => updateOrderStatus(order.id, status, note),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('No se pudo actualizar', e.message),
  });
  const paid = useMutation({
    mutationFn: () => setOrderPaymentStatus(order.id, order.paymentStatus === 'paid' ? 'pending' : 'paid'),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('No se pudo actualizar', e.message),
  });

  const [cancelling, setCancelling] = useState(false);
  const digits = order.customerPhone.replace(/[^\d]/g, '');
  const onAction = (status: ShopOrderStatus) => {
    if (status === 'cancelled') {
      setCancelling(true); // the customer sees the reason (required by the server)
    } else {
      change.mutate({ status });
    }
  };

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4" style={{ elevation: 1 }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">{order.orderNumber}</Text>
          <Text className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "d MMM yyyy, HH:mm", { locale: es })}</Text>
        </View>
        <OrderStatusPill status={order.status} />
      </View>

      <View className="gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{order.customerName}</Text>
        <Text className="text-xs text-muted-foreground">
          {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
          {order.deliveryMethod === 'delivery' && order.deliveryAddress ? `: ${order.deliveryAddress}${order.deliveryCity ? `, ${order.deliveryCity}` : ''}` : ''}
        </Text>
        {order.notes ? <Text className="text-xs text-foreground">Nota: {order.notes}</Text> : null}
      </View>
      <View className="flex-row gap-2">
        <Pressable onPress={() => Linking.openURL(`tel:${order.customerPhone.replace(/\s/g, '')}`)} className="flex-row items-center gap-1.5 rounded-lg border border-border px-3 py-2">
          <Phone size={14} color="#1A1C1C" />
          <Text className="text-xs font-semibold text-foreground">Llamar</Text>
        </Pressable>
        {digits.length >= 6 ? (
          <Pressable
            onPress={() => Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(`Hola ${order.customerName}, le escribimos de ${order.companyName} sobre su pedido ${order.orderNumber} en Oltinde.`)}`)}
            className="flex-row items-center gap-1.5 rounded-lg px-3 py-2"
            style={{ backgroundColor: '#25D366' }}
          >
            <MessageCircle size={14} color="#fff" />
            <Text className="text-xs font-semibold text-white">WhatsApp</Text>
          </Pressable>
        ) : null}
      </View>

      <View className="gap-1 border-t border-border pt-3">
        {order.items.map((item) => (
          <Text key={item.id} className="text-sm text-foreground" numberOfLines={2}>
            {item.quantity} × {item.productTitle}{item.variantTitle !== 'Estándar' ? ` (${item.variantTitle})` : ''}
          </Text>
        ))}
        <Text className="mt-1 text-base font-semibold text-foreground">Total: {formatXaf(order.total)}</Text>
        <Text className="text-xs text-muted-foreground">
          {PAYMENT_METHOD_LABELS[order.paymentMethod]} · {order.paymentStatus === 'paid' ? 'Pagado' : order.paymentStatus === 'refunded' ? 'Reembolsado' : 'Pendiente de pago'}
        </Text>
        {order.commissionAmount > 0 ? <Text className="text-xs text-muted-foreground">Comisión Oltinde: {formatXaf(order.commissionAmount)}</Text> : null}
      </View>

      {ORDER_TRANSITIONS[order.status].length > 0 || order.status !== 'cancelled' ? (
        <View className="flex-row flex-wrap gap-2">
          {ORDER_TRANSITIONS[order.status].map((status) => (
            <Pressable
              key={status}
              disabled={change.isPending}
              onPress={() => onAction(status)}
              className={`rounded-lg px-3.5 py-2 ${status === 'cancelled' ? 'border border-destructive' : 'bg-primary'}`}
            >
              <Text className={`text-sm font-semibold ${status === 'cancelled' ? 'text-destructive' : 'text-primary-foreground'}`}>
                {ORDER_ACTION_LABELS[status]}
              </Text>
            </Pressable>
          ))}
          {order.status !== 'cancelled' && order.paymentStatus !== 'refunded' ? (
            <Pressable disabled={paid.isPending} onPress={() => paid.mutate()} className="rounded-lg border border-border px-3.5 py-2">
              <Text className="text-sm font-semibold text-foreground">{order.paymentStatus === 'paid' ? 'Marcar como no pagado' : 'Marcar como pagado'}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
      {order.status === 'cancelled' && order.cancelReason ? <Text className="text-xs text-destructive">Motivo: {order.cancelReason}</Text> : null}
      <ReasonModal
        visible={cancelling}
        title={`Cancelar pedido ${order.orderNumber}`}
        description="El cliente recibirá un aviso con el motivo y el stock se repondrá."
        options={['Producto sin stock', 'No podemos realizar la entrega', 'A petición del cliente']}
        confirmLabel="Cancelar pedido"
        onClose={() => setCancelling(false)}
        onConfirm={(note) => {
          setCancelling(false);
          change.mutate({ status: 'cancelled', note });
        }}
      />
    </View>
  );
}
