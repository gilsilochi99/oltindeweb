import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Briefcase } from 'lucide-react-native';
import { useActiveJobPostings } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { Badge } from '../../src/components/ui/Badge';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function JobsScreen() {
  const { data: jobs, isLoading, refetch, isRefetching } = useActiveJobPostings();
  const openJobs = jobs?.filter((j) => j.status === 'open');
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    openJobs,
    (j) => `${j.title} ${j.companyName} ${j.city}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Empleos',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar empleos…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(j) => j.id}
        emptyTitle="No hay empleos abiertos"
        emptyIcon={Briefcase}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.companyLogo}
            title={item.title}
            subtitle={`${item.companyName} · ${item.city}`}
            meta={<Badge label={item.employmentType} />}
            onPress={() => router.push(`/jobs/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
