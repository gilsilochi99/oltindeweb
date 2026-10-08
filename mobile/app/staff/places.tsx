import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';
import { usePendingPlaces, useReviewTouristLocation } from '../../src/hooks/use-queries';
import { isPlaceholderImage } from '../../src/lib/image-utils';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';

export default function PlacesModerationScreen() {
  const { data: places, isLoading } = usePendingPlaces();
  const review = useReviewTouristLocation();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Lugares pendientes' }} />
      {isLoading ? (
        <LoadingState />
      ) : !places || places.length === 0 ? (
        <EmptyState title="Sin lugares pendientes" description="Aquí aparecerán los lugares sugeridos por usuarios." />
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {places.map((place) => (
            <View key={place.id} className="gap-2 rounded-lg border border-border bg-card p-3.5">
              <Pressable onPress={() => router.push(`/places/${place.id}`)} className="flex-row gap-3">
                <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
                  {place.image && !isPlaceholderImage(place.image) ? (
                    <Image source={{ uri: place.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  ) : (
                    <ImageOff size={18} color="#C4C4C4" />
                  )}
                </View>
                <View className="flex-1 justify-center gap-0.5">
                  <Text className="text-sm font-bold text-foreground">{place.name}</Text>
                  <Text className="text-xs text-muted-foreground">
                    {place.category} · {place.location?.city}
                  </Text>
                </View>
              </Pressable>
              <Text className="text-sm text-foreground" numberOfLines={3}>
                {place.description}
              </Text>
              <View className="flex-row gap-2 pt-1">
                <View className="flex-1">
                  <Button
                    variant="outline"
                    loading={review.isPending}
                    onPress={() => review.mutate({ locationId: place.id, decision: 'rejected' })}
                  >
                    Rechazar
                  </Button>
                </View>
                <View className="flex-1">
                  <Button loading={review.isPending} onPress={() => review.mutate({ locationId: place.id, decision: 'approved' })}>
                    Aprobar
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
