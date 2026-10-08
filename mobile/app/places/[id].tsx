import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { MapPin, Navigation, Share2 } from 'lucide-react-native';
import { useTouristLocation } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { DetailTabs, type DetailTab } from '../../src/components/ui/DetailTabs';
import { Section } from '../../src/components/ui/Section';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { averageRating } from '../../src/components/ui/StarRating';
import type { ActionItem } from '../../src/components/ui/ActionBar';

const PRICE_LABEL: Record<string, string> = { free: 'Gratis', $: '€', $$: '€€', $$$: '€€€' };

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: place, isLoading } = useTouristLocation(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!place) return <EmptyState title="Lugar no encontrado" />;

  const favorite = isFavorite('place', place.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('place', place.id) : addFavorite('place', place.id);
  };

  const actions: ActionItem[] = [
    {
      icon: Navigation,
      label: 'Cómo llegar',
      onPress: () =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`),
    },
    {
      icon: Share2,
      label: 'Compartir',
      onPress: () => Share.share({ message: `${place.name} en Oltinde: ${WEB_APP_URL}/places/${place.id}` }),
    },
  ];

  const infoTab = (
    <View>
      <Section title="Descripción">
        <Text className="text-sm leading-5 text-foreground">{place.description}</Text>
      </Section>

      <Section title="Ubicación">
        <Pressable
          onPress={() =>
            Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${place.location.lat},${place.location.lng}`)
          }
        >
          <View className="flex-row items-start gap-2">
            <MapPin size={16} color="#374151" />
            <Text className="flex-1 text-sm text-foreground">
              {place.location?.address}, {place.location?.city}
            </Text>
          </View>
        </Pressable>
        {place.priceRange ? (
          <Text className="mt-2 text-sm text-muted-foreground">Rango de precios: {PRICE_LABEL[place.priceRange]}</Text>
        ) : null}
      </Section>

      {place.openingHours && place.openingHours.length > 0 ? (
        <Section title="Horario">
          <View className="gap-1">
            {place.openingHours.map((h, i) => (
              <View key={i} className="flex-row justify-between">
                <Text className="text-sm text-foreground">{h.day}</Text>
                <Text className="text-sm text-muted-foreground">{h.hours}</Text>
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );

  const galleryTab = (
    <View className="flex-row flex-wrap gap-2 p-4">
      {(place.gallery ?? []).map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: '48.5%', aspectRatio: 1, borderRadius: 12 }} contentFit="cover" />
      ))}
    </View>
  );

  const reviewsTab = (
    <View className="px-4 py-5">
      <ReviewList reviews={place.reviews} />
    </View>
  );

  const tabs: DetailTab[] = [{ key: 'info', label: 'Información', content: infoTab }];
  if (place.gallery && place.gallery.length > 0) {
    tabs.push({ key: 'gallery', label: 'Fotos', content: galleryTab });
  }
  tabs.push({ key: 'reviews', label: `Reseñas (${place.reviews.length})`, content: reviewsTab });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: place.name }} />
      <ScrollView>
        <DetailHeader
          logo={place.image}
          title={place.name}
          category={place.category}
          rating={averageRating(place.reviews)}
          reviewCount={place.reviews.length}
          isFavorite={favorite}
          onToggleFavorite={toggleFavorite}
          actions={actions}
        />
        <DetailTabs tabs={tabs} />
      </ScrollView>
    </SafeAreaView>
  );
}
