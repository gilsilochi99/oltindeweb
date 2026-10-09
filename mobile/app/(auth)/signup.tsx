import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/use-auth';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

const schema = z.object({
  displayName: z.string().min(2, 'Introduce tu nombre completo.'),
  email: z.string().email('Introduce un correo electrónico válido.'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
});
type FormValues = z.infer<typeof schema>;

export default function SignUpScreen() {
  const { signup } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { verificationEmailSent } = await signup(values.email, values.password, values.displayName);
      if (!verificationEmailSent) {
        Alert.alert('Cuenta creada', 'No pudimos enviar el correo de verificación, pero tu cuenta ya está lista.');
      }
    } catch (error: any) {
      Alert.alert('No se pudo crear la cuenta', error.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()} className="mb-6">
            <Text className="text-base font-medium text-secondary">← Volver</Text>
          </Pressable>

          <Text className="mb-1 text-2xl font-bold text-foreground">Crea tu cuenta</Text>
          <Text className="mb-8 text-base text-muted-foreground">Únete a Oltinde en unos segundos</Text>

          <View className="gap-4">
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Nombre completo"
                  autoComplete="name"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.displayName?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Correo electrónico"
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Contraseña"
                  secureTextEntry
                  autoComplete="password-new"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Button onPress={handleSubmit(onSubmit)} loading={submitting}>
              Crear cuenta
            </Button>
          </View>

          <View className="mt-8 flex-row justify-center gap-1">
            <Text className="text-muted-foreground">¿Ya tienes cuenta?</Text>
            <Link href="/(auth)/signin" asChild>
              <Pressable>
                <Text className="font-semibold text-secondary">Inicia sesión</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}
