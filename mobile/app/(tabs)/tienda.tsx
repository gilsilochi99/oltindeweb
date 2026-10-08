import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { NewTag } from '../../src/components/ui/Rail';
import TiendaHomeScreen from '../tienda/index';

// The Tienda tab: the store's home page under the shared top bar (inside the
// tabs there's no stack header).
export default function TiendaTab() {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader />
      <View className="flex-row items-center gap-2 px-4 pb-1 pt-3">
        <Text className="text-xl font-extrabold uppercase tracking-wide text-foreground">Tienda</Text>
        <NewTag />
      </View>
      <TiendaHomeScreen />
    </SafeAreaView>
  );
}
