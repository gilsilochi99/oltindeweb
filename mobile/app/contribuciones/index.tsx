import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Newspaper } from 'lucide-react-native';
import { usePublishedPosts } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function ContribucionesScreen() {
  const { data: posts, isLoading, refetch, isRefetching } = usePublishedPosts();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    posts,
    (p) => `${p.title} ${p.authorName} ${p.category ?? ''}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Contribuciones',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar contribuciones…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(p) => p.id}
        emptyTitle="No hay contribuciones todavía"
        emptyIcon={Newspaper}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.featuredImage}
            title={item.title}
            subtitle={`${item.authorName}${item.category ? ' · ' + item.category : ''}`}
            onPress={() => router.push(`/contribuciones/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
