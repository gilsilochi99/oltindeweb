import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Building2 } from 'lucide-react-native';
import { useActiveCompanies } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';
import { OpenStatusBadge } from '../../src/components/ui/OpenStatusBadge';
import { averageRating } from '../../src/components/ui/StarRating';

export default function CompaniesScreen() {
  const { data: companies, isLoading, refetch, isRefetching } = useActiveCompanies();
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    companies,
    (c) => `${c.name} ${c.category}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Empresas',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar empresas…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(c) => c.id}
        emptyTitle="No hay empresas todavía"
        emptyIcon={Building2}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.logo}
            title={item.name}
            subtitle={[item.category, item.branches?.[0]?.location?.city].filter(Boolean).join(' · ')}
            verified={item.isVerified}
            rating={averageRating(item.reviews)}
            reviewCount={item.reviews.length}
            description={item.description}
            phone={item.branches?.[0]?.contact?.phone}
            whatsapp={item.contact?.socialMedia?.whatsapp}
            meta={<OpenStatusBadge branch={item.branches?.[0]} />}
            onPress={() => router.push(`/companies/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
