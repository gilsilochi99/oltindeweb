import { Text, View } from 'react-native';
import { PressableScale } from '../ui/motion';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { BedDouble, ImageOff, MapPin, Users } from 'lucide-react-native';
import { absoluteUrl, formatXaf } from '../../lib/shop';
import { TRANSMISSION_LABELS, headlinePrice, kindLabel, type RentalListItem } from '../../lib/rentals';

export function RentalCard({ listing, width }: { listing: RentalListItem; width?: number | 'full' }) {
  const image = absoluteUrl(listing.image);
  const price = headlinePrice(listing);
  const facts =
    listing.category === 'property'
      ? [listing.bedrooms ? { icon: BedDouble, text: `${listing.bedrooms} hab.` } : null, listing.maxGuests ? { icon: Users, text: `${listing.maxGuests}` } : null]
      : [listing.seats ? { icon: Users, text: `${listing.seats} plazas` } : null, listing.transmission ? { icon: null, text: TRANSMISSION_LABELS[listing.transmission] ?? listing.transmission } : null];

  return (
    <PressableScale
      scaleTo={0.97}
      onPress={() => router.push(`/alquiler/${listing.slug}`)}
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{ width: width === 'full' ? '100%' : width ?? 240, elevation: 1 }}
    >
      <View className={`${width === 'full' ? 'h-48' : 'h-36'} w-full items-center justify-center bg-muted`}>
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <ImageOff size={22} color="#C4C4C4" />
        )}
        <View className="absolute left-2 top-2 rounded-md bg-black/60 px-2 py-0.5">
          <Text className="text-xs font-semibold text-white">{kindLabel(listing.category, listing.kind)}</Text>
        </View>
      </View>
      <View className="gap-1 p-3">
        <Text className="text-sm font-bold leading-5 text-foreground" numberOfLines={2}>
          {listing.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <MapPin size={12} color="#8A8A8A" />
          <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
            {[listing.neighborhood, listing.city].filter(Boolean).join(', ')}
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-3">
          {facts.filter(Boolean).map((f) => {
            const fact = f as { icon: typeof Users | null; text: string };
            const Icon = fact.icon;
            return (
              <View key={fact.text} className="flex-row items-center gap-1">
                {Icon ? <Icon size={12} color="#8A8A8A" /> : null}
                <Text className="text-xs text-muted-foreground">{fact.text}</Text>
              </View>
            );
          })}
        </View>
        {price ? (
          <Text className="text-base font-extrabold text-foreground">
            {formatXaf(price.amount)} <Text className="text-xs font-normal text-muted-foreground">/ {price.unit}</Text>
          </Text>
        ) : (
          <Text className="text-sm text-muted-foreground">Consultar precio</Text>
        )}
      </View>
    </PressableScale>
  );
}
