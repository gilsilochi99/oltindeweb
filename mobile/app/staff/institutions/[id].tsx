import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { InstitutionForm } from '../../../src/components/staff/InstitutionForm';
import { useInstitution, useUpdateInstitution } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { InstitutionFormInput } from '../../../src/lib/data';

export default function EditInstitutionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: institution, isLoading } = useInstitution(id);
  const updateInstitution = useUpdateInstitution(id);

  if (isLoading) return <LoadingState />;
  if (!institution) return <EmptyState title="Institución no encontrada" />;

  const submit = async (input: InstitutionFormInput) => {
    await updateInstitution.mutateAsync({ institution, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar institución' }} />
      <InstitutionForm initialData={institution} submitLabel="Guardar cambios" onSubmit={submit} />
    </SafeAreaView>
  );
}
