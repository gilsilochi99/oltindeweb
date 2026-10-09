import { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { Link } from 'expo-router';
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
  password: z.string().min(1, 'La contraseña es obligatoria.'),
});
type FormValues = z.infer<typeof schema>;

export default function SignInScreen() {
  const { signin, signInWithGoogle } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await signin(values.email, values.password);
    } catch (error: any) {
      Alert.alert('No se pudo iniciar sesión', error.message ?? 'Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const onGoogleSignIn = async () => {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('No se pudo iniciar sesión con Google', error.message ?? 'Inténtalo de nuevo.');
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10" keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/wordmark-logo.png')} style={{ width: 188, height: 48 }} resizeMode="contain" className="mb-8 self-center" accessibilityLabel="Oltinde" />
          <Text className="mb-1 text-center text-2xl font-semibold text-foreground">Bienvenido a Oltinde</Text>
          <Text className="mb-8 text-center text-base text-muted-foreground">Inicia sesión para continuar</Text>

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
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Contraseña"
                  secureTextEntry
                  autoComplete="password"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.password?.message}
                />
              )}
            />

            <Link href="/(auth)/reset-password" asChild>
              <Pressable>
                <Text className="text-right text-sm font-medium text-secondary">¿Olvidaste tu contraseña?</Text>
              </Pressable>
            </Link>

            <Button onPress={handleSubmit(onSubmit)} loading={submitting}>
              Iniciar sesión
            </Button>

            <Button variant="outline" onPress={onGoogleSignIn} loading={googleSubmitting}>
              Continuar con Google
            </Button>
          </View>

          <View className="mt-8 flex-row justify-center gap-1">
            <Text className="text-muted-foreground">¿No tienes cuenta?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable>
                <Text className="font-semibold text-secondary">Regístrate</Text>
              </Pressable>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}
