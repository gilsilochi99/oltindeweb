import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { InstitutionForm } from '../../../src/components/staff/InstitutionForm';
import { useCreateInstitution } from '../../../src/hooks/use-queries';
import type { InstitutionFormInput } from '../../../src/lib/data';

export default function NewInstitutionScreen() {
  const createInstitution = useCreateInstitution();

  const submit = async (input: InstitutionFormInput) => {
    await createInstitution.mutateAsync(input);
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nueva institución' }} />
      <InstitutionForm submitLabel="Crear institución" onSubmit={submit} />
    </SafeAreaView>
  );
}
