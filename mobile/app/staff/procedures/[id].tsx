import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ProcedureForm } from '../../../src/components/staff/ProcedureForm';
import { useProcedure, useUpdateProcedure } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { ProcedureFormInput } from '../../../src/lib/data';

export default function EditProcedureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: procedure, isLoading } = useProcedure(id);
  const updateProcedure = useUpdateProcedure(id);

  if (isLoading) return <LoadingState />;
  if (!procedure) return <EmptyState title="Trámite no encontrado" />;

  const submit = async (input: ProcedureFormInput) => {
    await updateProcedure.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar trámite' }} />
      <ProcedureForm initialData={procedure} submitLabel="Guardar cambios" onSubmit={submit} />
    </SafeAreaView>
  );
}
