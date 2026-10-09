import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/use-auth';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

const schema = z.object({
  email: z.string().email('Introduce un correo electrónico válido.'),
});
type FormValues = z.infer<typeof schema>;

export default function ResetPasswordScreen() {
  const { resetPassword } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await resetPassword(values.email);
      setSent(true);
    } catch (error: any) {
      Alert.alert('No se pudo enviar el correo', error.message ?? 'Inténtalo de nuevo.');
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

          <Text className="mb-1 text-2xl font-semibold text-foreground">Restablecer contraseña</Text>
          <Text className="mb-8 text-base text-muted-foreground">
            Introduce tu correo y te enviaremos un enlace para restablecerla.
          </Text>

          {sent ? (
            <Text className="text-base text-foreground">
              Revisa tu bandeja de entrada para continuar con el restablecimiento.
            </Text>
          ) : (
            <View className="gap-4">
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
              <Button onPress={handleSubmit(onSubmit)} loading={submitting}>
                Enviar enlace
              </Button>
            </View>
          )}
        </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}
