import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ImageOff } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CUSTOMER_CANCELLABLE, DELIVERY_METHOD_LABELS, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, absoluteUrl, cancelMyOrder, formatXaf,
  type ShopOrder, type ShopOrderStatus,
} from '../../lib/shop';

const STATUS_STYLE: Record<ShopOrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-900',
  confirmed: 'bg-blue-100 text-blue-900',
  processing: 'bg-blue-100 text-blue-900',
  shipped: 'bg-indigo-100 text-indigo-900',
  delivered: 'bg-green-100 text-green-900',
  cancelled: 'bg-red-100 text-red-900',
};

export function OrderStatusPill({ status }: { status: ShopOrderStatus }) {
  const [bg, fg] = STATUS_STYLE[status].split(' ');
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${bg}`}>
      <Text className={`text-xs font-semibold ${fg}`}>{ORDER_STATUS_LABELS[status]}</Text>
    </View>
  );
}

export function OrderCard({ order }: { order: ShopOrder }) {
  const queryClient = useQueryClient();
  const cancel = useMutation({
    mutationFn: () => cancelMyOrder(order.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'checkout'] });
    },
    onError: (e: Error) => Alert.alert('No se pudo cancelar', e.message),
  });

  const confirmCancel = () =>
    Alert.alert('Cancelar pedido', `¿Cancelar el pedido ${order.orderNumber}?`, [
      { text: 'No' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel.mutate() },
    ]);

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4" style={{ elevation: 1 }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-semibold text-foreground">{order.orderNumber}</Text>
          <Text className="text-xs text-muted-foreground">
            {order.companyName} · {format(new Date(order.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
          </Text>
        </View>
        <OrderStatusPill status={order.status} />
      </View>

      {order.items.map((item) => {
        const image = absoluteUrl(item.image);
        return (
          <Pressable
            key={item.id}
            disabled={!item.productSlug}
            onPress={() => item.productSlug && router.push(`/tienda/p/${item.productSlug}`)}
            className="flex-row items-center gap-3"
          >
            <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-white">
              {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : <ImageOff size={14} color="#C4C4C4" />}
            </View>
            <View className="flex-1">
              <Text className="text-sm text-foreground" numberOfLines={1}>{item.productTitle}</Text>
              <Text className="text-xs text-muted-foreground">
                {item.variantTitle !== 'Estándar' ? `${item.variantTitle} · ` : ''}{item.quantity} × {formatXaf(item.unitPrice)}
              </Text>
            </View>
          </Pressable>
        );
      })}

      <View className="gap-1 border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">
          {DELIVERY_METHOD_LABELS[order.deliveryMethod]}
          {order.deliveryMethod === 'delivery' && order.deliveryAddress ? `: ${order.deliveryAddress}${order.deliveryCity ? `, ${order.deliveryCity}` : ''}` : ''}
        </Text>
        <Text className="text-xs text-muted-foreground">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</Text>
        {order.discount > 0 ? <Text className="text-xs text-green-700">Descuento: −{formatXaf(order.discount)}</Text> : null}
        {order.deliveryFee > 0 ? <Text className="text-xs text-muted-foreground">Envío: {formatXaf(order.deliveryFee)}</Text> : null}
        <Text className="text-base font-semibold text-foreground">Total: {formatXaf(order.total)}</Text>
        {order.status === 'cancelled' && order.cancelReason ? (
          <Text className="text-xs text-destructive">Motivo: {order.cancelReason}</Text>
        ) : null}
      </View>

      {CUSTOMER_CANCELLABLE.includes(order.status) ? (
        <Pressable onPress={confirmCancel} disabled={cancel.isPending} className="self-start">
          <Text className="text-sm font-semibold text-destructive">{cancel.isPending ? 'Cancelando…' : 'Cancelar pedido'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
