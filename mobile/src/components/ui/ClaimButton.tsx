import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ShieldQuestion } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useCreateClaim } from '../../hooks/use-queries';
import { Button } from './Button';

// Mirrors src/app/companies/[id]/_components/ClaimButton.tsx — shown only
// when a company has no ownerId yet (see the guard where this is rendered).
export function ClaimButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const { user } = useAuth();
  const mutation = useCreateClaim();
  const [claimed, setClaimed] = useState(false);

  if (!user) return null;

  const submit = () => {
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

  return (
    <View className="items-center gap-2 rounded-lg border border-border bg-card p-4">
      <ShieldQuestion size={26} color="#1976D2" />
      <Text className="text-center text-sm font-semibold text-foreground">¿Es usted el propietario de este negocio?</Text>
      <Text className="text-center text-xs text-muted-foreground">
        Reclame este listado para actualizar su información y gestionar sus reseñas.
      </Text>
      <Button variant="outline" onPress={submit} loading={mutation.isPending} disabled={claimed}>
        {claimed ? 'Reclamación enviada' : 'Reclamar este negocio'}
      </Button>
    </View>
  );
}
