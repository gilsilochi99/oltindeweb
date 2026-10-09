import { useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import type { Service } from '../../lib/types';
import type { ServiceFormInput } from '../../lib/data';
import { KeyboardAware } from '../ui/KeyboardAware';

const schema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio.'),
  category: z.string().min(2, 'La categoría es obligatoria.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
});
type FormValues = z.infer<typeof schema>;

interface ServiceFormProps {
  initialData?: Service;
  submitLabel: string;
  onSubmit: (input: ServiceFormInput) => Promise<void>;
}

export function ServiceForm({ initialData, submitLabel, onSubmit }: ServiceFormProps) {
  const [submitting, setSubmitting] = useState(false);
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
    },
  });

  const submit = handleSubmit(async (values) => {
    setSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error: any) {
      Alert.alert('No se pudo guardar', error?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="pb-10">
        <Section title="Servicio">
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Nombre" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
              )}
            />
            <Controller
              control={control}
              name="category"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Categoría"
                  placeholder="Ej: Electricidad, Fontanería…"
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
                  style={{ height: 90, textAlignVertical: 'top', paddingTop: 10 }}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.description?.message}
                />
              )}
            />
          </View>
        </Section>

        <View className="px-4 pt-2">
          <Button onPress={submit} loading={submitting}>
            {submitLabel}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAware>
  );
}
