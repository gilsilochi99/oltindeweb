import { useState } from 'react';
import { Alert, FlatList, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronDown, Trash2, X } from 'lucide-react-native';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { SearchInput } from '../ui/SearchInput';
import { useInstitutions } from '../../hooks/use-queries';
import type { Procedure } from '../../lib/types';
import type { ProcedureFormInput } from '../../lib/data';
import { KeyboardAware } from '../ui/KeyboardAware';

const schema = z.object({
  name: z.string().min(3, 'El nombre es obligatorio.'),
  description: z.string().min(10, 'La descripción es obligatoria.'),
  category: z.string().min(2, 'La categoría es obligatoria.'),
  cost: z.string().min(1, 'El costo es obligatorio.'),
  requirements: z.array(z.object({ value: z.string().min(1, 'Requisito vacío.') })).min(1, 'Añade al menos un requisito.'),
  steps: z
    .array(z.object({ description: z.string().min(3, 'Descripción obligatoria.'), location: z.string().min(2, 'Lugar obligatorio.') }))
    .min(1, 'Añade al menos un paso.'),
});
type FormValues = z.infer<typeof schema>;

interface ProcedureFormProps {
  initialData?: Procedure;
  submitLabel: string;
  onSubmit: (input: ProcedureFormInput) => Promise<void>;
}

export function ProcedureForm({ initialData, submitLabel, onSubmit }: ProcedureFormProps) {
  const { data: institutions } = useInstitutions();
  const [institutionId, setInstitutionId] = useState(initialData?.institutionId ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          description: initialData.description,
          category: initialData.category,
          cost: initialData.cost,
          requirements: initialData.requirements.map((r) => ({ value: r })),
          steps: initialData.steps.sort((a, b) => a.step - b.step).map((s) => ({ description: s.description, location: s.location })),
        }
      : { name: '', description: '', category: '', cost: '', requirements: [{ value: '' }], steps: [{ description: '', location: '' }] },
  });

  const reqArray = useFieldArray({ control, name: 'requirements' });
  const stepArray = useFieldArray({ control, name: 'steps' });

  const selectedInstitution = institutions?.find((i) => i.id === institutionId);
  const filteredInstitutions = (institutions ?? []).filter((i) =>
    i.name.toLowerCase().includes(institutionQuery.trim().toLowerCase()),
  );

  const submit = handleSubmit(async (values) => {
    if (!selectedInstitution) {
      Alert.alert('Falta la institución', 'Selecciona la institución responsable del trámite.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name,
        description: values.description,
        category: values.category,
        cost: values.cost,
        institutionId: selectedInstitution.id,
        institution: selectedInstitution.name,
        requirements: values.requirements.map((r) => r.value),
        steps: values.steps.map((s, i) => ({ step: i + 1, description: s.description, location: s.location })),
        documents: initialData?.documents ?? [],
      });
    } catch (error: any) {
      Alert.alert('No se pudo guardar el trámite', error?.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="pb-10">
        <Section title="Información del trámite">
          <View className="gap-4">
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField label="Nombre del trámite" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
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
                <TextField
                  label="Categoría"
                  placeholder="Ej: Documentación"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.category?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="cost"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Costo"
                  placeholder="Ej: 50.000 XAF o Gratuito"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.cost?.message}
                />
              )}
            />

            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Institución responsable</Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                className="h-12 flex-row items-center justify-between rounded-lg border border-input bg-card px-3"
              >
                <Text className={selectedInstitution ? 'text-base text-foreground' : 'text-base text-muted-foreground'}>
                  {selectedInstitution ? selectedInstitution.name : 'Seleccionar institución'}
                </Text>
                <ChevronDown size={18} color="#8A8A8A" />
              </Pressable>
            </View>
          </View>
        </Section>

        <Section title="Requisitos">
          <View className="gap-2.5">
            {reqArray.fields.map((field, index) => (
              <View key={field.id} className="flex-row items-center gap-2">
                <Controller
                  control={control}
                  name={`requirements.${index}.value`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <View className="flex-1">
                      <TextField value={value} onChangeText={onChange} onBlur={onBlur} error={errors.requirements?.[index]?.value?.message} />
                    </View>
                  )}
                />
                {reqArray.fields.length > 1 ? (
                  <Pressable onPress={() => reqArray.remove(index)} className="h-11 w-11 items-center justify-center">
                    <Trash2 size={18} color="#EF4444" />
                  </Pressable>
                ) : null}
              </View>
            ))}
            <Button variant="outline" onPress={() => reqArray.append({ value: '' })}>
              + Añadir requisito
            </Button>
            {errors.requirements?.root?.message ? <Text className="text-sm text-destructive">{errors.requirements.root.message}</Text> : null}
          </View>
        </Section>

        <Section title="Pasos">
          <View className="gap-4">
            {stepArray.fields.map((field, index) => (
              <View key={field.id} className="gap-3 rounded-lg border border-border p-3.5">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">Paso {index + 1}</Text>
                  {stepArray.fields.length > 1 ? (
                    <Pressable onPress={() => stepArray.remove(index)} className="h-9 w-9 items-center justify-center">
                      <Trash2 size={16} color="#EF4444" />
                    </Pressable>
                  ) : null}
                </View>
                <Controller
                  control={control}
                  name={`steps.${index}.description`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Descripción del paso"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.steps?.[index]?.description?.message}
                    />
                  )}
                />
                <Controller
                  control={control}
                  name={`steps.${index}.location`}
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Lugar"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.steps?.[index]?.location?.message}
                    />
                  )}
                />
              </View>
            ))}
            <Button variant="outline" onPress={() => stepArray.append({ description: '', location: '' })}>
              + Añadir paso
            </Button>
            {errors.steps?.root?.message ? <Text className="text-sm text-destructive">{errors.steps.root.message}</Text> : null}
          </View>
        </Section>

        <View className="px-4 pt-2">
          <Button onPress={submit} loading={submitting}>
            {submitLabel}
          </Button>
        </View>
      </ScrollView>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View className="flex-1 bg-background pt-16">
          <View className="flex-row items-center justify-between px-4 pb-3">
            <Text className="text-xl font-semibold text-foreground">Seleccionar institución</Text>
            <Pressable onPress={() => setPickerOpen(false)} hitSlop={8}>
              <X size={22} color="#1A1C1C" />
            </Pressable>
          </View>
          <View className="px-4 pb-3">
            <SearchInput placeholder="Buscar institución…" value={institutionQuery} onChangeText={setInstitutionQuery} autoFocus />
          </View>
          <FlatList
            data={filteredInstitutions}
            keyExtractor={(i) => i.id}
            contentContainerClassName="px-4 pb-8"
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  setInstitutionId(item.id);
                  setPickerOpen(false);
                  setInstitutionQuery('');
                }}
                className="border-b border-border py-3.5"
              >
                <Text className="text-base text-foreground">{item.name}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text className="py-8 text-center text-sm text-muted-foreground">Sin resultados.</Text>}
          />
        </View>
      </Modal>
    </KeyboardAware>
  );
}
