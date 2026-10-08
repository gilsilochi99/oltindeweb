import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ImageOff, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useMenuItemsByCompany, useMenuItemMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';

export default function MenuManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: items, isLoading } = useMenuItemsByCompany(id);
  const { remove, toggleAvailable } = useMenuItemMutations(id);

  const confirmDelete = (itemId: string, name: string) => {
    Alert.alert('Eliminar producto', `¿Eliminar "${name}" del menú?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(itemId) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Menú',
          headerRight: () => (
            <Pressable onPress={() => router.push(`/business/${id}/menu/new`)} hitSlop={8}>
              <Plus size={22} color="#1A1C1C" />
            </Pressable>
          ),
        }}
      />
      {isLoading ? (
        <LoadingState />
      ) : !items || items.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <EmptyState title="Todavía no tienes productos" description="Añade platos y bebidas para que tus clientes puedan pedir." />
          <Pressable onPress={() => router.push(`/business/${id}/menu/new`)} className="rounded-full bg-primary px-6 py-3">
            <Text className="text-sm font-semibold text-primary-foreground">Añadir producto</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {items.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3">
              <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {item.image ? (
                  <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                ) : (
                  <ImageOff size={18} color="#C4C4C4" />
                )}
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground">{item.foodType} · {item.price.toLocaleString('es-ES')} XAF</Text>
              </View>
              <Switch value={item.available} onValueChange={(v) => toggleAvailable.mutate({ itemId: item.id, available: v })} />
              <Pressable onPress={() => router.push(`/business/${id}/menu/${item.id}`)} className="h-9 w-9 items-center justify-center">
                <Pencil size={16} color="#374151" />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item.id, item.name)} className="h-9 w-9 items-center justify-center">
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
