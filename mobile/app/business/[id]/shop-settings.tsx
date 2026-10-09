import { useEffect, useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import { getSellerSettings, saveSellerSettings } from '../../../src/lib/business';
import type { ShopSellerSettings } from '../../../src/lib/shop';
import { useCompany, useUniqueCities } from '../../../src/hooks/use-queries';
import { Button } from '../../../src/components/ui/Button';
import { TextField } from '../../../src/components/ui/TextField';
import { Chip } from '../../../src/components/ui/Rail';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

const optNum = (s: string) => (s.trim() === '' ? undefined : Number(s));
const digits = (s: string) => s.replace(/[^0-9]/g, '');

function Card({ title, description, right, children }: { title: string; description?: string; right?: ReactNode; children?: ReactNode }) {
  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <View className="flex-row items-center gap-3">
        <View className="flex-1">
          <Text className="text-[15px] font-semibold text-foreground">{title}</Text>
          {description ? <Text className="text-xs text-muted-foreground">{description}</Text> : null}
        </View>
        {right}
      </View>
      {children}
    </View>
  );
}

// How the seller delivers and gets paid (web: shop/settings).
export default function ShopSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: company } = useCompany(id);
  const { data: cities = [] } = useUniqueCities();
  const settings = useQuery({ queryKey: ['seller', 'settings', id], queryFn: () => getSellerSettings(id) });

  const [s, setS] = useState<ShopSellerSettings | null>(null);
  const [fee, setFee] = useState('0');
  const [freeOver, setFreeOver] = useState('');
  const [minOrder, setMinOrder] = useState('');

  useEffect(() => {
    if (settings.data && !s) {
      setS(settings.data);
      setFee(String(settings.data.deliveryFee ?? 0));
      setFreeOver(settings.data.freeDeliveryOver?.toString() ?? '');
      setMinOrder(settings.data.minOrderAmount?.toString() ?? '');
    }
  }, [settings.data, s]);

  const save = useMutation({
    mutationFn: () =>
      saveSellerSettings(id, { ...s!, deliveryFee: Number(fee) || 0, freeDeliveryOver: optNum(freeOver), minOrderAmount: optNum(minOrder) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller', 'settings', id] });
      Alert.alert('Ajustes guardados', undefined, [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e: Error) => Alert.alert('No se pudieron guardar', e.message),
  });

  if (settings.isLoading || !s) return <LoadingState />;

  const patch = (p: Partial<ShopSellerSettings>) => setS((prev) => (prev ? { ...prev, ...p } : prev));
  const allCities = s.deliveryCities.length === 0;
  const toggleCity = (c: string) =>
    patch({ deliveryCities: s.deliveryCities.includes(c) ? s.deliveryCities.filter((x) => x !== c) : [...s.deliveryCities, c] });

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: 'Ajustes de la tienda' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        <Card
          title="Recogida en tienda"
          description="El cliente pasa a buscar el pedido. Siempre gratis."
          right={<Switch value={s.pickupEnabled} onValueChange={(v) => patch({ pickupEnabled: v })} />}
        >
          {s.pickupEnabled ? (
            <TextField
              label="Dirección de recogida"
              value={s.pickupAddress ?? ''}
              onChangeText={(t) => patch({ pickupAddress: t })}
              placeholder={company?.branches?.[0]?.location?.address || 'Dirección'}
            />
          ) : null}
        </Card>

        <Card
          title="Envío a domicilio"
          description="Usted (o su repartidor) lleva el pedido al cliente."
          right={<Switch value={s.deliveryEnabled} onValueChange={(v) => patch({ deliveryEnabled: v })} />}
        >
          {s.deliveryEnabled ? (
            <View className="gap-4">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <TextField label="Tarifa de envío (XAF)" value={fee} onChangeText={(t) => setFee(digits(t))} keyboardType="number-pad" />
                </View>
                <View className="flex-1">
                  <TextField label="Gratis desde" value={freeOver} onChangeText={(t) => setFreeOver(digits(t))} keyboardType="number-pad" placeholder="Opcional" />
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Ciudades de envío</Text>
                <View className="flex-row flex-wrap gap-2">
                  <Chip label="Todas" selected={allCities} onPress={() => patch({ deliveryCities: allCities ? cities.slice(0, 1) : [] })} />
                  {!allCities
                    ? cities.map((c) => <Chip key={c} label={c} selected={s.deliveryCities.includes(c)} onPress={() => toggleCity(c)} />)
                    : null}
                </View>
              </View>

              <View className="gap-2">
                <Text className="text-sm font-medium text-foreground">Tarifas especiales por ciudad (opcional)</Text>
                {s.deliveryFeeByCity.map((row, i) => (
                  <View key={i} className="gap-2 rounded-md bg-muted p-3">
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                      {cities.map((c) => (
                        <Chip
                          key={c}
                          label={c}
                          selected={row.city === c}
                          onPress={() => patch({ deliveryFeeByCity: s.deliveryFeeByCity.map((r, j) => (j === i ? { ...r, city: c } : r)) })}
                        />
                      ))}
                    </ScrollView>
                    <View className="flex-row items-center gap-2">
                      <TextInput
                        value={String(row.fee)}
                        onChangeText={(t) => patch({ deliveryFeeByCity: s.deliveryFeeByCity.map((r, j) => (j === i ? { ...r, fee: Number(digits(t)) || 0 } : r)) })}
                        keyboardType="number-pad"
                        className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-base text-foreground"
                      />
                      <Text className="text-sm text-muted-foreground">XAF</Text>
                      <Pressable
                        onPress={() => patch({ deliveryFeeByCity: s.deliveryFeeByCity.filter((_, j) => j !== i) })}
                        hitSlop={8}
                        accessibilityLabel="Quitar"
                      >
                        <Trash2 size={18} color="#B91C1C" />
                      </Pressable>
                    </View>
                  </View>
                ))}
                <Pressable
                  onPress={() => patch({ deliveryFeeByCity: [...s.deliveryFeeByCity, { city: cities[0] ?? '', fee: Number(fee) || 0 }] })}
                  className="flex-row items-center gap-1.5 self-start py-1"
                >
                  <Plus size={16} color="#1976D2" />
                  <Text className="text-sm font-semibold text-secondary">Añadir tarifa por ciudad</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </Card>

        <Card title="Pagos" description="Métodos que acepta. El cobro se hace fuera de la app.">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Efectivo al entregar o recoger</Text>
            <Switch value={s.acceptsCash} onValueChange={(v) => patch({ acceptsCash: v })} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground">Muni Dinero</Text>
            <Switch value={s.acceptsMuniDinero} onValueChange={(v) => patch({ acceptsMuniDinero: v })} />
          </View>
        </Card>

        <Card title="Otros">
          <TextField label="Pedido mínimo (XAF)" value={minOrder} onChangeText={(t) => setMinOrder(digits(t))} keyboardType="number-pad" placeholder="Opcional" />
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Aviso para el cliente al pagar (opcional)</Text>
            <TextInput
              value={s.orderNotes ?? ''}
              onChangeText={(t) => patch({ orderNotes: t })}
              placeholder="Ej: Entregamos de lunes a sábado de 9h a 18h."
              placeholderTextColor="#9CA3AF"
              multiline
              className="min-h-[64px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </Card>

        <Button onPress={() => save.mutate()} loading={save.isPending}>Guardar ajustes</Button>
      </ScrollView>
    </KeyboardAware>
  );
}
