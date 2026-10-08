import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { JobPostingForm } from '../../../../src/components/business/JobPostingForm';
import { useJobPostingsByCompany, useJobPostingMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import type { JobPostingFormInput } from '../../../../src/lib/data';

export default function EditJobScreen() {
  const { id, jobId } = useLocalSearchParams<{ id: string; jobId: string }>();
  const { data: jobs, isLoading } = useJobPostingsByCompany(id);
  const { update } = useJobPostingMutations(id);
  const job = jobs?.find((j) => j.id === jobId);

  if (isLoading) return <LoadingState />;
  if (!job) return <EmptyState title="Publicación no encontrada" />;

  const handleSubmit = async (input: JobPostingFormInput) => {
    await update.mutateAsync({ jobId, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar empleo' }} />
      <JobPostingForm initialData={job} submitLabel="Guardar cambios" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
