import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Tag } from 'lucide-react-native';
import { useAllOffers } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { Badge } from '../../src/components/ui/Badge';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function OffersScreen() {
  const { data: offers, isLoading, refetch, isRefetching } = useAllOffers();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    offers,
    (o) => `${o.offer.title} ${o.company.name}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Ofertas',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar ofertas…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={({ offer }) => offer.id}
        emptyTitle="No hay ofertas activas"
        emptyIcon={Tag}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.offer.image || item.company.logo}
            title={item.offer.title}
            subtitle={item.company.name}
            meta={<Badge label={item.offer.discount} variant="primary" />}
            onPress={() => router.push(`/offers/${item.offer.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
