import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Share, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Heart, ImageOff, Minus, Plus, Share2, Star, Store } from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PRODUCT_CONDITION_LABELS, absoluteUrl, askProductQuestion, discountPercent, formatXaf, getProductBySlug, getProductQuestions,
  getProductReviews, getRelatedProducts, getReviewEligibility, getWishlistIds, isVariantPurchasable, productUrl, recordProductView,
  setWishlist, submitProductReview, type Product, type ProductVariant,
} from '../../../src/lib/shop';
import { useShopCart } from '../../../src/hooks/use-shop-cart';
import { useAuth } from '../../../src/hooks/use-auth';
import { CartButton } from '../../../src/components/shop/CartButton';
import { ProductCard } from '../../../src/components/shop/ProductCard';
import { Rail } from '../../../src/components/ui/Rail';
import { Section } from '../../../src/components/ui/Section';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { StarRating } from '../../../src/components/ui/StarRating';

// Picks the variant matching the chosen option values (or the only one).
function findVariant(product: Product, selected: string[]): ProductVariant | undefined {
  const active = product.variants.filter((v) => v.isActive);
  if (product.options.length === 0) return active[0];
  return active.find((v) => v.optionValues.every((val, i) => val === selected[i]));
}

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const cart = useShopCart();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ['shop', 'product', slug], queryFn: () => getProductBySlug(slug), enabled: !!slug });
  const product = data?.product;

  const [selected, setSelected] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);

  // Start on the cheapest available variant.
  useEffect(() => {
    if (!product) return;
    recordProductView(product.id);
    const first = [...product.variants].filter((v) => v.isActive && isVariantPurchasable(v)).sort((a, b) => a.price - b.price)[0]
      ?? product.variants.find((v) => v.isActive);
    setSelected(first?.optionValues ?? []);
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const variant = product ? findVariant(product, selected) : undefined;
  const purchasable = !!variant && isVariantPurchasable(variant);
  const maxQty = variant && variant.trackInventory && !variant.allowBackorder ? Math.max(1, Math.min(variant.stock, 99)) : 99;

  const wishlist = useQuery({ queryKey: ['shop', 'wishlistIds'], queryFn: getWishlistIds, enabled: !!user });
  const inWishlist = !!product && (wishlist.data ?? []).includes(product.id);
  const toggleWishlist = useMutation({
    mutationFn: () => setWishlist(product!.id, !inWishlist),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'wishlistIds'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'wishlist'] });
    },
    onError: (e: Error) => Alert.alert('Lista de deseos', e.message),
  });

  const related = useQuery({
    queryKey: ['shop', 'related', product?.id],
    queryFn: () => getRelatedProducts(product!.id, product!.categoryId ?? null, product!.companyId),
    enabled: !!product,
  });

  const images = useMemo(() => {
    if (!product) return [];
    const list = product.images.map((i) => absoluteUrl(i.url)!).filter(Boolean);
    const vImage = absoluteUrl(variant?.image);
    return vImage && !list.includes(vImage) ? [vImage, ...list] : list;
  }, [product, variant?.image]);

  if (isLoading) return <LoadingState />;
  if (!product) return <EmptyState title="Producto no encontrado" description="Puede que ya no esté a la venta." />;

  const price = variant?.price ?? product.minPrice;
  const off = discountPercent(price, variant?.compareAtPrice);

  const addToCart = (goToCart: boolean) => {
    if (!variant || !purchasable) return;
    cart.add(variant.id, quantity);
    if (goToCart) router.push('/tienda/carrito');
    else Alert.alert('Añadido al carrito', `${product.title}${product.options.length ? ` (${variant.title})` : ''} × ${quantity}`, [
      { text: 'Seguir comprando' },
      { text: 'Ver carrito', onPress: () => router.push('/tienda/carrito') },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <View className="flex-row items-center gap-4">
              <Pressable onPress={() => Share.share({ message: `${product.title} en Oltinde: ${productUrl(product.slug)}` })} hitSlop={8}>
                <Share2 size={21} color="#1A1C1C" />
              </Pressable>
              <CartButton />
            </View>
          ),
        }}
      />
      <ScrollView contentContainerClassName="pb-6">
        {data?.isPreview ? (
          <View className="bg-amber-100 px-4 py-2">
            <Text className="text-sm text-amber-900">Vista previa: este producto no está publicado.</Text>
          </View>
        ) : null}

        <View style={{ width, height: width * 0.85 }} className="bg-white">
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}
            >
              {images.map((uri) => (
                <Image key={uri} source={{ uri }} style={{ width, height: width * 0.85 }} contentFit="contain" />
              ))}
            </ScrollView>
          ) : (
            <View className="flex-1 items-center justify-center">
              <ImageOff size={32} color="#C4C4C4" />
            </View>
          )}
          {images.length > 1 ? (
            <View className="absolute bottom-3 w-full flex-row justify-center gap-1.5">
              {images.map((uri, i) => (
                <View key={uri} className={`h-2 rounded-full ${i === imageIndex ? 'w-5 bg-foreground' : 'w-2 bg-foreground/30'}`} />
              ))}
            </View>
          ) : null}
        </View>

        <View className="gap-2 px-4 pt-4">
          <View className="flex-row items-start gap-3">
            <Text className="flex-1 text-xl font-semibold leading-7 text-foreground">{product.title}</Text>
            {user ? (
              <Pressable onPress={() => toggleWishlist.mutate()} hitSlop={8} accessibilityLabel="Lista de deseos">
                <Heart size={24} color="#E11D48" fill={inWishlist ? '#E11D48' : 'transparent'} />
              </Pressable>
            ) : null}
          </View>
          <View className="flex-row flex-wrap items-center gap-3">
            {product.brand ? <Text className="text-sm text-muted-foreground">Marca: {product.brand}</Text> : null}
            <Text className="text-sm text-muted-foreground">{PRODUCT_CONDITION_LABELS[product.condition]}</Text>
            {product.ratingCount > 0 ? <StarRating rating={product.ratingAvg} count={product.ratingCount} size={13} /> : null}
          </View>

          <View className="mt-1 flex-row flex-wrap items-baseline gap-2">
            <Text className="text-3xl font-semibold text-foreground">{formatXaf(price)}</Text>
            {off && variant?.compareAtPrice ? (
              <>
                <Text className="text-base text-muted-foreground line-through">{formatXaf(variant.compareAtPrice)}</Text>
                <Text className="text-base font-semibold text-destructive">-{off}%</Text>
              </>
            ) : null}
          </View>
          {variant ? (
            <Text className={`text-sm font-semibold ${purchasable ? 'text-green-700' : 'text-destructive'}`}>
              {!purchasable ? 'Agotado' : variant.trackInventory && !variant.allowBackorder && variant.stock <= 5 ? `¡Solo quedan ${variant.stock}!` : 'Disponible'}
            </Text>
          ) : (
            <Text className="text-sm font-semibold text-destructive">Esta combinación no está disponible</Text>
          )}

          <Pressable onPress={() => router.push(`/companies/${product.companyId}`)} className="flex-row items-center gap-1.5">
            <Store size={15} color="#1976D2" />
            <Text className="text-sm font-semibold text-secondary">Vendido por {product.companyName}</Text>
          </Pressable>
        </View>

        {product.options.map((option, i) => (
          <View key={option.name} className="gap-2 px-4 pt-4">
            <Text className="text-sm font-semibold text-foreground">
              {option.name}: <Text className="font-normal">{selected[i] ?? '—'}</Text>
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {option.values.map((value) => {
                const next = [...selected];
                next[i] = value;
                const candidate = findVariant(product, next);
                const available = !!candidate && isVariantPurchasable(candidate);
                const isSel = selected[i] === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => { setSelected(next); setQuantity(1); }}
                    className={`rounded-lg border px-3.5 py-2 ${isSel ? 'border-foreground bg-foreground' : 'border-input bg-card'} ${available ? '' : 'opacity-40'}`}
                  >
                    <Text className={`text-sm font-medium ${isSel ? 'text-background' : 'text-foreground'}`}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}

        <View className="flex-row items-center gap-3 px-4 pt-5">
          <Text className="text-sm font-semibold text-foreground">Cantidad</Text>
          <View className="flex-row items-center rounded-lg border border-input bg-card">
            <Pressable onPress={() => setQuantity((q) => Math.max(1, q - 1))} className="p-2.5" hitSlop={4}>
              <Minus size={16} color="#1A1C1C" />
            </Pressable>
            <Text className="w-8 text-center text-base font-semibold text-foreground">{quantity}</Text>
            <Pressable onPress={() => setQuantity((q) => Math.min(maxQty, q + 1))} className="p-2.5" hitSlop={4}>
              <Plus size={16} color="#1A1C1C" />
            </Pressable>
          </View>
        </View>

        <View className="gap-2.5 px-4 pt-4">
          <Button onPress={() => addToCart(false)} disabled={!purchasable}>Añadir al carrito</Button>
          <Button variant="secondary" onPress={() => addToCart(true)} disabled={!purchasable}>Comprar ahora</Button>
          <Text className="text-center text-xs text-muted-foreground">Pago al recibir o con Muni Dinero. Sin pagos con tarjeta en la app.</Text>
        </View>

        {product.shortDescription || product.description ? (
          <View className="mt-5">
            <Section title="Descripción">
              {product.shortDescription ? <Text className="text-sm font-medium text-foreground">{product.shortDescription}</Text> : null}
              <Text className="text-sm leading-6 text-foreground">{product.description}</Text>
            </Section>
          </View>
        ) : null}

        {product.specs.length > 0 ? (
          <Section title="Características">
            <View className="overflow-hidden rounded-lg border border-border">
              {product.specs.map((s, i) => (
                <View key={`${s.name}-${i}`} className={`flex-row px-3 py-2.5 ${i % 2 ? 'bg-card' : 'bg-muted/50'}`}>
                  <Text className="w-2/5 text-sm text-muted-foreground">{s.name}</Text>
                  <Text className="flex-1 text-sm text-foreground">{s.value}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        <ReviewsSection productId={product.id} />
        <QuestionsSection productId={product.id} />

        {related.data?.fromSeller.length ? (
          <Rail title={`Más de ${product.companyName}`}>
            {related.data.fromSeller.map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        ) : null}
        {related.data?.related.length ? (
          <Rail title="Productos relacionados">
            {related.data.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </Rail>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: ['shop', 'reviews', productId], queryFn: () => getProductReviews(productId) });
  const eligibility = useQuery({ queryKey: ['shop', 'reviewEligibility', productId], queryFn: () => getReviewEligibility(productId), enabled: !!user });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    const existing = eligibility.data?.existing;
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment);
    }
  }, [eligibility.data?.existing]);

  const submit = useMutation({
    mutationFn: () => submitProductReview(productId, { rating, comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop', 'reviews', productId] });
      Alert.alert('Gracias', 'Su valoración se ha publicado.');
    },
    onError: (e: Error) => Alert.alert('No se pudo publicar', e.message),
  });

  const data = reviews.data;
  return (
    <Section title={`Valoraciones${data?.count ? ` (${data.count})` : ''}`}>
      {data && data.count > 0 ? <StarRating rating={data.average} count={data.count} size={16} /> : null}
      {eligibility.data?.canReview ? (
        <View className="gap-2 rounded-lg border border-border bg-card p-3">
          <Text className="text-sm font-semibold text-foreground">{eligibility.data.existing ? 'Su valoración' : 'Valore este producto'}</Text>
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4}>
                <Star size={28} color="#FFCD00" fill={n <= rating ? '#FFCD00' : 'transparent'} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Cuente su experiencia con el producto"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[80px] rounded-lg border border-input bg-background p-3 text-sm text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
          <Button onPress={() => submit.mutate()} loading={submit.isPending} disabled={rating === 0 || comment.trim().length < 3}>
            Publicar valoración
          </Button>
        </View>
      ) : eligibility.data?.reason === 'not_purchased' ? (
        <Text className="text-xs text-muted-foreground">Solo quienes han recibido este producto pueden valorarlo.</Text>
      ) : null}
      {!data || data.reviews.length === 0 ? (
        <Text className="text-sm text-muted-foreground">Todavía no hay valoraciones.</Text>
      ) : (
        <View className="gap-3">
          {data.reviews.slice(0, 20).map((r) => (
            <View key={r.id} className="gap-1 rounded-lg border border-border bg-card p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{r.author}</Text>
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#FFCD00" fill="#FFCD00" />
                  <Text className="text-xs text-muted-foreground">{r.rating}</Text>
                </View>
              </View>
              {r.isVerifiedPurchase ? (
                <View className="flex-row items-center gap-1">
                  <BadgeCheck size={12} color="#15803D" />
                  <Text className="text-xs font-medium text-green-700">Compra verificada</Text>
                </View>
              ) : null}
              <Text className="text-sm text-foreground">{r.comment}</Text>
              <Text className="text-xs text-muted-foreground">{format(new Date(r.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
              {r.replyText ? (
                <View className="mt-1 gap-1 rounded-md bg-muted p-2">
                  <Text className="text-xs font-semibold text-foreground">Respuesta del vendedor</Text>
                  <Text className="text-xs text-foreground">{r.replyText}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}

function QuestionsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const questions = useQuery({ queryKey: ['shop', 'questions', productId], queryFn: () => getProductQuestions(productId) });
  const [text, setText] = useState('');
  const ask = useMutation({
    mutationFn: () => askProductQuestion(productId, text.trim()),
    onSuccess: () => {
      setText('');
      queryClient.invalidateQueries({ queryKey: ['shop', 'questions', productId] });
      Alert.alert('Pregunta enviada', 'El vendedor recibirá un aviso y le responderá aquí.');
    },
    onError: (e: Error) => Alert.alert('No se pudo enviar', e.message),
  });

  return (
    <Section title="Preguntas y respuestas">
      {user ? (
        <View className="flex-row items-end gap-2">
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Pregunte al vendedor…"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[44px] flex-1 rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
          />
          <Button onPress={() => ask.mutate()} loading={ask.isPending} disabled={text.trim().length < 5} className="h-11">
            Enviar
          </Button>
        </View>
      ) : null}
      {(questions.data ?? []).length === 0 ? (
        <Text className="text-sm text-muted-foreground">Nadie ha preguntado todavía.</Text>
      ) : (
        <View className="gap-3">
          {questions.data!.map((q) => (
            <View key={q.id} className="gap-1">
              <Text className="text-sm font-semibold text-foreground">P: {q.question}</Text>
              {q.answer ? (
                <Text className="text-sm text-foreground">R: {q.answer}</Text>
              ) : (
                <Text className="text-xs text-muted-foreground">Esperando respuesta del vendedor</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}
