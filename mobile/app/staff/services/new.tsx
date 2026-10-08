import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ServiceForm } from '../../../src/components/staff/ServiceForm';
import { useCreateService } from '../../../src/hooks/use-queries';
import type { ServiceFormInput } from '../../../src/lib/data';

export default function NewServiceScreen() {
  const createService = useCreateService();

  const submit = async (input: ServiceFormInput) => {
    await createService.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nuevo servicio' }} />
      <ServiceForm submitLabel="Crear servicio" onSubmit={submit} />
    </SafeAreaView>
  );
}
