import { useEffect, useState, type ReactElement } from 'react';
import { ActivityIndicator, FlatList, ScrollView, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react-native';
import { PRODUCT_SORT_LABELS, searchProducts, type ProductQuery, type ProductSort } from '../../lib/shop';
import { ProductCard } from './ProductCard';
import { Chip } from '../ui/Rail';
import { LoadingState } from '../ui/LoadingState';
import { EmptyState } from '../ui/EmptyState';

const GAP = 12;
const SORTS: ProductSort[] = ['relevance', 'newest', 'price_asc', 'price_desc', 'best_selling', 'rating'];

// Product grid with a search box, filters and sort, shared by the Tienda
// search, a category page and a seller's store (web: ProductListing). The
// fixed scope (category or seller) comes in as props; `header` is shown
// above the results (category description, seller card…).
export function ProductBrowser({
  categorySlug,
  companyId,
  initialQuery,
  initialSort,
  initialOnSale,
  autoFocus,
  placeholder = 'Buscar productos, marcas…',
  header,
}: {
  categorySlug?: string;
  companyId?: string;
  initialQuery?: string;
  initialSort?: ProductSort;
  initialOnSale?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  header?: ReactElement | null;
}) {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 16 * 2 - GAP) / 2;

  const [text, setText] = useState(initialQuery ?? '');
  const [q, setQ] = useState(initialQuery ?? '');
  const [sort, setSort] = useState<ProductSort>(initialSort || 'relevance');
  const [onSaleOnly, setOnSaleOnly] = useState(!!initialOnSale);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Search as the user types, without a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(text.trim()), 400);
    return () => clearTimeout(t);
  }, [text]);

  const query: ProductQuery = {
    q: q || undefined,
    categorySlug,
    companyId,
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

  const top = (
    <View className="gap-3 pb-1">
      {header}
      <Text className="text-sm text-muted-foreground">
        {results.isLoading ? 'Buscando…' : `${total} ${total === 1 ? 'producto' : 'productos'}`}
      </Text>
    </View>
  );

  return (
    <>
      <View className="border-b border-border bg-background px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={placeholder}
            placeholderTextColor="#9CA3AF"
            returnKeyType="search"
            onSubmitEditing={() => setQ(text.trim())}
            autoFocus={autoFocus}
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

      {results.isLoading && !header ? (
        <LoadingState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(p) => p.id}
          numColumns={2}
          columnWrapperStyle={{ gap: GAP }}
          contentContainerStyle={{ padding: 16, gap: GAP, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={top}
          renderItem={({ item }) => <ProductCard product={item} width={cardWidth} />}
          onEndReached={() => results.hasNextPage && !results.isFetchingNextPage && results.fetchNextPage()}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            results.isLoading ? (
              <ActivityIndicator color="#FFCD00" className="py-8" />
            ) : (
              <EmptyState icon={Search} title="No encontramos productos" description="Pruebe con otras palabras o quite algún filtro." />
            )
          }
          ListFooterComponent={results.isFetchingNextPage ? <ActivityIndicator color="#FFCD00" className="py-4" /> : null}
        />
      )}
    </>
  );
}
