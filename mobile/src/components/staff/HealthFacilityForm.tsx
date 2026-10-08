import { useState } from 'react';
import { Alert, Image as RNImage, KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageOff, Trash2, UploadCloud } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { useSiteSettings } from '../../hooks/use-queries';
import { uploadImageAsync, randomId } from '../../lib/storage';
import type { HealthFacility, HealthFacilityType } from '../../lib/types';
import type { HealthFacilityFormInput } from '../../lib/data';

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  whatsapp: z.string().optional(),
  services: z.array(z.object({ value: z.string().min(1, 'Servicio vacío.') })).min(1, 'Añade al menos un servicio.'),
  specialties: z.array(z.object({ value: z.string().min(1, 'Especialidad vacía.') })),
  branchName: z.string().min(2, 'Introduce un nombre de sede.'),
  address: z.string().min(5, 'La dirección parece demasiado corta.'),
  city: z.string().min(2, 'Selecciona una ciudad.'),
  phone: z.string().min(6, 'El teléfono parece demasiado corto.'),
  branchEmail: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULT_WORKING_HOURS = [
  { day: 'Lunes', hours: '08:00 - 20:00' },
  { day: 'Martes', hours: '08:00 - 20:00' },
  { day: 'Miércoles', hours: '08:00 - 20:00' },
  { day: 'Jueves', hours: '08:00 - 20:00' },
  { day: 'Viernes', hours: '08:00 - 20:00' },
  { day: 'Sábado', hours: '09:00 - 14:00' },
  { day: 'Domingo', hours: 'Cerrado' },
];

const TYPE_OPTIONS: { value: HealthFacilityType; label: string }[] = [
  { value: 'hospital', label: 'Hospital' },
  { value: 'clinic', label: 'Clínica' },
  { value: 'pharmacy', label: 'Farmacia' },
];

const OWNERSHIP_OPTIONS: { value: 'public' | 'private'; label: string }[] = [
  { value: 'public', label: 'Pública' },
  { value: 'private', label: 'Privada' },
];

interface HealthFacilityFormProps {
  initialData?: HealthFacility;
  submitLabel: string;
  onSubmit: (input: HealthFacilityFormInput) => Promise<void>;
}

export function HealthFacilityForm({ initialData, submitLabel, onSubmit }: HealthFacilityFormProps) {
  const { data: settings } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [image, setImage] = useState<string | undefined>(initialData?.image);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [type, setType] = useState<HealthFacilityType>(initialData?.type ?? 'hospital');
  const [ownership, setOwnership] = useState<'public' | 'private'>(initialData?.ownership ?? 'public');
  const [emergencyServices, setEmergencyServices] = useState(initialData?.emergencyServices ?? false);
  const [workingHours, setWorkingHours] = useState(
    initialData?.branches?.[0]?.workingHours?.length ? initialData.branches[0].workingHours : DEFAULT_WORKING_HOURS,
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      description: initialData?.description ?? '',
      whatsapp: initialData?.contact?.whatsapp ?? '',
      services: initialData?.services?.length ? initialData.services.map((s) => ({ value: s })) : [{ value: '' }],
      specialties: initialData?.specialties?.length ? initialData.specialties.map((s) => ({ value: s })) : [],
      branchName: initialData?.branches?.[0]?.name ?? 'Sede Principal',
      address: initialData?.branches?.[0]?.location?.address ?? '',
      city: initialData?.branches?.[0]?.location?.city ?? '',
      phone: initialData?.branches?.[0]?.contact?.phone ?? '',
      branchEmail: initialData?.branches?.[0]?.contact?.email ?? '',
    },
  });

  const servicesArray = useFieldArray({ control, name: 'services' });
  const specialtiesArray = useFieldArray({ control, name: 'specialties' });

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para subir una imagen.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [1, 1] });
    if (result.canceled || !result.assets[0]) return;
    setUploadingImage(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri, `health-facilities/${initialData?.id ?? 'new'}/image-${randomId()}.jpg`);
      setImage(url);
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploadingImage(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit({
        type,
        name: values.name,
        ownership,
        description: values.description,
        services: values.services.map((s) => s.value),
        specialties: values.specialties.map((s) => s.value),
        emergencyServices,
        whatsapp: values.whatsapp,
        image,
        branchName: values.branchName,
        address: values.address,
        city: values.city,
        phone: values.phone,
        branchEmail: values.branchEmail || '',
        workingHours,
      });
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="pb-10">
        <Section title="Información principal">
          <View className="gap-4">
            <Pressable onPress={pickImage} className="items-center gap-2">
              <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
                {image ? (
                  <RNImage source={{ uri: image }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <ImageOff size={24} color="#C4C4C4" />
                )}
              </View>
              <View className="flex-row items-center gap-1.5">
                <UploadCloud size={14} color="#1976D2" />
                <Text className="text-sm font-medium text-secondary">{uploadingImage ? 'Subiendo…' : 'Subir imagen'}</Text>
              </View>
            </Pressable>

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Tipo</Text>
              <View className="flex-row flex-wrap gap-2">
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setType(opt.value)}
                    className={`rounded-full border px-3.5 py-2 ${type === opt.value ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                  >
                    <Text className={`text-sm font-medium ${type === opt.value ? 'text-primary-foreground' : 'text-foreground'}`}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

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
                  style={{ height: 100, textAlignVertical: 'top', paddingTop: 10 }}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                />
              )}
            />

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Propiedad</Text>
              <View className="flex-row flex-wrap gap-2">
                {OWNERSHIP_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    onPress={() => setOwnership(opt.value)}
                    className={`rounded-full border px-3.5 py-2 ${ownership === opt.value ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                  >
                    <Text className={`text-sm font-medium ${ownership === opt.value ? 'text-primary-foreground' : 'text-foreground'}`}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="flex-row items-center justify-between rounded-lg border border-border p-3.5">
              <Text className="text-sm font-medium text-foreground">Servicio de urgencias</Text>
              <Switch value={emergencyServices} onValueChange={setEmergencyServices} />
            </View>

            <Controller
              control={control}
              name="whatsapp"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="WhatsApp (opcional)" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
          </View>
        </Section>

        <Section title="Servicios">
          <View className="gap-2.5">
            {servicesArray.fields.map((field, index) => (
              <View key={field.id} className="flex-row items-center gap-2">
                <Controller
                  control={control}
                  name={`services.${index}.value`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="flex-1">
                      <TextField value={value} onChangeText={onChange} onBlur={onBlur} error={errors.services?.[index]?.value?.message} />
                    </View>
                  )}
                />
                {servicesArray.fields.length > 1 ? (
                  <Pressable onPress={() => servicesArray.remove(index)} className="h-11 w-11 items-center justify-center">
                    <Trash2 size={18} color="#EF4444" />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Button variant="outline" onPress={() => servicesArray.append({ value: '' })}>
              + Añadir servicio
            </Button>
          </View>
        </Section>

        <Section title="Especialidades (opcional)">
          <View className="gap-2.5">
            {specialtiesArray.fields.map((field, index) => (
              <View key={field.id} className="flex-row items-center gap-2">
                <Controller
                  control={control}
                  name={`specialties.${index}.value`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="flex-1">
                      <TextField value={value} onChangeText={onChange} onBlur={onBlur} />
                    </View>
                  )}
                />
                <Pressable onPress={() => specialtiesArray.remove(index)} className="h-11 w-11 items-center justify-center">
                  <Trash2 size={18} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            <Button variant="outline" onPress={() => specialtiesArray.append({ value: '' })}>
              + Añadir especialidad
            </Button>
          </View>
        </Section>

        <Section title="Sede principal">
          <View className="gap-4">
            <Controller
              control={control}
              name="branchName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Nombre de la sede" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.branchName?.message} />
              )}
            />
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Dirección" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.address?.message} />
              )}
            />
            <Controller
              control={control}
              name="city"
              render={({ field: { onChange, value } }) => (
                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">Ciudad</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {(settings?.cities ?? []).map((city) => (
                      <Pressable
                        key={city}
                        onPress={() => onChange(city)}
                        className={`rounded-full border px-3.5 py-2 ${value === city ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                      >
                        <Text className={`text-sm font-medium ${value === city ? 'text-primary-foreground' : 'text-foreground'}`}>{city}</Text>
                      </Pressable>
                    ))}
                  </View>
                  {errors.city ? <Text className="text-sm text-destructive">{errors.city.message}</Text> : null}
                </View>
              )}
            />
            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Teléfono" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.phone?.message} />
              )}
            />

            <View className="gap-2">
              <Text className="text-sm font-medium text-foreground">Horario de atención</Text>
              {workingHours.map((wh, i) => (
                <View key={wh.day} className="flex-row items-center gap-2">
                  <Text className="w-20 text-sm text-muted-foreground">{wh.day}</Text>
                  <View className="flex-1">
                    <TextField
                      value={wh.hours}
                      onChangeText={(text) => setWorkingHours((prev) => prev.map((d, idx) => (idx === i ? { ...d, hours: text } : d)))}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </Section>

        <View className="px-4 pt-2">
          <Button onPress={submit} loading={submitting || uploadingImage}>
            {submitLabel}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
