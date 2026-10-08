import { Text, View } from 'react-native';
import { PressableScale } from '../ui/motion';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ImageOff } from 'lucide-react-native';
import { StarRating } from '../ui/StarRating';
import { absoluteUrl, discountPercent, formatXaf, type ProductListItem } from '../../lib/shop';

// Product tile for rails (fixed width) and grids (width from the parent).
export function ProductCard({ product, width }: { product: ProductListItem; width?: number }) {
  const image = absoluteUrl(product.image);
  const off = discountPercent(product.minPrice, product.compareAtPrice);
  return (
    <PressableScale
      scaleTo={0.97}
      onPress={() => router.push(`/tienda/p/${product.slug}`)}
      className="overflow-hidden rounded-lg border border-border bg-card"
      style={{ width: width ?? 160, elevation: 1 }}
    >
      <View className="aspect-square w-full items-center justify-center bg-white">
        {image ? (
          <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="contain" />
        ) : (
          <ImageOff size={22} color="#C4C4C4" />
        )}
        {off ? (
          <View className="absolute left-2 top-2 rounded-md bg-destructive px-1.5 py-0.5">
            <Text className="text-xs font-bold text-white">-{off}%</Text>
          </View>
        ) : null}
      </View>
      <View className="gap-1 p-2.5">
        <Text className="text-sm font-semibold leading-5 text-foreground" numberOfLines={2}>
          {product.title}
        </Text>
        {product.ratingCount > 0 ? <StarRating rating={product.ratingAvg} count={product.ratingCount} size={11} /> : null}
        <View className="flex-row flex-wrap items-baseline gap-x-1.5">
          <Text className="text-base font-extrabold text-foreground">
            {product.maxPrice > product.minPrice ? 'desde ' : ''}
            {formatXaf(product.minPrice)}
          </Text>
          {product.compareAtPrice && off ? (
            <Text className="text-xs text-muted-foreground line-through">{formatXaf(product.compareAtPrice)}</Text>
          ) : null}
        </View>
        {!product.inStock ? <Text className="text-xs font-medium text-destructive">Agotado</Text> : null}
        <Text className="text-xs text-muted-foreground" numberOfLines={1}>
          {product.companyName}
        </Text>
      </View>
    </PressableScale>
  );
}
