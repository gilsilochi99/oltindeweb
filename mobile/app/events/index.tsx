import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { CalendarDays } from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEvents } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

export default function EventsScreen() {
  const { data: events, isLoading, refetch, isRefetching } = useEvents();
  const upcoming = events
    ?.filter((e) => e.status === 'scheduled')
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    upcoming,
    (e) => `${e.title} ${e.city}`,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Eventos',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar eventos…" />
      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(e) => e.id}
        emptyTitle="No hay eventos programados"
        emptyIcon={CalendarDays}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.organizerLogo}
            title={item.title}
            subtitle={`${format(new Date(item.startDate), "d 'de' MMMM", { locale: es })} · ${item.city}`}
            onPress={() => router.push(`/events/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
