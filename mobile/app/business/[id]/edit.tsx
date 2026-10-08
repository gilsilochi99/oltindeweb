import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { CompanyForm } from '../../../src/components/business/CompanyForm';
import { useCompany, useUpdateCompany } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import type { CompanyFormInput } from '../../../src/lib/data';

export default function EditBusinessScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const updateCompany = useUpdateCompany(id);

  if (isLoading) return <LoadingState />;
  if (!company) return <EmptyState title="Negocio no encontrado" />;

  const handleSubmit = async (input: CompanyFormInput) => {
    await updateCompany.mutateAsync({ company, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar negocio' }} />
      <CompanyForm initialData={company} submitLabel="Guardar cambios" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
