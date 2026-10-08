import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { ServiceForm } from '../../../src/components/staff/ServiceForm';
import { useServices, useUpdateService } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { ServiceFormInput } from '../../../src/lib/data';

export default function EditServiceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: services, isLoading } = useServices();
  const updateService = useUpdateService(id);
  const service = services?.find((s) => s.id === id);

  if (isLoading) return <LoadingState />;
  if (!service) return <EmptyState title="Servicio no encontrado" />;

  const submit = async (input: ServiceFormInput) => {
    await updateService.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar servicio' }} />
      <ServiceForm initialData={service} submitLabel="Guardar cambios" onSubmit={submit} />
    </SafeAreaView>
  );
}
