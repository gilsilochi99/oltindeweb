import { Text, View } from 'react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Star } from 'lucide-react-native';
import { GoogleIcon } from './GoogleIcon';
import type { Review } from '../../lib/types';

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <Text className="text-sm text-muted-foreground">Todavía no hay reseñas.</Text>;
  }
  return (
    <View className="gap-3">
      {reviews.map((review) => (
        <View key={review.id} className="gap-1 rounded-lg border border-border bg-card p-3">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-semibold text-foreground">{review.author}</Text>
              {review.source === 'google' ? (
                <View className="flex-row items-center gap-1 rounded-full bg-muted px-1.5 py-0.5">
                  <GoogleIcon size={11} />
                  <Text className="text-[10px] font-medium text-muted-foreground">Google</Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center gap-1">
              <Star size={12} color="#FFCD00" fill="#FFCD00" />
              <Text className="text-xs text-muted-foreground">{review.rating.toFixed(1)}</Text>
            </View>
          </View>
          <Text className="text-sm text-foreground">{review.comment}</Text>
          <Text className="text-xs text-muted-foreground">
            {format(new Date(review.date), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
          {review.reply ? (
            <View className="mt-1 gap-1 rounded-md bg-muted p-2">
              <Text className="text-xs font-semibold text-foreground">Respuesta</Text>
              <Text className="text-xs text-foreground">{review.reply.comment}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}
