import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { Flame, ImageOff, Plus, ShoppingCart, X } from 'lucide-react-native';
import { useFoodCart, type FoodCartSelectedOption } from '../../hooks/use-food-cart';
import type { MenuItem } from '../../lib/types';
import { Button } from '../ui/Button';

function formatPrice(price: number) {
  return `${price.toLocaleString('es-ES')} XAF`;
}

interface PendingCartItem {
  menuItemId: string;
  name: string;
  price: number;
  image?: string;
  selectedOptions?: FoodCartSelectedOption[];
}

function MenuItemCard({ item, onAdd }: { item: MenuItem; onAdd: (item: MenuItem) => void }) {
  const hasOptions = (item.optionGroups?.length ?? 0) > 0;
  return (
    <View className={`flex-row gap-3 rounded-lg border border-border bg-card p-3 ${item.available ? '' : 'opacity-60'}`}>
      <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-md bg-muted">
        {item.image ? (
          <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <ImageOff size={22} color="#C4C4C4" />
        )}
      </View>
      <View className="flex-1 justify-between gap-1">
        <View>
          <Text className="text-sm font-semibold text-foreground">{item.name}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={2}>
            {item.description}
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            {hasOptions ? `Desde ${formatPrice(item.price)}` : formatPrice(item.price)}
          </Text>
          {item.available ? (
            <Pressable
              onPress={() => onAdd(item)}
              className="flex-row items-center gap-1 rounded-full bg-primary px-3 py-1.5"
            >
              <Plus size={14} color="#000" />
              <Text className="text-xs font-semibold text-primary-foreground">Añadir</Text>
            </Pressable>
          ) : (
            <Text className="text-xs font-semibold text-destructive">Agotado</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function OptionsModal({
  item,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (cartItem: PendingCartItem) => void;
}) {
  const groups = item.optionGroups || [];
  const [selections, setSelections] = useState<Record<string, string>>({});

  const total = useMemo(() => {
    let sum = item.price;
    groups.forEach((g) => {
      const option = g.options.find((o) => o.id === selections[g.id]);
      if (option) sum += option.priceDelta;
    });
    return sum;
  }, [item.price, groups, selections]);

  const missingRequired = groups.some((g) => g.required && !selections[g.id]);

  const confirm = () => {
    const selectedOptions: FoodCartSelectedOption[] = groups
      .map((g) => {
        const option = g.options.find((o) => o.id === selections[g.id]);
        return option ? { groupName: g.name, optionName: option.name, priceDelta: option.priceDelta } : null;
      })
      .filter((o): o is FoodCartSelectedOption => o !== null);
    onConfirm({ menuItemId: item.id, name: item.name, price: total, image: item.image, selectedOptions });
  };

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/40">
        <View className="max-h-[80%] gap-4 rounded-t-2xl bg-background p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1">
              <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
              <Text className="text-sm text-muted-foreground">{item.description}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8}>
              <X size={22} color="#1A1C1C" />
            </Pressable>
          </View>
          <ScrollView className="gap-4">
            {groups.map((group) => (
              <View key={group.id} className="mb-4 gap-2">
                <Text className="text-sm font-semibold text-foreground">
                  {group.name} {group.required ? <Text className="text-destructive">*</Text> : null}
                </Text>
                {group.options.map((option) => {
                  const selected = selections[group.id] === option.id;
                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setSelections((prev) => ({ ...prev, [group.id]: option.id }))}
                      className={`flex-row items-center justify-between rounded-lg border p-3 ${selected ? 'border-primary bg-muted' : 'border-border bg-card'}`}
                    >
                      <Text className="text-sm text-foreground">{option.name}</Text>
                      {option.priceDelta !== 0 ? (
                        <Text className="text-xs text-muted-foreground">
                          {option.priceDelta > 0 ? '+' : ''}
                          {formatPrice(option.priceDelta)}
                        </Text>
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
          <Button onPress={confirm} disabled={missingRequired}>
            {`Añadir · ${formatPrice(total)}`}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

export function RestaurantMenu({ items, companyId, companyName }: { items: MenuItem[]; companyId: string; companyName: string }) {
  const { addItem, replaceCart, itemCount, subtotal, companyId: cartCompanyId } = useFoodCart();
  const [optionsItem, setOptionsItem] = useState<MenuItem | null>(null);

  const menuDelDia = useMemo(() => items.filter((i) => i.isMenuDelDia && i.available), [items]);
  const groupedByType = useMemo(() => {
    const groups = new Map<string, MenuItem[]>();
    items.forEach((item) => {
      const key = item.foodType || 'Otros';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    });
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const attemptAdd = (cartItem: PendingCartItem) => {
    const added = addItem(companyId, companyName, cartItem);
    if (!added) {
      Alert.alert(
        '¿Vaciar el carrito actual?',
        `Tu carrito tiene productos de otro restaurante. ¿Deseas vaciar el pedido actual y añadir "${cartItem.name}" de ${companyName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Sí, vaciar y añadir', onPress: () => replaceCart(companyId, companyName, cartItem) },
        ],
      );
    }
  };

  const handleAdd = (item: MenuItem) => {
    if ((item.optionGroups?.length ?? 0) > 0) {
      setOptionsItem(item);
      return;
    }
    attemptAdd({ menuItemId: item.id, name: item.name, price: item.price, image: item.image });
  };

  const handleOptionsConfirm = (cartItem: PendingCartItem) => {
    setOptionsItem(null);
    attemptAdd(cartItem);
  };

  const isOwnCart = itemCount > 0 && cartCompanyId === companyId;

  return (
    <View className="gap-4">
      {menuDelDia.length > 0 ? (
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="h-6 w-6 items-center justify-center rounded-md bg-primary">
              <Flame size={14} color="#000" />
            </View>
            <Text className="text-sm font-semibold text-foreground">Menú del Día</Text>
          </View>
          <View className="gap-2">
            {menuDelDia.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </View>
        </View>
      ) : null}

      {groupedByType.map(([foodType, groupItems]) => (
        <View key={foodType} className="gap-2">
          <Text className="text-sm font-semibold text-foreground">
            {foodType} ({groupItems.length})
          </Text>
          <View className="gap-2">
            {groupItems.map((item) => (
              <MenuItemCard key={item.id} item={item} onAdd={handleAdd} />
            ))}
          </View>
        </View>
      ))}

      {isOwnCart ? (
        <Pressable
          onPress={() => router.push('/checkout')}
          className="flex-row items-center justify-between rounded-lg bg-primary px-4 py-3.5"
        >
          <View className="flex-row items-center gap-2">
            <ShoppingCart size={18} color="#000" />
            <Text className="text-sm font-semibold text-primary-foreground">Ver pedido ({itemCount})</Text>
          </View>
          <Text className="text-sm font-semibold text-primary-foreground">{formatPrice(subtotal)}</Text>
        </Pressable>
      ) : null}

      {optionsItem ? (
        <OptionsModal item={optionsItem} onClose={() => setOptionsItem(null)} onConfirm={handleOptionsConfirm} />
      ) : null}
    </View>
  );
}
