import { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, RefreshControl, ScrollView, Switch, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { TicketPercent } from 'lucide-react-native';
import { deleteCoupon, getSellerCoupons, saveCoupon, type Coupon, type CouponType } from '../../../src/lib/business';
import { formatXaf } from '../../../src/lib/shop';
import { Button } from '../../../src/components/ui/Button';
import { TextField } from '../../../src/components/ui/TextField';
import { Chip } from '../../../src/components/ui/Rail';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

type Draft = {
  id?: string;
  code: string;
  description: string;
  type: CouponType;
  value: string;
  minSubtotal: string;
  maxUses: string;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
};
const EMPTY: Draft = { code: '', description: '', type: 'percent', value: '10', minSubtotal: '', maxUses: '', startsAt: '', endsAt: '', isActive: true };

// Dates are typed as AAAA-MM-DD (local day); stored as start / end of that day.
const toDay = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('sv-SE') : '');
const fromDay = (d: string, endOfDay: boolean) => (d ? new Date(`${d}T${endOfDay ? '23:59:59' : '00:00:00'}`).toISOString() : undefined);
const validDay = (d: string) => !d || (/^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(new Date(`${d}T00:00:00`).getTime()));

function couponState(c: Coupon): { label: string; on: boolean } {
  const now = new Date();
  if (!c.isActive) return { label: 'Desactivado', on: false };
  if (c.endsAt && new Date(c.endsAt) < now) return { label: 'Caducado', on: false };
  if (c.maxUses !== undefined && c.maxUses !== null && c.usedCount >= c.maxUses) return { label: 'Agotado', on: false };
  if (c.startsAt && new Date(c.startsAt) > now) return { label: 'Programado', on: false };
  return { label: 'Activo', on: true };
}

// Discount codes for the seller's products (web: shop/coupons).
export default function CouponsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const coupons = useQuery({ queryKey: ['seller', 'coupons', id], queryFn: () => getSellerCoupons(id) });
  const [draft, setDraft] = useState<Draft | null>(null);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['seller', 'coupons', id] });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      saveCoupon(
        id,
        {
          code: d.code.trim().toUpperCase(),
          description: d.description.trim() || undefined,
          type: d.type,
          value: Number(d.value),
          minSubtotal: d.minSubtotal ? Number(d.minSubtotal) : undefined,
          maxUses: d.maxUses ? Number(d.maxUses) : undefined,
          startsAt: fromDay(d.startsAt, false),
          endsAt: fromDay(d.endsAt, true),
          isActive: d.isActive,
        },
        d.id,
      ),
    onSuccess: () => {
      setDraft(null);
      refresh();
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const remove = useMutation({
    mutationFn: (c: Coupon) => deleteCoupon(c.id),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('No se pudo eliminar', e.message),
  });

  const confirmRemove = (c: Coupon) =>
    Alert.alert(
      c.usedCount > 0 ? 'Desactivar cupón' : 'Eliminar cupón',
      c.usedCount > 0 ? `${c.code} ya se ha usado, así que se desactivará en vez de borrarse.` : `¿Eliminar ${c.code}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: c.usedCount > 0 ? 'Desactivar' : 'Eliminar', style: 'destructive', onPress: () => remove.mutate(c) },
      ],
    );

  const submit = () => {
    if (!draft) return;
    if (!validDay(draft.startsAt) || !validDay(draft.endsAt)) {
      Alert.alert('Fecha no válida', 'Use el formato AAAA-MM-DD, por ejemplo 2026-12-24.');
      return;
    }
    save.mutate(draft);
  };

  const edit = (c: Coupon) =>
    setDraft({
      id: c.id,
      code: c.code,
      description: c.description ?? '',
      type: c.type,
      value: String(c.value),
      minSubtotal: c.minSubtotal?.toString() ?? '',
      maxUses: c.maxUses?.toString() ?? '',
      startsAt: toDay(c.startsAt),
      endsAt: toDay(c.endsAt),
      isActive: c.isActive,
    });

  return (
    <>
      <Stack.Screen options={{ title: 'Cupones de descuento' }} />
      {coupons.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={coupons.data ?? []}
          keyExtractor={(c) => c.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={coupons.isRefetching} onRefresh={() => coupons.refetch()} />}
          ListHeaderComponent={
            <View className="gap-3 pb-2">
              <Text className="text-sm text-muted-foreground">Códigos que sus clientes escriben al pagar. Solo descuentan en sus productos.</Text>
              <Button onPress={() => setDraft({ ...EMPTY })}>Nuevo cupón</Button>
            </View>
          }
          ListEmptyComponent={
            <EmptyState icon={TicketPercent} title="Todavía no tiene cupones" description="Cree uno para una promoción, por ejemplo BIENVENIDA10 con un 10% de descuento." />
          }
          renderItem={({ item }) => {
            const state = couponState(item);
            return (
              <View className="gap-1.5 rounded-lg border border-border bg-card p-4">
                <View className="flex-row items-center gap-2">
                  <Text className="text-lg font-semibold text-foreground" style={{ fontFamily: 'monospace' }}>{item.code}</Text>
                  <View className={`rounded-full px-2 py-0.5 ${state.on ? 'bg-primary' : 'bg-muted'}`}>
                    <Text className="text-xs font-semibold text-foreground">{state.label}</Text>
                  </View>
                </View>
                <Text className="text-sm text-foreground">
                  {item.type === 'percent' ? `${item.value}% de descuento` : `${formatXaf(item.value)} de descuento`}
                  {item.minSubtotal ? ` · compra mínima ${formatXaf(item.minSubtotal)}` : ''}
                </Text>
                <Text className="text-xs text-muted-foreground">
                  Usado {item.usedCount}{item.maxUses ? ` de ${item.maxUses}` : ''} veces
                  {item.endsAt ? ` · hasta el ${new Date(item.endsAt).toLocaleDateString('es-ES')}` : ''}
                  {item.description ? ` · ${item.description}` : ''}
                </Text>
                <View className="mt-1 flex-row gap-2">
                  <Button variant="outline" className="flex-1" onPress={() => edit(item)}>Editar</Button>
                  <Button variant="ghost" className="flex-1" onPress={() => confirmRemove(item)}>{item.usedCount > 0 ? 'Desactivar' : 'Eliminar'}</Button>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={!!draft} animationType="slide" transparent onRequestClose={() => setDraft(null)}>
        <KeyboardAware className="flex-1 justify-end bg-black/40">
          <Pressable className="flex-1" onPress={() => setDraft(null)} />
          {draft ? (
            <View className="max-h-[88%] rounded-t-3xl bg-background">
              <ScrollView contentContainerClassName="gap-4 p-5 pb-8" keyboardShouldPersistTaps="handled">
                <Text className="text-lg font-semibold text-foreground">{draft.id ? 'Editar cupón' : 'Nuevo cupón'}</Text>
                <TextField
                  label="Código"
                  value={draft.code}
                  onChangeText={(t) => setDraft({ ...draft, code: t.toUpperCase().replace(/[^A-Z0-9_-]/g, '') })}
                  placeholder="BIENVENIDA10"
                  autoCapitalize="characters"
                  maxLength={32}
                />
                <View className="flex-row gap-2">
                  <Chip label="Porcentaje (%)" selected={draft.type === 'percent'} onPress={() => setDraft({ ...draft, type: 'percent' })} />
                  <Chip label="Importe fijo (XAF)" selected={draft.type === 'fixed'} onPress={() => setDraft({ ...draft, type: 'fixed' })} />
                </View>
                <TextField
                  label={draft.type === 'percent' ? 'Descuento (%, máximo 90)' : 'Descuento (XAF)'}
                  value={draft.value}
                  onChangeText={(t) => setDraft({ ...draft, value: t.replace(/[^0-9]/g, '') })}
                  keyboardType="number-pad"
                />
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField label="Compra mínima" value={draft.minSubtotal} onChangeText={(t) => setDraft({ ...draft, minSubtotal: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" placeholder="Opcional" />
                  </View>
                  <View className="flex-1">
                    <TextField label="Usos máximos" value={draft.maxUses} onChangeText={(t) => setDraft({ ...draft, maxUses: t.replace(/[^0-9]/g, '') })} keyboardType="number-pad" placeholder="Sin límite" />
                  </View>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <TextField label="Desde" value={draft.startsAt} onChangeText={(t) => setDraft({ ...draft, startsAt: t })} placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
                  </View>
                  <View className="flex-1">
                    <TextField label="Hasta" value={draft.endsAt} onChangeText={(t) => setDraft({ ...draft, endsAt: t })} placeholder="AAAA-MM-DD" keyboardType="numbers-and-punctuation" maxLength={10} />
                  </View>
                </View>
                <TextField label="Nota interna (opcional)" value={draft.description} onChangeText={(t) => setDraft({ ...draft, description: t })} placeholder="Ej: campaña de Navidad" maxLength={255} />
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm text-foreground">Activo</Text>
                  <Switch value={draft.isActive} onValueChange={(v) => setDraft({ ...draft, isActive: v })} />
                </View>
                <Button onPress={submit} loading={save.isPending} disabled={draft.code.length < 3 || !Number(draft.value)}>
                  {draft.id ? 'Guardar cambios' : 'Crear cupón'}
                </Button>
                <Button variant="ghost" onPress={() => setDraft(null)}>Cancelar</Button>
              </ScrollView>
            </View>
          ) : null}
        </KeyboardAware>
      </Modal>
    </>
  );
}
