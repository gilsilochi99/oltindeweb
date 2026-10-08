import { useEffect, useState } from 'react';
import { FlatList, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react-native';
import { PRODUCT_SORT_LABELS, searchProducts, type ProductQuery, type ProductSort } from '../../src/lib/shop';
import { ProductCard } from '../../src/components/shop/ProductCard';
import { CartButton } from '../../src/components/shop/CartButton';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ActivityIndicator } from 'react-native';

const GAP = 12;
const SORTS: ProductSort[] = ['relevance', 'newest', 'price_asc', 'price_desc', 'best_selling', 'rating'];

export default function TiendaSearchScreen() {
  const params = useLocalSearchParams<{ q?: string; categorySlug?: string; companyId?: string; onSaleOnly?: string; sort?: string; title?: string }>();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - GAP) / 2;

  const [text, setText] = useState(params.q ?? '');
  const [q, setQ] = useState(params.q ?? '');
  const [sort, setSort] = useState<ProductSort>((params.sort as ProductSort) || 'relevance');
  const [onSaleOnly, setOnSaleOnly] = useState(params.onSaleOnly === '1');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Search as the user types, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const query: ProductQuery = {
    q: q || undefined,
    categorySlug: params.categorySlug,
    companyId: params.companyId,
    onSaleOnly: onSaleOnly || undefined,
    inStockOnly: inStockOnly || undefined,
    sort,
  };

  const results = useInfiniteQuery({
    queryKey: ['shop', 'search', query],
    queryFn: ({ pageParam }) => searchProducts({ ...query, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.pageCount ? last.page + 1 : undefined),
  });

  const items = results.data?.pages.flatMap((p) => p.items) ?? [];
  const total = results.data?.pages[0]?.total ?? 0;

  return (
    <>
      <Stack.Screen options={{ title: params.title || 'Buscar en la Tienda', headerRight: () => <CartButton /> }} />
      <View className="border-b border-border bg-background px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Buscar productos, marcas…"
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={() => setQ(text.trim())}
            autoFocus={!params.categorySlug && !params.companyId && !params.sort && !params.onSaleOnly}
            className="flex-1 text-base text-foreground"
          />
          {text ? <X size={18} color="#8A8A8A" onPress={() => setText('')} /> : null}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 pt-3">
          <Chip label="En oferta" selected={onSaleOnly} onPress={() => setOnSaleOnly((v) => !v)} />
          <Chip label="Disponible" selected={inStockOnly} onPress={() => setInStockOnly((v) => !v)} />
          {SORTS.map((s) => (
            <Chip key={s} label={PRODUCT_SORT_LABELS[s]} selected={sort === s} onPress={() => setSort(s)} />
          ))}
        </ScrollView>
      </View>

      {results.isLoading ? (
        <LoadingState />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No encontramos productos" description="Pruebe con otras palabras o quite algún filtro." />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ padding: 16, gap: GAP }}
          ListHeaderComponent={<Text className="text-sm text-muted-foreground">{total} {total === 1 ? 'producto' : 'productos'}</Text>}
          renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
          onEndReached={() => results.hasNextPage && !results.isFetchingNextPage && results.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator color="#FFCD00" className="py-4" /> : null}
        />
      )}
    </>
  );
}
