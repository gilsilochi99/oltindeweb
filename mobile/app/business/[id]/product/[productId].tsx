import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react-native';
import { PRODUCT_CONDITION_LABELS, getActiveCategories, type Product, type ProductCondition } from '../../../../src/lib/shop';
import { createProduct, getProductForEdit, updateProduct, type ProductInput, type ProductVariantInput } from '../../../../src/lib/business';
import { PhotoPicker } from '../../../../src/components/business/PhotoPicker';
import { TextField } from '../../../../src/components/ui/TextField';
import { Button } from '../../../../src/components/ui/Button';
import { Chip } from '../../../../src/components/ui/Rail';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../../../src/components/ui/KeyboardAware';

const MAX_IMAGES = 12;
const MAX_OPTIONS = 3;

type OptionRow = { name: string; values: string }; // values comma-separated while editing
type VariantRow = { id?: string; optionValues: string[]; price: string; compareAtPrice: string; stock: string; stockLoaded?: number; sku: string; isActive: boolean };

const num = (s: string) => Number(s.replace(/[^\d.]/g, '')) || 0;
const keyOf = (values: string[]) => values.join('\u0000');
const parseValues = (s: string) => Array.from(new Set(s.split(',').map((v) => v.trim()).filter(Boolean)));

function combos(options: { name: string; values: string[] }[]): string[][] {
  return options.reduce<string[][]>((acc, o) => acc.flatMap((prefix) => o.values.map((v) => [...prefix, v])), [[]]);
}

function variantRow(v?: Product['variants'][number], optionValues: string[] = []): VariantRow {
  return {
    id: v?.id,
    optionValues: v?.optionValues ?? optionValues,
    price: v ? String(v.price) : '',
    compareAtPrice: v?.compareAtPrice ? String(v.compareAtPrice) : '',
    stock: v ? String(v.stock) : '',
    stockLoaded: v?.stock,
    sku: v?.sku ?? '',
    isActive: v?.isActive ?? true,
  };
}

export default function ProductFormScreen() {
  const { id: companyId, productId } = useLocalSearchParams<{ id: string; productId: string }>();
  const isNew = productId === 'new';
  const existing = useQuery({ queryKey: ['seller', 'product', productId], queryFn: () => getProductForEdit(productId), enabled: !isNew });

  if (!isNew && existing.isLoading) return <LoadingState />;
  if (!isNew && !existing.data) return <EmptyState title="Producto no encontrado" />;
  return <ProductForm companyId={companyId} product={existing.data ?? undefined} />;
}

function ProductForm({ companyId, product }: { companyId: string; product?: Product }) {
  const queryClient = useQueryClient();
  const categories = useQuery({ queryKey: ['shop', 'categories'], queryFn: getActiveCategories });

  const [images, setImages] = useState<string[]>(product?.images.map((i) => i.url) ?? []);
  const [title, setTitle] = useState(product?.title ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(product?.categoryId ?? null);
  const [brand, setBrand] = useState(product?.brand ?? '');
  const [condition, setCondition] = useState<ProductCondition>(product?.condition ?? 'new');
  const [shortDescription, setShortDescription] = useState(product?.shortDescription ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [trackInventory, setTrackInventory] = useState(product ? product.variants.some((v) => v.trackInventory) : true);
  const [allowBackorder, setAllowBackorder] = useState(product ? product.variants.some((v) => v.allowBackorder) : false);
  const [options, setOptions] = useState<OptionRow[]>(product?.options.map((o) => ({ name: o.name, values: o.values.join(', ') })) ?? []);
  const [variants, setVariants] = useState<VariantRow[]>(
    product?.variants.length ? product.variants.map((v) => variantRow(v)) : [variantRow()],
  );
  const [specs, setSpecs] = useState(product?.specs ?? []);
  const [tags, setTags] = useState(product?.tags.join(', ') ?? '');

  const parsedOptions = useMemo(
    () => options.map((o) => ({ name: o.name.trim(), values: parseValues(o.values) })).filter((o) => o.name && o.values.length),
    [options],
  );

  // Keep one variant row per combination of option values, keeping what was
  // already typed (and the saved variant ids) for combinations that remain.
  useEffect(() => {
    setVariants((prev) => {
      const byKey = new Map(prev.map((v) => [keyOf(v.optionValues), v]));
      const template = prev[0];
      return combos(parsedOptions).map((values) => {
        const found = byKey.get(keyOf(values));
        if (found) return found;
        return { ...variantRow(undefined, values), price: template?.price ?? '', compareAtPrice: template?.compareAtPrice ?? '' };
      });
    });
  }, [parsedOptions]);

  const save = useMutation({
    mutationFn: async (status: ProductInput['status']) => {
      const input: ProductInput = {
        categoryId,
        title: title.trim(),
        shortDescription: shortDescription.trim() || undefined,
        description: description.trim(),
        brand: brand.trim() || undefined,
        condition,
        status,
        options: parsedOptions,
        specs: specs.filter((s) => s.name.trim() && s.value.trim()),
        tags: parseValues(tags),
        images: images.map((url) => ({ url })),
        variants: variants.map<ProductVariantInput>((v) => ({
          id: v.id,
          optionValues: v.optionValues,
          sku: v.sku.trim() || undefined,
          price: num(v.price),
          compareAtPrice: v.compareAtPrice ? num(v.compareAtPrice) : null,
          stock: trackInventory ? Math.floor(num(v.stock)) : v.stockLoaded ?? 0,
          stockLoaded: v.stockLoaded,
          trackInventory,
          allowBackorder,
          isActive: v.isActive,
        })),
      };
      if (product) await updateProduct(product.id, input);
      else await createProduct(companyId, input);
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      queryClient.invalidateQueries({ queryKey: ['shop'] });
      Alert.alert(status === 'active' ? 'Producto publicado' : 'Guardado', status === 'active' ? 'Ya está a la venta en la Tienda.' : 'Puede publicarlo cuando quiera.');
      router.back();
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const topCategories = (categories.data ?? []).filter((c) => !c.parentId);
  const childrenOf = (id: string) => (categories.data ?? []).filter((c) => c.parentId === id);
  const selectedParent = (categories.data ?? []).find((c) => c.id === categoryId)?.parentId ?? categoryId;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: product ? 'Editar producto' : 'Nuevo producto' }} />
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-10" keyboardShouldPersistTaps="handled">
          <Block title="Fotos">
            <PhotoPicker urls={images} onChange={setImages} folder={`products/${companyId}`} max={MAX_IMAGES} />
          </Block>

          <Block title="Información">
            <TextField label="Título" value={title} onChangeText={setTitle} placeholder="Ej.: Samsung Galaxy A15 128 GB" />
            <TextField label="Marca (opcional)" value={brand} onChangeText={setBrand} />
            <Label text="Estado" />
            <View className="flex-row flex-wrap gap-2">
              {(Object.keys(PRODUCT_CONDITION_LABELS) as ProductCondition[]).map((c) => (
                <Chip key={c} label={PRODUCT_CONDITION_LABELS[c]} selected={condition === c} onPress={() => setCondition(c)} />
              ))}
            </View>
            <TextField label="Resumen corto (opcional)" value={shortDescription} onChangeText={setShortDescription} />
            <Label text="Descripción" />
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Qué es, para qué sirve, qué incluye…"
              placeholderTextColor="#9CA3AF"
              className="min-h-[110px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </Block>

          <Block title="Categoría">
            <View className="flex-row flex-wrap gap-2">
              {topCategories.map((c) => (
                <Chip key={c.id} label={c.name} selected={selectedParent === c.id} onPress={() => setCategoryId(c.id)} />
              ))}
            </View>
            {selectedParent && childrenOf(selectedParent).length > 0 ? (
              <View className="flex-row flex-wrap gap-2">
                {childrenOf(selectedParent).map((c) => (
                  <Chip key={c.id} label={c.name} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
                ))}
              </View>
            ) : null}
          </Block>

          <Block title="Opciones (talla, color…)">
            <Text className="text-xs text-muted-foreground">Opcional. Escriba los valores separados por comas; se crea una variante por cada combinación.</Text>
            {options.map((o, i) => (
              <View key={i} className="gap-2 rounded-lg border border-border p-3">
                <View className="flex-row items-center gap-2">
                  <TextInput
                    value={o.name}
                    onChangeText={(t) => setOptions(options.map((x, j) => (j === i ? { ...x, name: t } : x)))}
                    placeholder="Nombre (ej.: Talla)"
                    placeholderTextColor="#9CA3AF"
                    className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-base text-foreground"
                  />
                  <Pressable onPress={() => setOptions(options.filter((_, j) => j !== i))} hitSlop={8}>
                    <Trash2 size={18} color="#DC2626" />
                  </Pressable>
                </View>
                <TextInput
                  value={o.values}
                  onChangeText={(t) => setOptions(options.map((x, j) => (j === i ? { ...x, values: t } : x)))}
                  placeholder="Valores (ej.: S, M, L)"
                  placeholderTextColor="#9CA3AF"
                  className="h-11 rounded-lg border border-input bg-card px-3 text-base text-foreground"
                />
              </View>
            ))}
            {options.length < MAX_OPTIONS ? (
              <Pressable onPress={() => setOptions([...options, { name: '', values: '' }])} className="flex-row items-center gap-1.5 self-start">
                <Plus size={16} color="#1976D2" />
                <Text className="text-sm font-semibold text-secondary">Añadir opción</Text>
              </Pressable>
            ) : null}
          </Block>

          <Block title={variants.length > 1 ? `Precio y stock (${variants.length} variantes)` : 'Precio y stock'}>
            <View className="flex-row items-center justify-between">
              <Text className="flex-1 text-sm text-foreground">Controlar stock</Text>
              <Switch value={trackInventory} onValueChange={setTrackInventory} />
            </View>
            {trackInventory ? (
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm text-foreground">Vender aunque no haya stock (por encargo)</Text>
                <Switch value={allowBackorder} onValueChange={setAllowBackorder} />
              </View>
            ) : null}
            {variants.map((v, i) => {
              const update = (patch: Partial<VariantRow>) => setVariants(variants.map((x, j) => (j === i ? { ...x, ...patch } : x)));
              return (
                <View key={keyOf(v.optionValues) || 'default'} className="gap-2 rounded-lg border border-border p-3">
                  {v.optionValues.length ? (
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-foreground">{v.optionValues.join(' / ')}</Text>
                      <Switch value={v.isActive} onValueChange={(isActive) => update({ isActive })} />
                    </View>
                  ) : null}
                  <View className="flex-row gap-2">
                    <View className="flex-1"><TextField label="Precio (XAF)" value={v.price} onChangeText={(price) => update({ price })} keyboardType="number-pad" /></View>
                    <View className="flex-1"><TextField label="Precio antes (opcional)" value={v.compareAtPrice} onChangeText={(compareAtPrice) => update({ compareAtPrice })} keyboardType="number-pad" /></View>
                  </View>
                  <View className="flex-row gap-2">
                    {trackInventory ? (
                      <View className="flex-1"><TextField label="Stock" value={v.stock} onChangeText={(stock) => update({ stock })} keyboardType="number-pad" /></View>
                    ) : null}
                    <View className="flex-1"><TextField label="Referencia (opcional)" value={v.sku} onChangeText={(sku) => update({ sku })} autoCapitalize="characters" /></View>
                  </View>
                </View>
              );
            })}
          </Block>

          <Block title="Características (opcional)">
            {specs.map((s, i) => (
              <View key={i} className="flex-row items-center gap-2">
                <TextInput
                  value={s.name}
                  onChangeText={(t) => setSpecs(specs.map((x, j) => (j === i ? { ...x, name: t } : x)))}
                  placeholder="Ej.: Memoria"
                  placeholderTextColor="#9CA3AF"
                  className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                />
                <TextInput
                  value={s.value}
                  onChangeText={(t) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: t } : x)))}
                  placeholder="Ej.: 128 GB"
                  placeholderTextColor="#9CA3AF"
                  className="h-11 flex-1 rounded-lg border border-input bg-card px-3 text-sm text-foreground"
                />
                <Pressable onPress={() => setSpecs(specs.filter((_, j) => j !== i))} hitSlop={8}>
                  <Trash2 size={18} color="#DC2626" />
                </Pressable>
              </View>
            ))}
            <Pressable onPress={() => setSpecs([...specs, { name: '', value: '' }])} className="flex-row items-center gap-1.5 self-start">
              <Plus size={16} color="#1976D2" />
              <Text className="text-sm font-semibold text-secondary">Añadir característica</Text>
            </Pressable>
            <TextField label="Etiquetas para la búsqueda (separadas por comas)" value={tags} onChangeText={setTags} autoCapitalize="none" />
          </Block>
        </ScrollView>

        <View className="flex-row gap-2 border-t border-border bg-card px-4 py-3">
          <Button variant="outline" className="flex-1" onPress={() => save.mutate('draft')} loading={save.isPending && save.variables === 'draft'} disabled={save.isPending}>
            Guardar borrador
          </Button>
          <Button className="flex-1" onPress={() => save.mutate('active')} loading={save.isPending && save.variables === 'active'} disabled={save.isPending}>
            Publicar
          </Button>
        </View>
      </KeyboardAware>
    </SafeAreaView>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function Label({ text }: { text: string }) {
  return <Text className="text-sm font-medium text-foreground">{text}</Text>;
}
