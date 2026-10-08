import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { UserRound } from 'lucide-react-native';
import { useActiveProfessionals } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';
import { StarRating, averageRating } from '../../src/components/ui/StarRating';

export default function ProfessionalsScreen() {
  const { data: professionals, isLoading, refetch, isRefetching } = useActiveProfessionals();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    professionals,
    (p) => `${p.displayName} ${p.title} ${p.city}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Profesionales',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar profesionales…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(p) => p.id}
        emptyTitle="No hay profesionales todavía"
        emptyIcon={UserRound}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.photo}
            title={item.displayName}
            subtitle={`${item.title} · ${item.city}`}
            verified={item.isVerified}
            meta={<StarRating rating={averageRating(item.reviews)} count={item.reviews.length} />}
            onPress={() => router.push(`/professionals/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
