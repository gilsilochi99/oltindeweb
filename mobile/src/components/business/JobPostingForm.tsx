import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextField } from '../ui/TextField';
import { Button } from '../ui/Button';
import { Section } from '../ui/Section';
import { useSiteSettings } from '../../hooks/use-queries';
import type { AcademicLevel, EmploymentType, JobPosting } from '../../lib/types';
import type { JobPostingFormInput } from '../../lib/data';

const EMPLOYMENT_TYPES: EmploymentType[] = ['Tiempo completo', 'Medio tiempo', 'Contrato', 'Prácticas', 'Freelance'];
const ACADEMIC_LEVELS: AcademicLevel[] = [
  'Sin estudios formales',
  'Educación primaria',
  'Educación secundaria',
  'Formación Profesional',
  'Grado o Licenciatura',
  'Máster o Postgrado',
  'Doctorado',
];

const schema = z.object({
  title: z.string().min(2, 'Introduce un título.'),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres.'),
  sector: z.string().min(2, 'Introduce un sector.'),
  salaryRange: z.string().optional(),
  applicationValue: z.string().min(2, 'Introduce un email o enlace para aplicar.'),
  applicationInstructions: z.string().optional(),
  requirements: z.string().optional(),
  responsibilities: z.string().optional(),
  skills: z.string().optional(),
  deadline: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function toLines(text?: string): string[] {
  return (text ?? '')
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function Pill<T extends string>({ options, value, onChange }: { options: T[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2">
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => onChange(option)}
          className={`rounded-full border px-3.5 py-2 ${value === option ? 'border-primary bg-primary' : 'border-border bg-card'}`}
        >
          <Text className={`text-sm font-medium ${value === option ? 'text-primary-foreground' : 'text-foreground'}`}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

interface JobPostingFormProps {
  initialData?: JobPosting;
  submitLabel: string;
  onSubmit: (input: JobPostingFormInput) => Promise<void>;
}

export function JobPostingForm({ initialData, submitLabel, onSubmit }: JobPostingFormProps) {
  const { data: settings } = useSiteSettings();
  const [submitting, setSubmitting] = useState(false);
  const [city, setCity] = useState(initialData?.city ?? '');
  const [employmentType, setEmploymentType] = useState<EmploymentType | undefined>(initialData?.employmentType);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel | undefined>(initialData?.academicLevel);
  const [applicationMethod, setApplicationMethod] = useState<'email' | 'link'>(initialData?.applicationMethod ?? 'email');

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      sector: initialData?.sector ?? '',
      salaryRange: initialData?.salaryRange ?? '',
      applicationValue: initialData?.applicationValue ?? '',
      applicationInstructions: initialData?.applicationInstructions ?? '',
      requirements: (initialData?.requirements ?? []).join('\n'),
      responsibilities: (initialData?.responsibilities ?? []).join('\n'),
      skills: (initialData?.skills ?? []).join('\n'),
      deadline: initialData?.deadline ?? '',
    },
  });

  const submit = handleSubmit(async (values) => {
    if (!city || !employmentType) {
      Alert.alert('Faltan datos', 'Selecciona una ciudad y un tipo de empleo.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        sector: values.sector,
        city,
        employmentType,
        academicLevel,
        salaryRange: values.salaryRange,
        requirements: toLines(values.requirements),
        responsibilities: toLines(values.responsibilities),
        experience: [],
        skills: toLines(values.skills),
        applicationMethod,
        applicationValue: values.applicationValue,
        applicationInstructions: values.applicationInstructions,
        deadline: values.deadline,
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
      <Section title="Puesto">
        <View className="gap-4">
          <Controller
            control={control}
            name="title"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Título del puesto" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.title?.message} />
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
          <Controller
            control={control}
            name="sector"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Sector" placeholder="Hostelería, Construcción…" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.sector?.message} />
            )}
          />

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Ciudad</Text>
            <Pill options={settings?.cities ?? []} value={city || undefined} onChange={setCity} />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Tipo de empleo</Text>
            <Pill options={EMPLOYMENT_TYPES} value={employmentType} onChange={setEmploymentType} />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Nivel académico requerido (opcional)</Text>
            <Pill options={ACADEMIC_LEVELS} value={academicLevel} onChange={setAcademicLevel} />
          </View>

          <Controller
            control={control}
            name="salaryRange"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Rango salarial (opcional)" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
          <Controller
            control={control}
            name="deadline"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Fecha límite (opcional, AAAA-MM-DD)" value={value} onChangeText={onChange} onBlur={onBlur} />
            )}
          />
        </View>
      </Section>

      <Section title="Requisitos">
        <View className="gap-4">
          <Controller
            control={control}
            name="requirements"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Requisitos (uno por línea)"
                multiline
                style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="responsibilities"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Responsabilidades (una por línea)"
                multiline
                style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
          <Controller
            control={control}
            name="skills"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Habilidades (una por línea)"
                multiline
                style={{ height: 60, textAlignVertical: 'top', paddingTop: 10 }}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />
        </View>
      </Section>

      <Section title="Cómo aplicar">
        <View className="gap-4">
          <Pill options={['email', 'link'] as const} value={applicationMethod} onChange={setApplicationMethod} />
          <Controller
            control={control}
            name="applicationValue"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label={applicationMethod === 'email' ? 'Email para aplicar' : 'Enlace para aplicar'}
                autoCapitalize="none"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.applicationValue?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="applicationInstructions"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField label="Instrucciones adicionales (opcional)" value={value} onChangeText={onChange} onBlur={onBlur} />
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
    </KeyboardAvoidingView>
  );
}
