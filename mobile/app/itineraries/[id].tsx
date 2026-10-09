import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { ImageOff } from 'lucide-react-native';
import { useItinerary, useTouristLocation, useCompany } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { Section } from '../../src/components/ui/Section';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { ReviewForm } from '../../src/components/ui/ReviewForm';
import { Badge } from '../../src/components/ui/Badge';
import { averageRating } from '../../src/components/ui/StarRating';
import type { ItineraryStop } from '../../src/lib/types';

function StopRow({ stop }: { stop: ItineraryStop }) {
  const isCompany = stop.locationType === 'company';
  const placeQuery = useTouristLocation(isCompany ? '' : stop.locationId);
  const companyQuery = useCompany(isCompany ? stop.locationId : '');
  const location = isCompany ? companyQuery.data : placeQuery.data;
  const name = isCompany ? companyQuery.data?.name : placeQuery.data?.name;
  const image = isCompany ? companyQuery.data?.logo : placeQuery.data?.image;
  const category = location?.category;

  return (
    <Pressable
      onPress={() => router.push(isCompany ? `/companies/${stop.locationId}` : `/places/${stop.locationId}`)}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3"
    >
      <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
        <Text className="text-xs font-semibold text-primary-foreground">{stop.order}</Text>
      </View>
      <View className="h-12 w-12 items-center justify-center overflow-hidden rounded-md bg-muted">
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <ImageOff size={16} color="#C4C4C4" />
        )}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-foreground">{name ?? 'Cargando…'}</Text>
        {category ? <Text className="text-xs text-muted-foreground">{category}</Text> : null}
        {stop.suggestedTime ? <Text className="text-xs text-muted-foreground">{stop.suggestedTime}</Text> : null}
        {stop.notes ? <Text className="text-xs text-muted-foreground">{stop.notes}</Text> : null}
      </View>
    </Pressable>
  );
}

export default function ItineraryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: itinerary, isLoading } = useItinerary(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!itinerary) return <EmptyState title="Itinerario no encontrado" />;

  const favorite = isFavorite('itinerary', itinerary.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('itinerary', itinerary.id) : addFavorite('itinerary', itinerary.id);
  };

  const days = Array.from(new Set(itinerary.stops.map((s) => s.day))).sort((a, b) => a - b);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: itinerary.title }} />
      <ScrollView>
        <DetailHeader
          logo={itinerary.coverImage}
          title={itinerary.title}
          category={`${itinerary.city} · ${itinerary.durationDays} día${itinerary.durationDays === 1 ? '' : 's'} · por ${itinerary.authorName}`}
          rating={averageRating(itinerary.reviews)}
          reviewCount={itinerary.reviews.length}
          isFavorite={favorite}
          onToggleFavorite={toggleFavorite}
        />

        {itinerary.theme && itinerary.theme.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 px-4">
            {itinerary.theme.map((t) => (
              <Badge key={t} label={t} />
            ))}
          </View>
        ) : null}

        <Section title="Descripción">
          <Text className="text-sm leading-5 text-foreground">{itinerary.description}</Text>
        </Section>

        {days.map((day) => (
          <Section key={day} title={`Día ${day}`}>
            <View className="gap-2">
              {itinerary.stops
                .filter((s) => s.day === day)
                .sort((a, b) => a.order - b.order)
                .map((stop) => (
                  <StopRow key={stop.id} stop={stop} />
                ))}
            </View>
          </Section>
        ))}

        <Section title={`Reseñas (${itinerary.reviews.length})`}>
          <View className="gap-4">
            <ReviewForm entityType="itineraries" entityId={itinerary.id} />
            <ReviewList reviews={itinerary.reviews} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
