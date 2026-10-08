import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { HeartPulse } from 'lucide-react-native';
import { useHealthFacilitiesByType } from '../../src/hooks/use-queries';
import { useSearchableList } from '../../src/hooks/use-searchable-list';
import type { HealthFacilityType } from '../../src/lib/types';
import { DataList } from '../../src/components/ui/DataList';
import { ListCard } from '../../src/components/ui/ListCard';
import { Badge } from '../../src/components/ui/Badge';
import { ListSearchHeaderButton } from '../../src/components/ui/ListSearchHeaderButton';
import { ListSearchBar } from '../../src/components/ui/ListSearchBar';
import { LoadMoreFooter } from '../../src/components/ui/LoadMoreFooter';

const TYPES: { key: HealthFacilityType; label: string }[] = [
  { key: 'hospital', label: 'Hospitales' },
  { key: 'clinic', label: 'Clínicas' },
  { key: 'pharmacy', label: 'Farmacias' },
];

export default function HealthScreen() {
  const [type, setType] = useState<HealthFacilityType>('hospital');
  const [onDutyOnly, setOnDutyOnly] = useState(false);
  const { data: facilities, isLoading, refetch, isRefetching } = useHealthFacilitiesByType(type);

  const today = new Date().toISOString().slice(0, 10);
  const scopedFacilities =
    type === 'pharmacy' && onDutyOnly ? facilities?.filter((f) => f.onDutyDates?.includes(today)) : facilities;
  const { isSearching, setIsSearching, closeSearch, query, setQuery, visible, hasMore, loadMore } = useSearchableList(
    scopedFacilities,
    (f) => f.name,
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Salud',
          headerRight: () => (
            <ListSearchHeaderButton isSearching={isSearching} onToggle={() => (isSearching ? closeSearch() : setIsSearching(true))} />
          ),
        }}
      />
      <ListSearchBar visible={isSearching} value={query} onChangeText={setQuery} placeholder="Buscar centros de salud…" />
      <View className="flex-row gap-2 px-4 py-3">
        {TYPES.map((t) => (
          <Pressable
            key={t.key}
            onPress={() => setType(t.key)}
            className={`rounded-full px-4 py-2 ${type === t.key ? 'bg-primary' : 'bg-muted'}`}
          >
            <Text className={`text-sm font-medium ${type === t.key ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {type === 'pharmacy' ? (
        <Pressable
          onPress={() => setOnDutyOnly((v) => !v)}
          className="mx-4 mb-3 flex-row items-center justify-between rounded-lg border border-border bg-card px-4 py-3"
        >
          <Text className="text-sm font-medium text-foreground">Solo farmacias de guardia hoy</Text>
          <Switch value={onDutyOnly} onValueChange={setOnDutyOnly} />
        </Pressable>
      ) : null}

      <DataList
        data={visible}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(f) => f.id}
        emptyTitle={onDutyOnly ? 'Ninguna farmacia de guardia hoy' : 'No hay resultados'}
        emptyIcon={HeartPulse}
        ListFooterComponent={hasMore ? <LoadMoreFooter onPress={loadMore} /> : null}
        renderItem={({ item, index }) => (
          <ListCard
            index={index}
            image={item.image}
            title={item.name}
            subtitle={item.ownership === 'public' ? 'Pública' : 'Privada'}
            verified={item.isVerified}
            meta={item.emergencyServices ? <Badge label="Urgencias 24h" variant="primary" /> : undefined}
            onPress={() => router.push(`/health/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}
