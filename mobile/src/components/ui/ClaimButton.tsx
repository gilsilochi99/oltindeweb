import { useState } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ShieldQuestion } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useCreateClaim } from '../../hooks/use-queries';
import { confirmClaimCode, getClaimOptions, requestClaimCode } from '../../lib/business';
import { Button } from './Button';

// Mirrors src/app/companies/[id]/_components/ClaimButton.tsx — shown only
// when a company has no owner yet. Fast way: a code emailed to the address
// already on the listing; otherwise a manual claim reviewed by staff.
export function ClaimButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const mutation = useCreateClaim();
  const options = useQuery({ queryKey: ['claimOptions', companyId], queryFn: () => getClaimOptions(companyId), enabled: !!user });
  const [claimed, setClaimed] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);

  if (!user || options.data?.canClaim === false) return null;
  const codeTo = options.data?.codeTo;

  const manual = () => {
    mutation.mutate(
      { companyId, companyName, userId: user.uid, userName: user.displayName || 'Usuario', userEmail: user.email || '' },
      {
        onSuccess: (result) => {
          if (result.success) setClaimed(true);
          Alert.alert(result.success ? 'Reclamación enviada' : 'No se pudo enviar', result.message);
        },
        onError: () => Alert.alert('Error', 'No se pudo enviar la reclamación. Inténtalo de nuevo.'),
      },
    );
  };

  const send = async () => {
    setBusy(true);
    try {
      const r = await requestClaimCode(companyId);
      setSentTo(r.sentTo ?? codeTo ?? '');
    } catch (e) {
      Alert.alert('No se pudo enviar', e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    setBusy(true);
    try {
      await confirmClaimCode(companyId, code);
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      queryClient.invalidateQueries({ queryKey: ['companiesByOwner'] });
      Alert.alert('¡Listo!', `Ya gestiona ${companyName}. Ahora puede pedir el sello de Negocio verificado.`, [
        { text: 'Ir a mi negocio', onPress: () => router.push(`/business/${companyId}`) },
      ]);
    } catch (e) {
      Alert.alert('Código no válido', e instanceof Error ? e.message : '');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <View className="items-center gap-2">
        <ShieldQuestion size={26} color="#1976D2" />
        <Text className="text-center text-sm font-semibold text-foreground">¿Es usted el dueño de este negocio?</Text>
        <Text className="text-center text-xs text-muted-foreground">Gestiónelo para actualizar su información y responder reseñas.</Text>
      </View>
      {codeTo ? (
        sentTo === null ? (
          <View className="gap-2">
            <Text className="text-center text-xs text-foreground">Le enviaremos un código al email de la empresa ({codeTo}).</Text>
            <Button onPress={send} loading={busy}>Enviar código</Button>
          </View>
        ) : (
          <View className="gap-2">
            <Text className="text-center text-xs text-foreground">Escriba el código de 6 cifras enviado a {sentTo}.</Text>
            <TextInput
              value={code}
              onChangeText={(t) => setCode(t.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              placeholder="123456"
              placeholderTextColor="#9CA3AF"
              className="h-12 rounded-lg border border-input bg-background px-3 text-center text-xl text-foreground"
              style={{ letterSpacing: 6 }}
            />
            <Button onPress={confirm} loading={busy} disabled={code.length !== 6}>Confirmar</Button>
            <Text className="text-center text-xs text-secondary underline" onPress={send}>No me ha llegado: enviar otro</Text>
          </View>
        )
      ) : null}
      <Button variant="outline" onPress={manual} loading={mutation.isPending} disabled={claimed}>
        {claimed ? 'Reclamación enviada' : codeTo ? 'No tengo acceso a ese correo' : 'Reclamar este negocio'}
      </Button>
    </View>
  );
}
