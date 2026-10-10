import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/use-auth';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';
import { WEB_APP_URL } from '../../src/lib/config';
import { openExternal } from '../../src/lib/links';

// Account deletion inside the app (required by the App Store and Google
// Play). Same server function as the website's profile page.
export default function DeleteAccountScreen() {
  const { user, deleteAccount } = useAuth();
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ready = confirm.trim().toUpperCase() === 'ELIMINAR';

  async function submit() {
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      await deleteAccount(confirm);
      // Signed out: the app shows the sign-in screen by itself.
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar la cuenta.');
      setBusy(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Eliminar mi cuenta' }} />
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-10" keyboardShouldPersistTaps="handled">
          <View className="gap-2">
            <Text className="text-xl font-semibold text-foreground">¿Quiere eliminar su cuenta?</Text>
            <Text className="text-[15px] leading-6 text-foreground/80">
              Se eliminará la cuenta {user?.email ? <Text className="font-semibold">{user.email}</Text> : null} de forma definitiva. No se puede deshacer.
            </Text>
          </View>

          <View className="gap-1.5 rounded-lg border border-border bg-card p-4">
            <Text className="text-sm font-semibold text-foreground">Se borra</Text>
            <Text className="text-sm leading-5 text-foreground/80">• Su cuenta y su perfil{'\n'}• Favoritos, suscripciones y notificaciones{'\n'}• Sus publicaciones, itinerarios y perfiles de profesional{'\n'}• Sus solicitudes de verificación y sus documentos</Text>
            <Text className="mt-2 text-sm font-semibold text-foreground">Se conserva</Text>
            <Text className="text-sm leading-5 text-foreground/80">• Sus reseñas, como «Usuario de Oltinde»{'\n'}• Sus empresas, publicadas pero sin gestor{'\n'}• Los pedidos y reservas ya hechos, el tiempo que exige la ley</Text>
            <Text className="mt-2 text-sm text-secondary underline" onPress={() => openExternal(`${WEB_APP_URL}/eliminar-cuenta`)}>
              Más información
            </Text>
          </View>

          <TextField
            label="Escriba ELIMINAR para confirmar"
            value={confirm}
            onChangeText={setConfirm}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!busy}
            error={error ?? undefined}
          />
          <Button variant="dark" onPress={submit} disabled={!ready} loading={busy}>
            Eliminar definitivamente
          </Button>
        </ScrollView>
      </KeyboardAware>
    </>
  );
}
