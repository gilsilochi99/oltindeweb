import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { MapPinned, Plus } from 'lucide-react-native';
import { useTouristLocations } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';
import { StarRating, averageRating } from '../../src/components/ui/StarRating';

export default function PlacesScreen() {
  const { data: places, isLoading, refetch, isRefetching } = useTouristLocations();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    places,
    (p) => `${p.name} ${p.category}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Lugares',
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
              <Pressable onPress={() => router.push('/places/suggest')} hitSlop={8}>
                <Plus size={22} color="#1A1C1C" />
              </Pressable>
            </View>
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar lugares…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(p) => p.id}
        emptyTitle="No hay lugares todavía"
        emptyIcon={MapPinned}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.image}
            title={item.name}
            subtitle={`${item.category} · ${item.location?.city}`}
            meta={<StarRating rating={averageRating(item.reviews)} count={item.reviews.length} />}
            onPress={() => router.push(`/places/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
