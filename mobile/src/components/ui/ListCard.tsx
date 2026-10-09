import type { ReactNode } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { CheckCircle2, ImageOff, MessageCircle, Phone, Star } from 'lucide-react-native';
import { isPlaceholderImage } from '../../lib/image-utils';
import { FadeInItem, PressableScale, tick } from './motion';

interface ListCardProps {
  image?: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: ReactNode;
  verified?: boolean;
  rating?: number;
  reviewCount?: number;
  phone?: string;
  whatsapp?: string;
  imageFit?: 'contain' | 'cover';
  index?: number; // position in the list, for the staggered entrance
  onPress: () => void;
}

// Same anatomy as the website's ListingCard (src/components/shared/archive/
// ListingCard.tsx): white card with square-ish corners, logo on a white
// square, blue underlined name, black stars, and yellow contact buttons.
// Every section's list screen is built on it.
export function ListCard({
  image, title, subtitle, description, meta, verified, rating, reviewCount, phone, whatsapp, imageFit = 'contain', index = 0, onPress,
}: ListCardProps) {
  const realImage = image && !isPlaceholderImage(image) ? image : undefined;
  const hasActions = !!phone || !!whatsapp;
  return (
    <FadeInItem index={index}>
      <PressableScale onPress={onPress} scaleTo={0.98} className="rounded-lg border border-border bg-card p-3" style={{ elevation: 1 }}>
        <View className="flex-row gap-3">
          <View className={`h-20 w-20 items-center justify-center overflow-hidden rounded bg-white ${imageFit === 'contain' ? 'border border-border p-1.5' : ''}`}>
            {realImage ? (
              <Image source={{ uri: realImage }} style={{ width: '100%', height: '100%' }} contentFit={imageFit} transition={200} />
            ) : (
              <ImageOff size={20} color="#C4C4C4" />
            )}
          </View>
          <View className="flex-1 gap-1">
            <View className="flex-row items-start gap-1">
              <Text className="flex-1 text-base font-semibold leading-5 text-secondary underline" numberOfLines={2}>
                {title}
              </Text>
              {verified ? <CheckCircle2 size={16} color="#000" /> : null}
            </View>
            {subtitle ? (
              <Text className="text-xs text-secondary" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {rating !== undefined ? (
              <View className="flex-row items-center gap-1.5">
                <View className="flex-row">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} color="#000" fill={i <= Math.round(rating) ? '#000' : 'transparent'} />
                  ))}
                </View>
                <Text className="text-xs font-medium text-secondary">
                  ({reviewCount ?? 0} reseña{reviewCount === 1 ? '' : 's'})
                </Text>
              </View>
            ) : null}
            {meta}
          </View>
        </View>
        {description ? (
          <Text className="mt-2 text-sm leading-5 text-foreground" numberOfLines={2}>
            {description}
          </Text>
        ) : null}
        {hasActions ? (
          <View className="mt-3 flex-row gap-2 border-t border-border pt-3">
            {phone ? <ContactButton icon={Phone} label="Llamar" onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)} /> : null}
            {whatsapp ? (
              <ContactButton
                icon={MessageCircle}
                label="WhatsApp"
                onPress={() => Linking.openURL(whatsapp.startsWith('http') ? whatsapp : `https://wa.me/${whatsapp.replace(/[^\d]/g, '')}`)}
              />
            ) : null}
          </View>
        ) : null}
      </PressableScale>
    </FadeInItem>
  );
}

function ContactButton({ icon: Icon, label, onPress }: { icon: typeof Phone; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tick('light');
        onPress();
      }}
      hitSlop={4}
      accessibilityLabel={label}
      className="h-10 flex-row items-center gap-1.5 rounded-md bg-primary px-3 active:opacity-80"
    >
      <Icon size={17} color="#000" />
      <Text className="text-sm font-semibold text-black">{label}</Text>
    </Pressable>
  );
}
