import { Text, View } from 'react-native';
import { Star } from 'lucide-react-native';
import type { Review } from '../../lib/types';

export function averageRating(reviews: Review[] | undefined): number {
  if (!reviews || reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}

// Yelp-style row of 5 stars (filled up to the rounded average) instead of a
// single star + decimal — reads at a glance the way review scores usually do.
export function StarRating({ rating, count, size = 14 }: { rating: number; count?: number; size?: number }) {
  if (rating === 0 && !count) {
    return <Text className="text-xs text-muted-foreground">Sin reseñas todavía</Text>;
  }
  const filled = Math.round(rating);
  return (
    <View className="flex-row items-center gap-1.5">
      <View className="flex-row gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star key={i} size={size} color="#FFB800" fill={i <= filled ? '#FFB800' : 'transparent'} strokeWidth={1.5} />
        ))}
      </View>
      {count !== undefined ? (
        <Text className="text-xs font-medium text-muted-foreground">
          {rating > 0 ? rating.toFixed(1) : ''} {count > 0 ? `(${count})` : ''}
        </Text>
      ) : null}
    </View>
  );
}
