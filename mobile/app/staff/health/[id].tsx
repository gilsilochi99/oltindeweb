import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { HealthFacilityForm } from '../../../src/components/staff/HealthFacilityForm';
import { useHealthFacility, useUpdateHealthFacility } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { HealthFacilityFormInput } from '../../../src/lib/data';

export default function EditHealthFacilityScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: facility, isLoading } = useHealthFacility(id);
  const updateFacility = useUpdateHealthFacility(id);

  if (isLoading) return <LoadingState />;
  if (!facility) return <EmptyState title="Centro no encontrado" />;

  const submit = async (input: HealthFacilityFormInput) => {
    await updateFacility.mutateAsync({ facility, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar centro de salud' }} />
      <HealthFacilityForm initialData={facility} submitLabel="Guardar cambios" onSubmit={submit} />
    </SafeAreaView>
  );
}
