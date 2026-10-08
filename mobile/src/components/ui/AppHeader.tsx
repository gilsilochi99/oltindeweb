import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import Animated, { type SharedValue, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';
import { Bell, Search, ShoppingCart, type LucideIcon } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useShopCart } from '../../hooks/use-shop-cart';
import { rpc } from '../../lib/api';
import { PressableScale } from './motion';

// Top bar shared by every tab screen: the Oltinde logo on the left and
// search, notifications and cart on the right (with unread / item badges).
// Pass `scrollY` to fade in a hairline once the page scrolls.
export function AppHeader({ scrollY, hide = [] }: { scrollY?: SharedValue<number>; hide?: ('search' | 'notifications' | 'cart')[] }) {
  const { user } = useAuth();
  const cart = useShopCart();
  const unread = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: () => rpc<{ isRead: boolean }[]>('getMyNotifications'),
    enabled: !!user,
    select: (list) => list.filter((n) => !n.isRead).length,
  });

  const bar = useAnimatedStyle(() => ({
    borderBottomColor: `rgba(0,0,0,${scrollY ? interpolate(scrollY.value, [0, 40], [0, 0.1], Extrapolation.CLAMP) : 0.1})`,
  }));

  return (
    <Animated.View style={[bar, { borderBottomWidth: 1 }]} className="flex-row items-center justify-between bg-background px-4 py-2">
      <PressableScale onPress={() => router.navigate('/')} scaleTo={0.95} haptic="none" accessibilityLabel="Oltinde, inicio">
        <Image source={require('../../../assets/wordmark-logo.png')} style={{ width: 124, height: 32 }} contentFit="contain" />
      </PressableScale>
      <View className="flex-row items-center">
        {!hide.includes('search') ? <HeaderIcon icon={Search} label="Buscar" onPress={() => router.navigate('/search')} /> : null}
        {!hide.includes('notifications') ? <HeaderIcon icon={Bell} label="Avisos" badge={unread.data} onPress={() => router.navigate('/notifications')} /> : null}
        {!hide.includes('cart') ? <HeaderIcon icon={ShoppingCart} label="Carrito" badge={cart.itemCount} onPress={() => router.push('/tienda/carrito')} /> : null}
      </View>
    </Animated.View>
  );
}

function HeaderIcon({ icon: Icon, badge, label, onPress }: { icon: LucideIcon; badge?: number; label: string; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} scaleTo={0.88} haptic="selection" accessibilityLabel={label} className="h-11 w-11 items-center justify-center">
      <Icon size={22} color="#1A1C1C" />
      {badge ? (
        <View className="absolute right-1 top-1 min-w-[17px] items-center rounded-full bg-primary px-1">
          <Text className="text-[10px] font-extrabold text-black">{badge > 99 ? '99+' : badge}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}
