import { useState } from 'react';
import { Alert, Image as RNImage, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageOff, Plus, Trash2, UploadCloud } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { uploadImageAsync, randomId } from '../../lib/storage';
import type { MenuItem, MenuItemOptionGroup } from '../../lib/types';
import type { MenuItemFormInput } from '../../lib/data';
import { KeyboardAware } from '../ui/KeyboardAware';

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: z.string().min(1, 'Añade una breve descripción.'),
  price: z.string().refine((v) => !isNaN(Number(v)) && Number(v) >= 0, 'Introduce un precio válido.'),
  foodType: z.string().min(2, 'Introduce una categoría (ej. Platos principales, Bebidas...).'),
});
type FormValues = z.infer<typeof schema>;

interface MenuItemFormProps {
  companyId: string;
  initialData?: MenuItem;
  submitLabel: string;
  onSubmit: (input: MenuItemFormInput) => Promise<void>;
}

export function MenuItemForm({ companyId, initialData, submitLabel, onSubmit }: MenuItemFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isMenuDelDia, setIsMenuDelDia] = useState(initialData?.isMenuDelDia ?? false);
  const [available, setAvailable] = useState(initialData?.available ?? true);
  const [groups, setGroups] = useState<MenuItemOptionGroup[]>(initialData?.optionGroups ?? []);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      price: initialData?.price ? String(initialData.price) : '',
      foodType: initialData?.foodType ?? '',
    },
  });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para subir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [4, 3] });
    if (result.canceled || !result.assets[0]) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri, `menu-items/${companyId}/${randomId()}.jpg`);
      setImage(url);
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, { id: randomId(), name: '', required: false, options: [] }]);
  };
  const removeGroup = (groupId: string) => setGroups((prev) => prev.filter((g) => g.id !== groupId));
  const updateGroup = (groupId: string, patch: Partial<MenuItemOptionGroup>) =>
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, ...patch } : g)));
  const addOption = (groupId: string) =>
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, options: [...g.options, { id: randomId(), name: '', priceDelta: 0 }] } : g)),
    );
  const removeOption = (groupId: string, optionId: string) =>
    setGroups((prev) => prev.map((g) => (g.id === groupId ? { ...g, options: g.options.filter((o) => o.id !== optionId) } : g)));
  const updateOption = (groupId: string, optionId: string, patch: Partial<MenuItemOptionGroup['options'][number]>) =>
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, options: g.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)) } : g,
      ),
    );

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name,
        description: values.description,
        price: Math.round(Number(values.price)),
        foodType: values.foodType,
        image,
        isMenuDelDia,
        available,
        optionGroups: groups
          .filter((g) => g.name.trim())
          .map((g) => ({ ...g, options: g.options.filter((o) => o.name.trim()) })),
      });
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAware className="flex-1">
    <ScrollView contentContainerClassName="pb-10">
      <Section title="Producto">
        <View className="gap-4">
          <Pressable onPress={pickImage} className="items-center gap-2">
            <View className="h-24 w-32 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {image ? (
                <RNImage source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <ImageOff size={22} color="#C4C4C4" />
              )}
            </View>
            <View className="flex-row items-center gap-1.5">
              <UploadCloud size={14} color="#1976D2" />
              <Text className="text-sm font-medium text-secondary">{uploadingImage ? 'Subiendo…' : 'Subir foto'}</Text>
            </View>
          </Pressable>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Nombre" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Descripción"
                multiline
                style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.description?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Precio (XAF)"
                keyboardType="number-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.price?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="foodType"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Categoría del menú"
                placeholder="Platos principales, Bebidas, Postres…"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.foodType?.message}
              />
            )}
          />

          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Menú del día</Text>
            <Switch value={isMenuDelDia} onValueChange={setIsMenuDelDia} />
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-sm font-medium text-foreground">Disponible</Text>
            <Switch value={available} onValueChange={setAvailable} />
          </View>
        </View>
      </Section>

      <Section title="Opciones (opcional)">
        <View className="gap-4">
          {groups.map((group) => (
            <View key={group.id} className="gap-3 rounded-lg border border-border bg-card p-3">
              <View className="flex-row items-center gap-2">
                <View className="flex-1">
                  <TextField
                    placeholder="Nombre del grupo (ej. Elige tu guarnición)"
                    value={group.name}
                    onChangeText={(text) => updateGroup(group.id, { name: text })}
                  />
                </View>
                <Pressable onPress={() => removeGroup(group.id)} className="h-10 w-10 items-center justify-center">
                  <Trash2 size={18} color="#EF4444" />
                </Pressable>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm text-muted-foreground">Obligatorio</Text>
                <Switch value={group.required} onValueChange={(v) => updateGroup(group.id, { required: v })} />
              </View>

              {group.options.map((option) => (
                <View key={option.id} className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <TextField
                      placeholder="Opción (ej. Papas fritas)"
                      value={option.name}
                      onChangeText={(text) => updateOption(group.id, option.id, { name: text })}
                    />
                  </View>
                  <View className="w-24">
                    <TextField
                      placeholder="+precio"
                      keyboardType="numeric"
                      value={option.priceDelta ? String(option.priceDelta) : ''}
                      onChangeText={(text) => updateOption(group.id, option.id, { priceDelta: Number(text) || 0 })}
                    />
                  </View>
                  <Pressable onPress={() => removeOption(group.id, option.id)} className="h-10 w-10 items-center justify-center">
                    <Trash2 size={16} color="#EF4444" />
                  </Pressable>
                </View>
              ))}

              <Pressable onPress={() => addOption(group.id)} className="flex-row items-center gap-1.5 self-start">
                <Plus size={14} color="#1976D2" />
                <Text className="text-sm font-medium text-secondary">Añadir opción</Text>
              </Pressable>
            </View>
          ))}

          <Pressable onPress={addGroup} className="flex-row items-center gap-1.5 self-start">
            <Plus size={16} color="#1976D2" />
            <Text className="text-sm font-medium text-secondary">Añadir grupo de opciones</Text>
          </Pressable>
        </View>
      </Section>

      <View className="px-4 pt-2">
        <Button onPress={submit} loading={submitting || uploadingImage}>
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
    </KeyboardAware>
  );
}
