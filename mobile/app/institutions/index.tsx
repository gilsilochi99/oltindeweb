import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Landmark } from 'lucide-react-native';
import { useInstitutions } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function InstitutionsScreen() {
  const { data: institutions, isLoading, refetch, isRefetching } = useInstitutions();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    institutions,
    (i) => `${i.name} ${i.category}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Instituciones',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar instituciones…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(i) => i.id}
        emptyTitle="No hay instituciones todavía"
        emptyIcon={Landmark}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.logo}
            title={item.name}
            subtitle={item.category}
            onPress={() => router.push(`/institutions/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
