import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { CompanyForm } from '../../src/components/business/CompanyForm';
import { useAuth } from '../../src/hooks/use-auth';
import { useCreateCompany } from '../../src/hooks/use-queries';
import type { CompanyFormInput } from '../../src/lib/data';

export default function NewBusinessScreen() {
  const { user } = useAuth();
  const createCompany = useCreateCompany();

  const handleSubmit = async (input: CompanyFormInput) => {
    if (!user) return;
    const id = await createCompany.mutateAsync({ input, ownerId: user.uid });
    router.replace(`/business/${id}`);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Añadir negocio' }} />
      <CompanyForm submitLabel="Crear negocio" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
