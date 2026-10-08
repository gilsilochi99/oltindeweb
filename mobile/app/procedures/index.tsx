import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { ChevronRight, FileText } from 'lucide-react-native';
import { useProcedures } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function ProceduresScreen() {
  const { data: procedures, isLoading, refetch, isRefetching } = useProcedures();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    procedures,
    (p) => `${p.name} ${p.category} ${p.institution}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Trámites',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar trámites…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(p) => p.id}
        emptyTitle="No hay trámites todavía"
        emptyIcon={FileText}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(`/procedures/${item.id}`)}
            className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-4 active:opacity-80"
            style={{ elevation: 1 }}
          >
            <View className="h-12 w-12 items-center justify-center rounded-lg bg-primary/15">
              <FileText size={22} color="hsl(48, 100%, 35%)" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-bold leading-5 text-foreground" numberOfLines={2}>
                {item.name}
              </Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {item.category} · {item.institution}
              </Text>
            </View>
            <ChevronRight size={18} color="#8A8A8A" />
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
