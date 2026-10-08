import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { FileText, Pencil, Plus, Trash2 } from 'lucide-react-native';
import { useProcedures, useDeleteProcedure } from '../../../src/hooks/use-queries';
import { useSearchableList } from '../../../src/hooks/use-searchable-list';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { ListSearchHeaderButton } from '../../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../../src/components/ui/LoadMoreFooter';

export default function StaffProceduresScreen() {
  const { data: procedures, isLoading } = useProcedures();
  const deleteProcedure = useDeleteProcedure();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    procedures,
    (p) => `${p.name} ${p.category} ${p.institution}`,
  );

  const confirmDelete = (id: string, name: string) => {
    Alert.alert('Eliminar trámite', `¿Eliminar "${name}"? Esta acción no se puede deshacer.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => deleteProcedure.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Trámites',
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
              <Pressable onPress={() => router.push('/staff/procedures/new')} hitSlop={8}>
                <Plus size={22} color="#1A1C1C" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar trámites…" />
      {isLoading ? (
        <LoadingState />
      ) : !procedures || procedures.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <EmptyState title="No hay trámites todavía" description="Añade el primer trámite para que aparezca en la app." icon={FileText} />
          <Pressable onPress={() => router.push('/staff/procedures/new')} className="rounded-full bg-primary px-6 py-3">
            <Text className="text-sm font-semibold text-primary-foreground">Añadir trámite</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {visible.map((item) => (
            <View key={item.id} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3.5">
              <View className="h-11 w-11 items-center justify-center rounded-lg bg-primary/15">
                <FileText size={18} color="hsl(48, 100%, 35%)" />
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                  {item.category} · {item.institution}
                </Text>
              </View>
              <Pressable onPress={() => router.push(`/staff/procedures/${item.id}`)} className="h-9 w-9 items-center justify-center">
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
