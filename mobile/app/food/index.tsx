import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Search, UtensilsCrossed, X } from 'lucide-react-native';
import { useActiveCompanies, useActiveMenuItems, useUniqueCities } from '../../src/hooks/use-queries';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';
import { OpenStatusBadge } from '../../src/components/ui/OpenStatusBadge';
import { Chip } from '../../src/components/ui/Rail';
import { averageRating } from '../../src/components/ui/StarRating';
import type { Company, MenuItem } from '../../src/lib/types';

const PAGE = 10;

// Mobile version of the web's /food (FoodPageClient): restaurants that have a
// menu, filtered by name, city and type of food, featured ones first.
// Tapping one opens its profile, where the menu can be ordered from.
export default function FoodScreen() {
  const params = useLocalSearchParams<{ type?: string }>();
  const companies = useActiveCompanies();
  const menuItems = useActiveMenuItems();
  const { data: cities } = useUniqueCities();

  const [query, setQuery] = useState('');
  const [city, setCity] = useState('all');
  const [foodType, setFoodType] = useState(params.type || 'all');
  const [count, setCount] = useState(PAGE);

  const restaurants = useMemo(() => {
    const byCompany = new Map<string, MenuItem[]>();
    for (const item of menuItems.data ?? []) {
      if (!byCompany.has(item.companyId)) byCompany.set(item.companyId, []);
      byCompany.get(item.companyId)!.push(item);
    }
    return (companies.data ?? [])
      .filter((c) => byCompany.has(c.id))
      .map((company) => ({ company, items: byCompany.get(company.id)! }));
  }, [companies.data, menuItems.data]);

  const foodTypes = useMemo(
    () => Array.from(new Set((menuItems.data ?? []).map((i) => i.foodType).filter(Boolean))).sort(),
    [menuItems.data],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants
      .filter(({ company, items }) =>
        (!q || company.name.toLowerCase().includes(q)) &&
        (city === 'all' || company.branches?.some((b) => b.location?.city === city)) &&
        (foodType === 'all' || items.some((i) => i.foodType === foodType)),
      )
      .sort((a, b) => Number(!!b.company.isFeatured) - Number(!!a.company.isFeatured));
  }, [restaurants, query, city, foodType]);

  const visible = filtered.slice(0, count);
  const resetPaging = () => setCount(PAGE);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Comida a domicilio' }} />
      <View className="gap-3 border-b border-border bg-background px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); resetPaging(); }}
            placeholder="Nombre del restaurante…"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
          {query ? <X size={18} color="#8A8A8A" onPress={() => setQuery('')} /> : null}
        </View>
        {foodTypes.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Todo" selected={foodType === 'all'} onPress={() => { setFoodType('all'); resetPaging(); }} />
            {foodTypes.map((t) => (
              <Chip key={t} label={t} selected={foodType === t} onPress={() => { setFoodType(foodType === t ? 'all' : t); resetPaging(); }} />
            ))}
          </ScrollView>
        ) : null}
        {cities && cities.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Todas las ciudades" selected={city === 'all'} onPress={() => { setCity('all'); resetPaging(); }} />
            {cities.map((c) => (
              <Chip key={c} label={c} selected={city === c} onPress={() => { setCity(city === c ? 'all' : c); resetPaging(); }} />
            ))}
          </ScrollView>
        ) : null}
      </View>
      <DataList
        data={visible}
        isLoading={companies.isLoading || menuItems.isLoading}
        onRefresh={() => { companies.refetch(); menuItems.refetch(); }}
        isRefreshing={companies.isRefetching || menuItems.isRefetching}
        keyExtractor={(r) => r.company.id}
        emptyTitle="No se encontraron restaurantes"
        emptyDescription="Pruebe con otro nombre, ciudad o tipo de comida."
        emptyIcon={UtensilsCrossed}
        ListHeaderComponent={<Text className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'restaurante' : 'restaurantes'}</Text>}
        ListFooterComponent={filtered.length > visible.length ? <LoadMoreFooter onPress={() => setCount((c) => c + PAGE)} /> : null}
        renderItem={({ item, index }) => <RestaurantRow company={item.company} items={item.items} index={index} />}
      />
    </SafeAreaView>
  );
}

function RestaurantRow({ company, items, index }: { company: Company; items: MenuItem[]; index: number }) {
  const types = Array.from(new Set(items.map((i) => i.foodType).filter(Boolean))).slice(0, 3);
  const hasMenuDelDia = items.some((i) => i.isMenuDelDia && i.available);
  return (
    <ListCard
      index={index}
      image={company.logo}
      title={company.name}
      subtitle={[types.join(', '), company.branches?.[0]?.location?.city].filter(Boolean).join(' · ')}
      verified={company.isVerified}
      rating={averageRating(company.reviews)}
      reviewCount={company.reviews.length}
      description={`${items.length} ${items.length === 1 ? 'plato' : 'platos'} en la carta${hasMenuDelDia ? ' · Menú del día' : ''}`}
      phone={company.branches?.[0]?.contact?.phone}
      whatsapp={company.contact?.socialMedia?.whatsapp}
      meta={<OpenStatusBadge branch={company.branches?.[0]} />}
      onPress={() => router.push(`/companies/${company.id}`)}
    />
  );
}
