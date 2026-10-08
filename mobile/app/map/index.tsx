import { useMemo } from 'react';
import { Linking, Pressable, SectionList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MapPin, Navigation } from 'lucide-react-native';
import { useActiveCompanies, useTouristLocations } from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

type MapEntry = { id: string; title: string; subtitle: string; city: string; lat: number; lng: number; href: string };

// No native MapView here — react-native-maps needs a compiled dev client and
// this app deliberately stays on Expo Go for fast iteration (see mobile
// README). This gives the same "find things near you" job grouped by city
// instead, with a one-tap handoff to Google Maps for actual directions —
// the same pattern used on every other detail screen's "Cómo llegar" action.
export default function MapScreen() {
  const { data: companies, isLoading: loadingCompanies } = useActiveCompanies();
  const { data: places, isLoading: loadingPlaces } = useTouristLocations();

  const sections = useMemo(() => {
    const entries: MapEntry[] = [
      ...(companies ?? [])
        .filter((c) => c.branches?.[0]?.location?.lat && c.branches[0].location.lng)
        .map((c) => ({
          id: `company-${c.id}`,
          title: c.name,
          subtitle: c.category,
          city: c.branches[0].location.city || 'Otra ubicación',
          lat: c.branches[0].location.lat,
          lng: c.branches[0].location.lng,
          href: `/companies/${c.id}`,
        })),
      ...(places ?? [])
        .filter((p) => p.location?.lat && p.location?.lng)
        .map((p) => ({
          id: `place-${p.id}`,
          title: p.name,
          subtitle: p.category,
          city: p.location.city || 'Otra ubicación',
          lat: p.location.lat,
          lng: p.location.lng,
          href: `/places/${p.id}`,
        })),
    ];

    const byCity = new Map<string, MapEntry[]>();
    entries.forEach((e) => {
      if (!byCity.has(e.city)) byCity.set(e.city, []);
      byCity.get(e.city)!.push(e);
    });
    return Array.from(byCity.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([city, data]) => ({ title: city, data }));
  }, [companies, places]);

  if (loadingCompanies || loadingPlaces) return <LoadingState variant="list" />;
  if (sections.length === 0) return <EmptyState title="Sin ubicaciones disponibles" icon={MapPin} />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Mapa' }} />
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerClassName="pb-8"
        renderSectionHeader={({ section }) => (
          <View className="flex-row items-center gap-2 bg-background px-4 py-3">
            <MapPin size={16} color="#8A8A8A" />
            <Text className="text-base font-bold text-foreground">{section.title}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push(item.href as any)}
            className="mx-4 mb-2 flex-row items-center justify-between rounded-lg border border-border bg-card p-3"
          >
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={1}>
                {item.title}
              </Text>
              <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                {item.subtitle}
              </Text>
            </View>
            <Pressable
              onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`)}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full bg-muted"
            >
              <Navigation size={16} color="#1A1C1C" />
            </Pressable>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
