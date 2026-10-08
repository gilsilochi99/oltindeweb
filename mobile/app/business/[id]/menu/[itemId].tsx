import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MenuItemForm } from '../../../../src/components/business/MenuItemForm';
import { useMenuItemsByCompany, useMenuItemMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import type { MenuItemFormInput } from '../../../../src/lib/data';

export default function EditMenuItemScreen() {
  const { id, itemId } = useLocalSearchParams<{ id: string; itemId: string }>();
  const { data: items, isLoading } = useMenuItemsByCompany(id);
  const { update } = useMenuItemMutations(id);
  const item = items?.find((i) => i.id === itemId);

  if (isLoading) return <LoadingState />;
  if (!item) return <EmptyState title="Producto no encontrado" />;

  const handleSubmit = async (input: MenuItemFormInput) => {
    await update.mutateAsync({ itemId, input });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Editar producto' }} />
      <MenuItemForm companyId={id} initialData={item} submitLabel="Guardar cambios" onSubmit={handleSubmit} />
    </SafeAreaView>
  );
}
