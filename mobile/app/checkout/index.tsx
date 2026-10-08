import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { useFoodCart } from '../../src/hooks/use-food-cart';
import { useAuth } from '../../src/hooks/use-auth';
import { useCreateFoodOrder } from '../../src/hooks/use-queries';
import { Section } from '../../src/components/ui/Section';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { EmptyState } from '../../src/components/ui/EmptyState';
import type { FoodOrderDeliveryMethod, FoodOrderPaymentMethod } from '../../src/lib/types';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

function PillOption<T extends string>({
  value,
  selected,
  label,
  onPress,
}: {
  value: T;
  selected: boolean;
  label: string;
  onPress: (value: T) => void;
}) {
  return (
    <Pressable
      onPress={() => onPress(value)}
      className={`flex-1 items-center rounded-lg border px-3 py-2.5 ${selected ? 'border-primary bg-primary' : 'border-input bg-card'}`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-primary-foreground' : 'text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}

export default function CheckoutScreen() {
  const { companyId, companyName, items, subtotal, updateQuantity, removeItem, clearCart } = useFoodCart();
  const { user } = useAuth();
  const createOrder = useCreateFoodOrder();

  const [customerName, setCustomerName] = useState(user?.displayName ?? '');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState<FoodOrderDeliveryMethod>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<FoodOrderPaymentMethod>('none');
  const [notes, setNotes] = useState('');

  if (!companyId || items.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Pedido' }} />
        <EmptyState title="Tu carrito está vacío" description="Añade productos desde el menú de un restaurante." />
      </SafeAreaView>
    );
  }

  const submit = () => {
    if (!customerName.trim() || !customerPhone.trim()) {
      Alert.alert('Faltan datos', 'Introduce tu nombre y teléfono de contacto.');
      return;
    }
    if (deliveryMethod === 'situka' && !deliveryAddress.trim()) {
      Alert.alert('Falta la dirección', 'Introduce la dirección de entrega.');
      return;
    }
    createOrder.mutate(
      {
        companyId,
        customerId: user?.uid ?? null,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        items: items.map((i) => ({
          menuItemId: i.menuItemId,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          selectedOptions: i.selectedOptions,
        })),
        deliveryMethod,
        deliveryAddress: deliveryMethod === 'situka' ? deliveryAddress.trim() : undefined,
        paymentMethod,
        notes: notes.trim(),
      },
      {
        onSuccess: () => {
          clearCart();
          Alert.alert('¡Pedido enviado!', `${companyName} ha recibido tu pedido y se pondrá en contacto contigo.`, [
            { text: 'OK', onPress: () => router.push('/(tabs)') },
          ]);
        },
        onError: () => Alert.alert('Error', 'No se pudo enviar el pedido. Inténtalo de nuevo.'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Confirmar pedido' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView>
        <Section title={companyName ?? 'Pedido'}>
          <View className="gap-3">
            {items.map((item) => (
              <View key={item.lineId} className="gap-1 rounded-lg border border-border bg-card p-3">
                <View className="flex-row items-start justify-between">
                  <Text className="flex-1 text-sm font-semibold text-foreground">{item.name}</Text>
                  <Text className="text-sm font-semibold text-foreground">{formatPrice(item.price * item.quantity)}</Text>
                </View>
                {item.selectedOptions && item.selectedOptions.length > 0 ? (
                  <Text className="text-xs text-muted-foreground">
                    {item.selectedOptions.map((o) => o.optionName).join(', ')}
                  </Text>
                ) : null}
                <View className="flex-row items-center justify-between pt-1">
                  <View className="flex-row items-center gap-3">
                    <Pressable
                      onPress={() => updateQuantity(item.lineId, item.quantity - 1)}
                      className="h-7 w-7 items-center justify-center rounded-full bg-muted"
                    >
                      <Minus size={14} color="#1A1C1C" />
                    </Pressable>
                    <Text className="text-sm font-medium text-foreground">{item.quantity}</Text>
                    <Pressable
                      onPress={() => updateQuantity(item.lineId, item.quantity + 1)}
                      className="h-7 w-7 items-center justify-center rounded-full bg-muted"
                    >
                      <Plus size={14} color="#1A1C1C" />
                    </Pressable>
                  </View>
                  <Pressable onPress={() => removeItem(item.lineId)} hitSlop={8}>
                    <Trash2 size={16} color="#E11D48" />
                  </Pressable>
                </View>
              </View>
            ))}
            <View className="flex-row justify-between border-t border-border pt-3">
              <Text className="text-base font-bold text-foreground">Subtotal</Text>
              <Text className="text-base font-bold text-foreground">{formatPrice(subtotal)}</Text>
            </View>
          </View>
        </Section>

        <Section title="Datos de contacto">
          <View className="gap-3">
            <TextField label="Nombre" value={customerName} onChangeText={setCustomerName} />
            <TextField label="Teléfono" value={customerPhone} onChangeText={setCustomerPhone} keyboardType="phone-pad" />
          </View>
        </Section>

        <Section title="Entrega">
          <View className="flex-row gap-2">
            <PillOption value="pickup" selected={deliveryMethod === 'pickup'} label="Recoger" onPress={setDeliveryMethod} />
            <PillOption value="situka" selected={deliveryMethod === 'situka'} label="Envío (Situka)" onPress={setDeliveryMethod} />
          </View>
          {deliveryMethod === 'situka' ? (
            <View className="mt-3">
              <TextField label="Dirección de entrega" value={deliveryAddress} onChangeText={setDeliveryAddress} />
            </View>
          ) : null}
        </Section>

        <Section title="Pago">
          <View className="flex-row gap-2">
            <PillOption value="none" selected={paymentMethod === 'none'} label="Efectivo" onPress={setPaymentMethod} />
            <PillOption value="muni_dinero" selected={paymentMethod === 'muni_dinero'} label="Muni Dinero" onPress={setPaymentMethod} />
          </View>
        </Section>

        <Section title="Notas (opcional)">
          <TextField
            placeholder="Instrucciones adicionales…"
            value={notes}
            onChangeText={setNotes}
            multiline
            style={{ height: 70, textAlignVertical: 'top', paddingTop: 10 }}
          />
        </Section>

        <View className="px-4 py-4">
          <Button onPress={submit} loading={createOrder.isPending}>
            {`Enviar pedido · ${formatPrice(subtotal)}`}
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
