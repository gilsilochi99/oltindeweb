import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ShoppingCart } from 'lucide-react-native';
import { useShopCart } from '../../hooks/use-shop-cart';

// Header cart icon with the item count.
export function CartButton() {
  const { itemCount } = useShopCart();
  return (
    <Pressable onPress={() => router.push('/tienda/carrito')} hitSlop={10} className="mr-1 p-1" accessibilityLabel="Carrito">
      <ShoppingCart size={22} color="#1A1C1C" />
      {itemCount > 0 ? (
        <View className="absolute -right-1 -top-1 min-w-[18px] items-center rounded-full bg-destructive px-1">
          <Text className="text-[11px] font-bold text-white">{itemCount > 99 ? '99+' : itemCount}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
