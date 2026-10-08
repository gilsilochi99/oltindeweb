import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MenuItemForm } from '../../../../src/components/business/MenuItemForm';
import { useAuth } from '../../../../src/hooks/use-auth';
import { useCompany, useMenuItemMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import type { MenuItemFormInput } from '../../../../src/lib/data';

export default function NewMenuItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { data: company, isLoading } = useCompany(id);
  const { create } = useMenuItemMutations(id);

  if (isLoading) return <LoadingState />;
  if (!company || !user) return <EmptyState title="No se pudo cargar el negocio" />;

  const handleSubmit = async (input: MenuItemFormInput) => {
    await create.mutateAsync({ company, ownerId: user.uid, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Nuevo producto' }} />
      <MenuItemForm companyId={id} submitLabel="Añadir al menú" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
