import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Store } from 'lucide-react-native';
import {
  DELIVERY_METHOD_LABELS, PAYMENT_METHOD_LABELS, checkCoupon, deliveryFeeFor, formatXaf, getCartDetails, placeOrder,
  type CartSellerGroup, type ShopDeliveryMethod, type ShopPaymentMethod,
} from '../../src/lib/shop';
import { rpc } from '../../src/lib/api';
import { useShopCart } from '../../src/hooks/use-shop-cart';
import { useAuth } from '../../src/hooks/use-auth';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

type Choice = { deliveryMethod: ShopDeliveryMethod; paymentMethod: ShopPaymentMethod };
type AppliedCoupon = { code: string; discount: number; label: string };

function defaultChoice(g: CartSellerGroup): Choice {
  return {
    deliveryMethod: g.settings.pickupEnabled ? 'pickup' : 'delivery',
    paymentMethod: g.settings.acceptsCash ? 'cash' : 'muni_dinero',
  };
}

export default function ShopCheckoutScreen() {
  const cart = useShopCart();
  const { user } = useAuth();
  const details = useQuery({ queryKey: ['shop', 'cart', cart.lines], queryFn: () => getCartDetails(cart.lines), enabled: cart.lines.length > 0 });
  const cities = useQuery({ queryKey: ['cities'], queryFn: () => rpc<string[]>('getUniqueCities') });

  const [name, setName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [couponInputs, setCouponInputs] = useState<Record<string, string>>({});
  const [coupons, setCoupons] = useState<Record<string, AppliedCoupon>>({});

  useEffect(() => {
    if (!city && cities.data?.includes('Malabo')) setCity('Malabo');
  }, [cities.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const choiceFor = (g: CartSellerGroup) => choices[g.companyId] ?? defaultChoice(g);
  const setChoice = (g: CartSellerGroup, patch: Partial<Choice>) =>
    setChoices((prev) => ({ ...prev, [g.companyId]: { ...choiceFor(g), ...patch } }));

  const summary = useMemo(() => {
    if (!details.data) return null;
    const rows = details.data.groups.map((g) => {
      const choice = choiceFor(g);
      const fee = choice.deliveryMethod === 'delivery' ? deliveryFeeFor(g.settings, city || undefined, g.subtotal) : 0;
      const belowMinimum = g.settings.minOrderAmount !== undefined && g.subtotal < g.settings.minOrderAmount;
      return { group: g, choice, fee, belowMinimum, coupon: coupons[g.companyId] };
    });
    const needsAddress = rows.some((r) => r.choice.deliveryMethod === 'delivery');
    const shipping = rows.reduce((s, r) => s + (r.fee ?? 0), 0);
    const discount = rows.reduce((s, r) => s + (r.coupon?.discount ?? 0), 0);
    return { rows, needsAddress, shipping, discount, total: details.data.subtotal - discount + shipping };
  }, [details.data, choices, city, coupons]); // eslint-disable-line react-hooks/exhaustive-deps

  const applyCoupon = useMutation({
    mutationFn: async (g: CartSellerGroup) => {
      const result = await checkCoupon(g.companyId, couponInputs[g.companyId] ?? '', g.subtotal);
      if (!result.success) throw new Error(result.message);
      return { companyId: g.companyId, coupon: { code: result.code, discount: result.discount, label: result.label } };
    },
    onSuccess: ({ companyId, coupon }) => setCoupons((prev) => ({ ...prev, [companyId]: coupon })),
    onError: (e: Error) => Alert.alert('Cupón no aplicado', e.message),
  });

  const submit = useMutation({
    mutationFn: () =>
      placeOrder({
        lines: cart.lines,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        deliveryCity: summary!.needsAddress ? city : undefined,
        deliveryAddress: summary!.needsAddress ? address : undefined,
        notes: notes || undefined,
        sellers: summary!.rows.map((r) => ({ companyId: r.group.companyId, ...r.choice, couponCode: r.coupon?.code })),
      }),
    onSuccess: (result) => {
      cart.clear();
      router.replace(`/tienda/pedido/${result.checkoutId}`);
    },
    onError: (e: Error) => Alert.alert('No se pudo completar el pedido', e.message),
  });

  if (cart.lines.length === 0) {
    return <EmptyState title="Su carrito está vacío" />;
  }
  if (details.isLoading || !details.data || !summary) return <LoadingState />;

  const hasIssues = details.data.groups.some((g) => g.items.some((i) => i.issue));

  const onSubmit = () => {
    const missingFee = summary.rows.find((r) => r.choice.deliveryMethod === 'delivery' && r.fee === undefined);
    const belowMin = summary.rows.find((r) => r.belowMinimum);
    const problem = hasIssues
      ? 'Hay productos en su carrito que ya no están disponibles. Revise el carrito.'
      : name.trim().length < 2
        ? 'Indique su nombre.'
        : phone.trim().length < 6
          ? 'Indique un teléfono de contacto.'
          : summary.needsAddress && !city
            ? 'Elija la ciudad de entrega.'
            : summary.needsAddress && address.trim().length < 5
              ? 'Indique la dirección de entrega.'
              : missingFee
                ? `${missingFee.group.companyName} no hace envíos a ${city}. Elija recogida en tienda.`
                : belowMin
                  ? `No alcanza el pedido mínimo de ${belowMin.group.companyName}.`
                  : null;
    if (problem) {
      Alert.alert('Revise su pedido', problem);
      return;
    }
    submit.mutate();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Tramitar pedido' }} />
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-8" keyboardShouldPersistTaps="handled">
          <View className="gap-3">
            <Text className="text-lg font-semibold text-foreground">Sus datos</Text>
            <TextField label="Nombre" value={name} onChangeText={setName} autoComplete="name" />
            <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+240 …" />
            <TextField label="Correo (opcional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          </View>

          {summary.rows.map(({ group, choice, fee, belowMinimum, coupon }) => (
            <View key={group.companyId} className="gap-3 rounded-lg border border-border bg-card p-4" style={{ elevation: 1 }}>
              <View className="flex-row items-center gap-2">
                <Store size={16} color="#1A1C1C" />
                <Text className="flex-1 text-base font-semibold text-foreground" numberOfLines={1}>{group.companyName}</Text>
                <Text className="text-sm font-semibold text-foreground">{formatXaf(group.subtotal)}</Text>
              </View>
              <Text className="text-xs text-muted-foreground">
                {group.items.reduce((n, i) => n + i.quantity, 0)} artículo(s)
              </Text>

              <Text className="text-sm font-semibold text-foreground">Entrega</Text>
              <View className="flex-row flex-wrap gap-2">
                {group.settings.pickupEnabled ? (
                  <Chip label={DELIVERY_METHOD_LABELS.pickup} selected={choice.deliveryMethod === 'pickup'} onPress={() => setChoice(group, { deliveryMethod: 'pickup' })} />
                ) : null}
                {group.settings.deliveryEnabled ? (
                  <Chip label={DELIVERY_METHOD_LABELS.delivery} selected={choice.deliveryMethod === 'delivery'} onPress={() => setChoice(group, { deliveryMethod: 'delivery' })} />
                ) : null}
              </View>
              {choice.deliveryMethod === 'pickup' && group.settings.pickupAddress ? (
                <Text className="text-xs text-muted-foreground">Recoger en: {group.settings.pickupAddress}</Text>
              ) : null}
              {choice.deliveryMethod === 'delivery' && city ? (
                fee === undefined ? (
                  <Text className="text-xs font-semibold text-destructive">No envía a {city}</Text>
                ) : (
                  <Text className="text-xs text-muted-foreground">Envío a {city}: {fee === 0 ? 'gratis' : formatXaf(fee)}</Text>
                )
              ) : null}

              <Text className="text-sm font-semibold text-foreground">Pago</Text>
              <View className="flex-row flex-wrap gap-2">
                {group.settings.acceptsCash ? (
                  <Chip label={PAYMENT_METHOD_LABELS.cash} selected={choice.paymentMethod === 'cash'} onPress={() => setChoice(group, { paymentMethod: 'cash' })} />
                ) : null}
                {group.settings.acceptsMuniDinero ? (
                  <Chip label={PAYMENT_METHOD_LABELS.muni_dinero} selected={choice.paymentMethod === 'muni_dinero'} onPress={() => setChoice(group, { paymentMethod: 'muni_dinero' })} />
                ) : null}
              </View>

              {coupon ? (
                <View className="flex-row items-center justify-between rounded-lg bg-green-50 px-3 py-2">
                  <Text className="flex-1 text-sm text-green-800">Cupón {coupon.code}: −{formatXaf(coupon.discount)}</Text>
                  <Pressable onPress={() => setCoupons(({ [group.companyId]: _x, ...rest }) => rest)} hitSlop={8}>
                    <Text className="text-sm font-semibold text-destructive">Quitar</Text>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-2">
                  <TextInput
                    value={couponInputs[group.companyId] ?? ''}
                    onChangeText={(t) => setCouponInputs((prev) => ({ ...prev, [group.companyId]: t }))}
                    placeholder="Código de descuento"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="characters"
                    className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                  />
                  <Button variant="outline" className="h-11" onPress={() => applyCoupon.mutate(group)} loading={applyCoupon.isPending && applyCoupon.variables?.companyId === group.companyId}>
                    Aplicar
                  </Button>
                </View>
              )}

              {belowMinimum ? (
                <Text className="text-xs font-semibold text-destructive">Pedido mínimo: {formatXaf(group.settings.minOrderAmount!)}</Text>
              ) : null}
              {group.settings.orderNotes ? <Text className="text-xs text-muted-foreground">{group.settings.orderNotes}</Text> : null}
            </View>
          ))}

          {summary.needsAddress ? (
            <View className="gap-3">
              <Text className="text-lg font-semibold text-foreground">Dirección de entrega</Text>
              <View className="flex-row flex-wrap gap-2">
                {(cities.data ?? []).map((c) => (
                  <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />
                ))}
              </View>
              <TextField label="Dirección" value={address} onChangeText={setAddress} placeholder="Barrio, calle, referencias…" />
            </View>
          ) : null}

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Notas para el vendedor (opcional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholderTextColor="#9CA3AF"
              className="min-h-[70px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </ScrollView>

        <View className="gap-1.5 border-t border-border bg-card px-4 py-3">
          <Row label="Productos" value={formatXaf(details.data.subtotal)} />
          {summary.discount > 0 ? <Row label="Descuentos" value={`−${formatXaf(summary.discount)}`} /> : null}
          {summary.needsAddress ? <Row label="Envío" value={summary.shipping === 0 ? 'Gratis' : formatXaf(summary.shipping)} /> : null}
          <View className="flex-row items-baseline justify-between">
            <Text className="text-base font-semibold text-foreground">Total</Text>
            <Text className="text-xl font-semibold text-foreground">{formatXaf(summary.total)}</Text>
          </View>
          <Button onPress={onSubmit} loading={submit.isPending} className="mt-1">Confirmar pedido</Button>
          <Text className="text-center text-xs text-muted-foreground">Pagará al vendedor al recibir o recoger su pedido.</Text>
        </View>
      </KeyboardAware>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row justify-between">
      <Text className="text-sm text-muted-foreground">{label}</Text>
      <Text className="text-sm text-foreground">{value}</Text>
    </View>
  );
}
