import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Map } from 'lucide-react-native';
import { useItineraries } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function ItinerariesScreen() {
  const { data: itineraries, isLoading, refetch, isRefetching } = useItineraries();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    itineraries,
    (i) => `${i.title} ${i.city}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Itinerarios',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar itinerarios…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(i) => i.id}
        emptyTitle="No hay itinerarios todavía"
        emptyIcon={Map}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.coverImage}
            title={item.title}
            subtitle={`${item.city} · ${item.durationDays} día${item.durationDays === 1 ? '' : 's'}`}
            onPress={() => router.push(`/itineraries/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
