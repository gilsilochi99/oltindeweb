import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../../../../src/components/ui/TextField';
import { Button } from '../../../../src/components/ui/Button';
import { Section } from '../../../../src/components/ui/Section';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { useCompany, useCompanyEventMutations, useSiteSettings } from '../../../../src/hooks/use-queries';
import type { EventRegistrationMethod } from '../../../../src/lib/types';

const schema = z.object({
  title: z.string().min(2, 'Introduce un título.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  category: z.string().min(2, 'Introduce una categoría.'),
  address: z.string().optional(),
  startDate: z.string().min(10, 'Introduce fecha y hora (AAAA-MM-DD HH:mm).'),
  endDate: z.string().optional(),
  registrationValue: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function Pill<T extends string>({ options, labels, value, onChange }: { options: T[]; labels: Record<T, string>; value: T; onChange: (v: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-full border px-3.5 py-2 ${value === option ? 'border-primary bg-primary' : 'border-border bg-card'}`}
        >
          <Text className={`text-sm font-medium ${value === option ? 'text-primary-foreground' : 'text-foreground'}`}>{labels[option]}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const REGISTRATION_LABELS: Record<EventRegistrationMethod, string> = { none: 'Entrada libre', email: 'Por email', link: 'Enlace' };

export default function NewEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const { data: settings } = useSiteSettings();
  const { create } = useCompanyEventMutations(id);
  const [submitting, setSubmitting] = useState(false);
  const [city, setCity] = useState('');
  const [registrationMethod, setRegistrationMethod] = useState<EventRegistrationMethod>('none');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '', category: '', address: '', startDate: '', endDate: '', registrationValue: '' },
  });

  if (isLoading) return <LoadingState />;
  if (!company) return <EmptyState title="No se pudo cargar el negocio" />;

  const submit = handleSubmit(async (values) => {
    if (!city) {
      Alert.alert('Falta la ciudad', 'Selecciona una ciudad para el evento.');
      return;
    }
    const startDate = new Date(values.startDate.replace(' ', 'T'));
    if (isNaN(startDate.getTime())) {
      Alert.alert('Fecha no válida', 'Usa el formato AAAA-MM-DD HH:mm, ej. 2026-09-12 18:00.');
      return;
    }
    setSubmitting(true);
    try {
      await create.mutateAsync({
        company,
        input: {
          title: values.title,
          description: values.description,
          category: values.category,
          city,
          address: values.address,
          startDate: startDate.toISOString(),
          endDate: values.endDate ? new Date(values.endDate.replace(' ', 'T')).toISOString() : undefined,
          registrationMethod,
          registrationValue: values.registrationValue,
        },
      });
      router.back();
    } catch (error: any) {
      Alert.alert('No se pudo crear el evento', error?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nuevo evento' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="pb-10">
        <Section title="Evento">
          <View className="gap-4">
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Título" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
              )}
            />
            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Descripción"
                  multiline
                  style={{ height: 90, textAlignVertical: 'top', paddingTop: 10 }}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Categoría" placeholder="Networking, Cultural, Formación…" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.category?.message} />
              )}
            />
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Ciudad</Text>
              <Pill
                options={settings?.cities ?? []}
                labels={Object.fromEntries((settings?.cities ?? []).map((c) => [c, c]))}
                value={city}
                onChange={setCity}
              />
            </View>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Dirección (opcional)" value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
            <Controller
              control={control}
              name="startDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Fecha y hora de inicio (AAAA-MM-DD HH:mm)"
                  placeholder="2026-09-12 18:00"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.startDate?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="endDate"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Fecha y hora de fin (opcional)" placeholder="2026-09-12 21:00" value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Inscripción</Text>
              <Pill options={['none', 'email', 'link'] as const} labels={REGISTRATION_LABELS} value={registrationMethod} onChange={setRegistrationMethod} />
            </View>
            {registrationMethod !== 'none' ? (
              <Controller
                control={control}
                name="registrationValue"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label={registrationMethod === 'email' ? 'Email de inscripción' : 'Enlace de inscripción'}
                    autoCapitalize="none"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                  />
                )}
              />
            ) : null}
          </View>
        </Section>
        <View className="px-4 pt-2">
          <Button onPress={submit} loading={submitting}>
            Crear evento
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
