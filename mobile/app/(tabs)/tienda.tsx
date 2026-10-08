import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CartButton } from '../../src/components/shop/CartButton';
import { NewTag } from '../../src/components/ui/Rail';
import TiendaHomeScreen from '../tienda/index';

// The Tienda tab: the store's home page with its own title bar (inside the
// tabs there's no stack header).
export default function TiendaTab() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between border-b border-border px-4 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-xl font-extrabold uppercase tracking-wide text-foreground">Tienda</Text>
          <NewTag />
        </View>
        <CartButton />
      </View>
      <TiendaHomeScreen />
    </SafeAreaView>
  );
}
