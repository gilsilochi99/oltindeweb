import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Briefcase, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useServices, useDeleteService } from '../../../src/hooks/use-queries';
import { useSearchableList } from '../../../src/hooks/use-searchable-list';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ListSearchHeaderButton } from '../../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../../src/components/ui/LoadMoreFooter';

export default function StaffServicesScreen() {
  const { data: services, isLoading } = useServices();
  const deleteService = useDeleteService();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    services,
    (s) => `${s.name} ${s.category}`,
  );

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Eliminar servicio', `¿Eliminar "${name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteService.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Servicios',
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
              <Pressable onPress={() => router.push('/staff/services/new')} hitSlop={8}>
                <Plus size={22} color="#1A1C1C" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar servicios…" />
      {isLoading ? (
        <LoadingState />
      ) : !services || services.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <EmptyState title="No hay servicios todavía" description="Añade el catálogo de servicios de la app." icon={Briefcase} />
          <Pressable onPress={() => router.push('/staff/services/new')} className="rounded-full bg-primary px-6 py-3">
            <Text className="text-sm font-semibold text-primary-foreground">Añadir servicio</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {visible.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-primary/15">
                <Briefcase size={18} color="hsl(48, 100%, 35%)" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {item.category}
                </Text>
              </View>
              <Pressable onPress={() => router.push(`/staff/services/${item.id}`)} className="h-9 w-9 items-center justify-center">
                <Pencil size={16} color="#374151" />
              </Pressable>
              <Pressable onPress={() => confirmDelete(item.id, item.name)} className="h-9 w-9 items-center justify-center">
                <Trash2 size={16} color="#EF4444" />
              </Pressable>
            </View>
          ))}
          {hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
