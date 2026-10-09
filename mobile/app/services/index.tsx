import { useMemo, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Briefcase, Building2, ChevronRight, Search, X } from 'lucide-react-native';
import { useActiveCompanies, useServices } from '../../src/hooks/use-queries';
import { buildServiceDirectory, serviceIcon } from '../../src/lib/services-directory';
import { DataList } from '../../src/components/ui/DataList';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';
import { Chip } from '../../src/components/ui/Rail';
import { FadeInItem, PressableScale } from '../../src/components/ui/motion';

const PAGE = 20;

// Mobile version of the web's /services: every service with how many
// companies offer it, by name and category.
export default function ServicesScreen() {
  const services = useServices();
  const companies = useActiveCompanies();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [count, setCount] = useState(PAGE);

  const directory = useMemo(
    () => buildServiceDirectory(services.data ?? [], companies.data ?? []),
    [services.data, companies.data],
  );
  const categories = useMemo(
    () => Array.from(new Set(directory.map((d) => d.service.category).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [directory],
  );
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return directory.filter((d) => (!q || d.service.name.toLowerCase().includes(q)) && (category === 'all' || d.service.category === category));
  }, [directory, query, category]);
  const visible = filtered.slice(0, count);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Servicios' }} />
      <View className="gap-3 border-b border-border bg-background px-4 pb-3 pt-2">
        <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
          <Search size={18} color="#8A8A8A" />
          <TextInput
            value={query}
            onChangeText={(t) => { setQuery(t); setCount(PAGE); }}
            placeholder="Buscar servicio…"
            placeholderTextColor="#9CA3AF"
            className="flex-1 text-base text-foreground"
          />
          {query ? <X size={18} color="#8A8A8A" onPress={() => setQuery('')} /> : null}
        </View>
        {categories.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            <Chip label="Todas" selected={category === 'all'} onPress={() => { setCategory('all'); setCount(PAGE); }} />
            {categories.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => { setCategory(category === c ? 'all' : c); setCount(PAGE); }} />
            ))}
          </ScrollView>
        ) : null}
      </View>
      <DataList
        data={visible}
        isLoading={services.isLoading || companies.isLoading}
        onRefresh={() => { services.refetch(); companies.refetch(); }}
        isRefreshing={services.isRefetching || companies.isRefetching}
        keyExtractor={(d) => d.service.id}
        emptyTitle="No se encontraron servicios"
        emptyIcon={Briefcase}
        ListHeaderComponent={<Text className="text-sm text-muted-foreground">{filtered.length} servicios</Text>}
        ListFooterComponent={filtered.length > visible.length ? <LoadMoreFooter onPress={() => setCount((c) => c + PAGE)} /> : null}
        renderItem={({ item, index }) => {
          const Icon = serviceIcon(item.service.category);
          return (
            <FadeInItem index={index}>
              <PressableScale
                onPress={() => router.push(`/services/${item.service.id}`)}
                scaleTo={0.98}
                className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <View className="h-10 w-10 items-center justify-center rounded-md bg-primary/25">
                  <Icon size={19} color="#000" />
                </View>
                <View className="flex-1">
                  <Text className="text-[15px] font-semibold text-foreground" numberOfLines={2}>{item.service.name}</Text>
                  <Text className="text-xs text-muted-foreground">{item.service.category}</Text>
                </View>
                <View className="flex-row items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                  <Building2 size={12} color="#1A1C1C" />
                  <Text className="text-xs text-foreground">{item.providers.length}</Text>
                </View>
                <ChevronRight size={18} color="#9A9A9A" />
              </PressableScale>
            </FadeInItem>
          );
        }}
      />
    </SafeAreaView>
  );
}
