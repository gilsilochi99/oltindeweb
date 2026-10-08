import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { JobPostingForm } from '../../../../src/components/business/JobPostingForm';
import { useAuth } from '../../../../src/hooks/use-auth';
import { useCompany, useJobPostingMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import type { JobPostingFormInput } from '../../../../src/lib/data';

export default function NewJobScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: company, isLoading } = useCompany(id);
  const { create } = useJobPostingMutations(id);

  if (isLoading) return <LoadingState />;
  if (!company || !user) return <EmptyState title="No se pudo cargar el negocio" />;

  const handleSubmit = async (input: JobPostingFormInput) => {
    await create.mutateAsync({ company, ownerId: user.uid, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Publicar empleo' }} />
      <JobPostingForm submitLabel="Publicar empleo" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
