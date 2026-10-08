import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { HealthFacilityForm } from '../../../src/components/staff/HealthFacilityForm';
import { useCreateHealthFacility } from '../../../src/hooks/use-queries';
import type { HealthFacilityFormInput } from '../../../src/lib/data';

export default function NewHealthFacilityScreen() {
  const createFacility = useCreateHealthFacility();

  const submit = async (input: HealthFacilityFormInput) => {
    await createFacility.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nuevo centro de salud' }} />
      <HealthFacilityForm submitLabel="Crear centro" onSubmit={submit} />
    </SafeAreaView>
  );
}
