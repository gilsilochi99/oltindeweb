import { ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getActiveCategories } from '../../../src/lib/shop';
import { ProductBrowser } from '../../../src/components/shop/ProductBrowser';
import { CartButton } from '../../../src/components/shop/CartButton';
import { Chip } from '../../../src/components/ui/Rail';

// A Tienda category (web: /tienda/c/[slug]): its description, its
// subcategories as chips, and its products.
export default function ShopCategoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const categories = useQuery({ queryKey: ['shop', 'categories'], queryFn: getActiveCategories });
  const all = categories.data ?? [];
  const category = all.find((c) => c.slug === slug);
  const children = category ? all.filter((c) => c.parentId === category.id) : [];
  const parent = category?.parentId ? all.find((c) => c.id === category.parentId) : undefined;

  const header =
    category && (category.description || children.length || parent) ? (
      <View className="gap-3">
        {parent ? (
          <Text className="text-sm text-secondary" onPress={() => router.replace(`/tienda/c/${parent.slug}`)}>
            ‹ {parent.name}
          </Text>
        ) : null}
        {category.description ? <Text className="text-sm leading-5 text-muted-foreground">{category.description}</Text> : null}
        {children.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {children.map((c) => (
              <Chip key={c.id} label={c.name} onPress={() => router.push(`/tienda/c/${c.slug}`)} />
            ))}
          </ScrollView>
        ) : null}
      </View>
    ) : null;

  return (
    <>
      <Stack.Screen options={{ title: category?.name ?? 'Categoría', headerRight: () => <CartButton /> }} />
      <ProductBrowser categorySlug={slug} header={header} placeholder={category ? `Buscar en ${category.name}…` : undefined} />
    </>
  );
}
