import { useEffect } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ImageOff, Minus, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react-native';
import { absoluteUrl, formatXaf, getCartDetails, type CartItemDetail } from '../../src/lib/shop';
import { useShopCart } from '../../src/hooks/use-shop-cart';
import { Button } from '../../src/components/ui/Button';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

const ISSUE_TEXT: Record<NonNullable<CartItemDetail['issue']>, string> = {
  unavailable: 'Ya no está disponible',
  out_of_stock: 'Agotado',
  insufficient_stock: 'No hay tantas unidades',
};

export default function CartScreen() {
  const cart = useShopCart();
  const details = useQuery({
    queryKey: ['shop', 'cart', cart.lines],
    queryFn: () => getCartDetails(cart.lines),
    enabled: cart.lines.length > 0,
    placeholderData: keepPreviousData,
  });

  // Products deleted or unpublished since they were added: drop them.
  const missing = details.data?.missingVariantIds ?? [];
  useEffect(() => {
    if (missing.length > 0) cart.remove(missing);
  }, [missing.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  if (cart.lines.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Carrito' }} />
        <EmptyState icon={ShoppingCart} title="Su carrito está vacío" description="Explore la Tienda y añada productos." />
        <View className="px-6 pb-6">
          <Button onPress={() => router.replace('/tienda')}>Ir a la Tienda</Button>
        </View>
      </SafeAreaView>
    );
  }

  if (details.isLoading || !details.data) return <LoadingState />;
  const data = details.data;
  const hasIssues = data.groups.some((g) => g.items.some((i) => i.issue));

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: `Carrito (${data.itemCount})` }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
        {data.groups.length > 1 ? (
          <Text className="text-sm text-muted-foreground">
            Su carrito tiene productos de {data.groups.length} tiendas: se creará un pedido para cada una.
          </Text>
        ) : null}
        {data.groups.map((group) => (
          <View key={group.companyId} className="overflow-hidden rounded-lg border border-border bg-card" style={{ elevation: 1 }}>
            <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
              <Store size={16} color="#1A1C1C" />
              <Text className="flex-1 text-sm font-bold text-foreground" numberOfLines={1}>{group.companyName}</Text>
              {group.companyCity ? <Text className="text-xs text-muted-foreground">{group.companyCity}</Text> : null}
            </View>
            {group.items.map((item) => (
              <CartRow key={item.variantId} item={item} onQuantity={(q) => cart.setQuantity(item.variantId, q)} onRemove={() => cart.remove(item.variantId)} />
            ))}
            <View className="flex-row justify-between border-t border-border px-4 py-3">
              <Text className="text-sm text-muted-foreground">Subtotal</Text>
              <Text className="text-sm font-bold text-foreground">{formatXaf(group.subtotal)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
      <View className="gap-2 border-t border-border bg-card px-4 py-3">
        <View className="flex-row items-baseline justify-between">
          <Text className="text-base text-foreground">Total productos</Text>
          <Text className="text-xl font-extrabold text-foreground">{formatXaf(data.subtotal)}</Text>
        </View>
        {hasIssues ? <Text className="text-xs text-destructive">Quite o ajuste los productos marcados para continuar.</Text> : null}
        <Button onPress={() => router.push('/tienda/checkout')} disabled={hasIssues || data.subtotal === 0}>
          Tramitar pedido
        </Button>
      </View>
    </SafeAreaView>
  );
}

function CartRow({ item, onQuantity, onRemove }: { item: CartItemDetail; onQuantity: (q: number) => void; onRemove: () => void }) {
  const image = absoluteUrl(item.image);
  return (
    <View className="flex-row gap-3 border-b border-border px-4 py-3">
      <Pressable onPress={() => router.push(`/tienda/p/${item.productSlug}`)} className="h-20 w-20 items-center justify-center overflow-hidden rounded-lg bg-white">
        {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="contain" /> : <ImageOff size={18} color="#C4C4C4" />}
      </Pressable>
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{item.productTitle}</Text>
        {item.hasOptions ? <Text className="text-xs text-muted-foreground">{item.variantTitle}</Text> : null}
        <Text className="text-sm font-bold text-foreground">{formatXaf(item.unitPrice)}</Text>
        {item.issue ? (
          <Text className="text-xs font-semibold text-destructive">
            {ISSUE_TEXT[item.issue]}{item.issue === 'insufficient_stock' ? ` (quedan ${item.maxQuantity})` : ''}
          </Text>
        ) : null}
        <View className="mt-1 flex-row items-center justify-between">
          <View className="flex-row items-center rounded-lg border border-input">
            <Pressable onPress={() => onQuantity(item.quantity - 1)} className="p-2" hitSlop={4}>
              <Minus size={14} color="#1A1C1C" />
            </Pressable>
            <Text className="w-7 text-center text-sm font-semibold text-foreground">{item.quantity}</Text>
            <Pressable
              onPress={() => onQuantity(Math.min(item.maxQuantity || item.quantity, item.quantity + 1))}
              className="p-2"
              hitSlop={4}
              disabled={item.quantity >= item.maxQuantity}
            >
              <Plus size={14} color={item.quantity >= item.maxQuantity ? '#C4C4C4' : '#1A1C1C'} />
            </Pressable>
          </View>
          <Pressable onPress={onRemove} hitSlop={8} className="flex-row items-center gap-1">
            <Trash2 size={15} color="#DC2626" />
            <Text className="text-xs font-medium text-destructive">Quitar</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
