import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react-native';
import {
  RENTAL_CATEGORY_LABELS, RENTAL_SORT_LABELS, kindLabel, searchRentals,
  type RentalCategory, type RentalQuery, type RentalSort,
} from '../../src/lib/rentals';
import { RentalCard } from '../../src/components/rentals/RentalCard';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

const SORTS: RentalSort[] = ['relevance', 'newest', 'price_asc', 'price_desc'];

export default function AlquilerSearchScreen() {
  const params = useLocalSearchParams<{ category?: RentalCategory; kind?: string; city?: string; companyId?: string; q?: string }>();

  const [text, setText] = useState(params.q ?? '');
  const [q, setQ] = useState(params.q ?? '');
  const [category, setCategory] = useState<RentalCategory | undefined>(params.category);
  const [kind, setKind] = useState<string | undefined>(params.kind);
  const [city, setCity] = useState<string | undefined>(params.city);
  const [term, setTerm] = useState<'short' | 'long' | undefined>();
  const [sort, setSort] = useState<RentalSort>('relevance');

  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const query: RentalQuery = {
    q: q || undefined,
    category,
    kinds: kind ? [kind] : undefined,
    city,
    term,
    companyId: params.companyId,
    sort,
  };

  const results = useInfiniteQuery({
    queryKey: ['rentals', 'search', query],
    queryFn: ({ pageParam }) => searchRentals({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pageCount ? last.page + 1 : undefined),
  });

  const first = results.data?.pages[0];
  const items = results.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <>
      <Stack.Screen options={{ title: category ? `Alquiler: ${RENTAL_CATEGORY_LABELS[category].toLowerCase()}` : 'Buscar alquiler' }} />
      <View className="gap-2.5 border-b border-border bg-background px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Barrio, marca, tipo…"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={() => setQ(text.trim())}
            className="flex-1 text-base text-foreground"
          />
          {text ? <X size={18} color="#8A8A8A" onPress={() => setText('')} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="Todo" selected={!category} onPress={() => { setCategory(undefined); setKind(undefined); }} />
          <Chip label="Casas y pisos" selected={category === 'property'} onPress={() => { setCategory('property'); setKind(undefined); }} />
          <Chip label="Vehículos" selected={category === 'vehicle'} onPress={() => { setCategory('vehicle'); setKind(undefined); }} />
          <Chip label="Por días" selected={term === 'short'} onPress={() => setTerm(term === 'short' ? undefined : 'short')} />
          <Chip label="Por meses" selected={term === 'long'} onPress={() => setTerm(term === 'long' ? undefined : 'long')} />
        </ScrollView>
        {first && (first.facets.cities.length > 1 || city) ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Todas las ciudades" selected={!city} onPress={() => setCity(undefined)} />
            {first.facets.cities.map((c) => (
              <Chip key={c.city} label={c.city} selected={city === c.city} onPress={() => setCity(city === c.city ? undefined : c.city)} />
            ))}
          </ScrollView>
        ) : null}
        {category && first && first.facets.kinds.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {first.facets.kinds.map((k) => (
              <Chip key={k.kind} label={`${kindLabel(category, k.kind)} (${k.count})`} selected={kind === k.kind} onPress={() => setKind(kind === k.kind ? undefined : k.kind)} />
            ))}
          </ScrollView>
        ) : null}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {SORTS.map((s) => (
            <Chip key={s} label={RENTAL_SORT_LABELS[s]} selected={sort === s} onPress={() => setSort(s)} />
          ))}
        </ScrollView>
      </View>

      {results.isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No hay anuncios con estos filtros" description="Pruebe a quitar algún filtro." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(l) => l.id}
          contentContainerStyle={{ padding: 16, gap: 14 }}
          ListHeaderComponent={<Text className="text-sm text-muted-foreground">{first?.total ?? 0} anuncios</Text>}
          renderItem={({ item }) => <RentalCard listing={item} width="full" />}
          onEndReached={() => results.hasNextPage && !results.isFetchingNextPage && results.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator color="#FFCD00" className="py-4" /> : null}
        />
      )}
    </>
  );
}
