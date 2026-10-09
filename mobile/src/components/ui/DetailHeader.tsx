import { Text, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { CheckCircle2, Heart, ImageOff, Star } from 'lucide-react-native';
import { ActionBar, type ActionItem } from './ActionBar';
import { PressableScale } from './motion';

interface DetailHeaderProps {
  // The entity's logo/photo — shown small and uncropped, matching web's
  // DetailHero (src/components/shared/detail/StitchDetailKit.tsx). Not a big
  // cover photo: most `image` fields in this dataset are random seeded
  // stock photos.
  logo?: string;
  title: string;
  category?: string;
  rating?: number;
  reviewCount?: number;
  verified?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
  actions?: ActionItem[];
}

export function DetailHeader({ logo, title, category, rating, reviewCount, verified, isFavorite, onToggleFavorite, actions }: DetailHeaderProps) {
  return (
    <View className="bg-card">
      <Animated.View entering={FadeIn.duration(300)}>
        <View className="flex-row gap-4 px-4 pt-4">
          <View className="h-20 w-20 items-center justify-center overflow-hidden rounded border border-border bg-white p-2">
            {logo ? (
              <Image source={{ uri: logo }} style={{ width: '100%', height: '100%' }} contentFit="contain" transition={200} />
            ) : (
              <ImageOff size={22} color="#C4C4C4" />
            )}
          </View>
          <View className="flex-1 justify-center gap-1.5">
            <View className="flex-row items-start gap-2">
              <Text className="flex-1 text-[22px] font-semibold leading-7 text-foreground">{title}</Text>
              {onToggleFavorite ? (
                <PressableScale onPress={onToggleFavorite} scaleTo={0.8} haptic="medium" hitSlop={8} accessibilityLabel={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}>
                  <Heart size={24} color={isFavorite ? '#E11D48' : '#1A1C1C'} fill={isFavorite ? '#E11D48' : 'transparent'} />
                </PressableScale>
              ) : null}
            </View>
            <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
              {verified ? (
                <View className="flex-row items-center gap-1">
                  <CheckCircle2 size={16} color="#000" fill="#FFCD00" />
                  <Text className="text-[13px] font-semibold text-foreground">Perfil Verificado</Text>
                </View>
              ) : null}
              {verified && rating !== undefined ? <Text className="text-foreground/30">|</Text> : null}
              {rating !== undefined ? (
                <View className="flex-row items-center gap-1">
                  <Text className="text-[13px] font-semibold text-secondary">{rating.toFixed(1)}</Text>
                  <View className="flex-row">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} size={13} color="#0062A0" fill={i <= Math.round(rating) ? '#0062A0' : 'transparent'} />
                    ))}
                  </View>
                  <Text className="text-[13px] font-medium text-foreground">({reviewCount ?? 0} reseñas)</Text>
                </View>
              ) : null}
            </View>
            {category ? (
              <View className="flex-row flex-wrap gap-1.5">
                <View className="rounded-full bg-muted px-3 py-1">
                  <Text className="text-[11px] font-semibold text-foreground">{category}</Text>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Animated.View>
      {actions && actions.length ? (
        <Animated.View entering={FadeInDown.delay(120).duration(320)}>
          <View className="px-4 pb-4 pt-4">
            <ActionBar actions={actions} />
          </View>
        </Animated.View>
      ) : (
        <View className="h-4" />
      )}
    </View>
  );
}
