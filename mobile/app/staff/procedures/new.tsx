import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { ProcedureForm } from '../../../src/components/staff/ProcedureForm';
import { useCreateProcedure } from '../../../src/hooks/use-queries';
import type { ProcedureFormInput } from '../../../src/lib/data';

export default function NewProcedureScreen() {
  const createProcedure = useCreateProcedure();

  const submit = async (input: ProcedureFormInput) => {
    await createProcedure.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nuevo trámite' }} />
      <ProcedureForm submitLabel="Crear trámite" onSubmit={submit} />
    </SafeAreaView>
  );
}
