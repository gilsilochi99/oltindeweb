import { useState } from 'react';
import { Alert, Image as RNImage, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ImageOff, UploadCloud } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { useSiteSettings } from '../../hooks/use-queries';
import { uploadImageAsync, randomId } from '../../lib/storage';
import type { Company, LegalForm } from '../../lib/types';
import type { CompanyFormInput } from '../../lib/data';
import { KeyboardAware } from '../ui/KeyboardAware';

const schema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  category: z.string().min(2, 'Introduce una categoría (ej. Restaurante, Taller...).'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  email: z.string().email('Correo electrónico no válido.'),
  website: z.string().optional(),
  whatsapp: z.string().optional(),
  facebook: z.string().optional(),
  instagram: z.string().optional(),
  twitter: z.string().optional(),
  linkedin: z.string().optional(),
  tiktok: z.string().optional(),
  branchName: z.string().min(2, 'Introduce un nombre de sucursal.'),
  address: z.string().min(5, 'La dirección parece demasiado corta.'),
  city: z.string().min(2, 'Selecciona una ciudad.'),
  phone: z.string().min(6, 'El teléfono parece demasiado corto.'),
  branchEmail: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

const DEFAULT_WORKING_HOURS = [
  { day: 'Lunes', hours: '09:00 - 17:00' },
  { day: 'Martes', hours: '09:00 - 17:00' },
  { day: 'Miércoles', hours: '09:00 - 17:00' },
  { day: 'Jueves', hours: '09:00 - 17:00' },
  { day: 'Viernes', hours: '09:00 - 17:00' },
  { day: 'Sábado', hours: 'Cerrado' },
  { day: 'Domingo', hours: 'Cerrado' },
];

const LEGAL_FORMS: LegalForm[] = [
  'Empresa Individual',
  'Sociedad de Responsabilidad Limitada (S.R.L.)',
  'Sociedad Anónima (S.A.)',
  'Sociedad Colectiva',
];

interface CompanyFormProps {
  initialData?: Company;
  submitLabel: string;
  onSubmit: (input: CompanyFormInput) => Promise<void>;
}

export function CompanyForm({ initialData, submitLabel, onSubmit }: CompanyFormProps) {
  const { data: settings } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [logo, setLogo] = useState<string | undefined>(initialData?.logo);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [workingHours, setWorkingHours] = useState(
    initialData?.branches?.[0]?.workingHours?.length ? initialData.branches[0].workingHours : DEFAULT_WORKING_HOURS,
  );
  const [legalForm, setLegalForm] = useState<LegalForm>(initialData?.legalForm || 'Empresa Individual');
  const [cif, setCif] = useState(initialData?.cif && initialData.cif !== 'N/A' ? initialData.cif : '');
  const [yearEstablished, setYearEstablished] = useState(
    initialData?.yearEstablished ? String(initialData.yearEstablished) : '',
  );

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      description: initialData?.description ?? '',
      email: initialData?.contact?.email ?? '',
      website: initialData?.contact?.website ?? '',
      whatsapp: initialData?.contact?.socialMedia?.whatsapp ?? '',
      facebook: initialData?.contact?.socialMedia?.facebook ?? '',
      instagram: initialData?.contact?.socialMedia?.instagram ?? '',
      twitter: initialData?.contact?.socialMedia?.twitter ?? '',
      linkedin: initialData?.contact?.socialMedia?.linkedin ?? '',
      tiktok: initialData?.contact?.socialMedia?.tiktok ?? '',
      branchName: initialData?.branches?.[0]?.name ?? 'Sucursal Principal',
      address: initialData?.branches?.[0]?.location?.address ?? '',
      city: initialData?.branches?.[0]?.location?.city ?? '',
      phone: initialData?.branches?.[0]?.contact?.phone ?? '',
      branchEmail: initialData?.branches?.[0]?.contact?.email ?? '',
    },
  });

  const pickLogo = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso necesario', 'Activa el acceso a tus fotos para subir un logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingLogo(true);
    try {
      const url = await uploadImageAsync(result.assets[0].uri, `companies/${initialData?.id ?? 'new'}/logo-${randomId()}.jpg`);
      setLogo(url);
    } catch {
      Alert.alert('Error', 'No se pudo subir la imagen. Inténtalo de nuevo.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        logo,
        workingHours,
        legalForm,
        cif: cif || undefined,
        yearEstablished: yearEstablished ? parseInt(yearEstablished, 10) : undefined,
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
      <Section title="Información principal">
        <View className="gap-4">
          <Pressable onPress={pickLogo} className="items-center gap-2">
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-lg bg-muted">
              {logo ? (
                <RNImage source={{ uri: logo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <ImageOff size={24} color="#C4C4C4" />
              )}
            </View>
            <View className="flex-row items-center gap-1.5">
              <UploadCloud size={14} color="#1976D2" />
              <Text className="text-sm font-medium text-secondary">{uploadingLogo ? 'Subiendo…' : 'Subir logo'}</Text>
            </View>
          </Pressable>

          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Nombre del negocio" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
            )}
          />
          <Controller
            control={control}
            name="category"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Categoría"
                placeholder="Restaurante, Taller, Consultoría…"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.category?.message}
              />
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
        </View>
      </Section>

      <Section title="Contacto">
        <View className="gap-4">
          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Email general"
                keyboardType="email-address"
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.email?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="website"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Sitio web (opcional)" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={control}
            name="whatsapp"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="WhatsApp (opcional)" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={control}
            name="facebook"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Facebook (opcional)" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={control}
            name="instagram"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Instagram (opcional)" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
        </View>
      </Section>

      <Section title="Sucursal principal">
        <View className="gap-4">
          <Controller
            control={control}
            name="branchName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Nombre de la sucursal" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.branchName?.message} />
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
            <Text className="text-sm font-medium text-foreground">Horario de apertura</Text>
            {workingHours.map((wh, i) => (
              <View key={wh.day} className="flex-row items-center gap-2">
                <Text className="w-20 text-sm text-muted-foreground">{wh.day}</Text>
                <View className="flex-1">
                  <TextField
                    value={wh.hours}
                    onChangeText={(text) =>
                      setWorkingHours((prev) => prev.map((d, idx) => (idx === i ? { ...d, hours: text } : d)))
                    }
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      </Section>

      <Section title="Identidad legal (opcional)">
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Forma jurídica</Text>
            <View className="flex-row flex-wrap gap-2">
              {LEGAL_FORMS.map((form) => (
                <Pressable
                  key={form}
                  onPress={() => setLegalForm(form)}
                  className={`rounded-full border px-3.5 py-2 ${legalForm === form ? 'border-primary bg-primary' : 'border-border bg-card'}`}
                >
                  <Text className={`text-sm font-medium ${legalForm === form ? 'text-primary-foreground' : 'text-foreground'}`}>{form}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <TextField label="CIF" value={cif} onChangeText={setCif} />
          <TextField label="Año de fundación" keyboardType="number-pad" value={yearEstablished} onChangeText={setYearEstablished} />
        </View>
      </Section>

      <View className="px-4 pt-2">
        <Button onPress={submit} loading={submitting || uploadingLogo}>
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
    </KeyboardAware>
  );
}
