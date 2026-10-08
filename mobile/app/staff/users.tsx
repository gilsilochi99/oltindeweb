import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useAllUsers, useUpdateUserRole, useToggleUserPremium } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { SearchInput } from '../../src/components/ui/SearchInput';
import { Badge } from '../../src/components/ui/Badge';
import type { AppUser } from '../../src/lib/types';

const ROLE_LABELS: Record<NonNullable<AppUser['role']>, string> = {
  admin: 'Admin',
  manager: 'Gestor',
  editor: 'Editor',
  pharmacist: 'Farmacéutico',
  user: 'Usuario',
};
const ROLE_ORDER: NonNullable<AppUser['role']>[] = ['user', 'pharmacist', 'editor', 'manager', 'admin'];

export default function UsersAdminScreen() {
  const { user: currentUser } = useAuth();
  const { data: users, isLoading } = useAllUsers();
  const updateRole = useUpdateUserRole();
  const togglePremium = useToggleUserPremium();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users ?? [];
    return (users ?? []).filter((u) => u.displayName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
  }, [users, query]);

  const changeRole = (targetUser: AppUser) => {
    if (targetUser.id === currentUser?.uid) {
      Alert.alert('No permitido', 'No puedes cambiar tu propio rol desde aquí.');
      return;
    }
    Alert.alert(
      'Cambiar rol',
      `${targetUser.displayName} — rol actual: ${ROLE_LABELS[targetUser.role ?? 'user']}`,
      [
        ...ROLE_ORDER.map((role) => ({
          text: ROLE_LABELS[role],
          onPress: () => updateRole.mutate({ userId: targetUser.id, role }),
        })),
        { text: 'Cancelar', style: 'cancel' as const },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Usuarios y roles' }} />
      <View className="px-4 pt-3">
        <SearchInput placeholder="Buscar por nombre o email…" value={query} onChangeText={setQuery} autoCapitalize="none" />
      </View>
      {isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => u.id}
          contentContainerClassName="gap-2.5 p-4"
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <View className="gap-2 rounded-lg border border-border bg-card p-3.5">
              <View className="flex-row items-start justify-between gap-2">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-foreground">{item.displayName}</Text>
                  <Text className="text-xs text-muted-foreground">{item.email}</Text>
                </View>
                <View className="flex-row gap-1.5">
                  <Badge label={ROLE_LABELS[item.role ?? 'user']} variant={item.role && item.role !== 'user' ? 'primary' : 'default'} />
                  {item.isPremium ? <Badge label="Premium" variant="outline" /> : null}
                </View>
              </View>
              <View className="flex-row items-center justify-between pt-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-sm text-foreground">Cuenta premium</Text>
                  <Switch
                    value={item.isPremium ?? false}
                    onValueChange={() => togglePremium.mutate({ userId: item.id, currentStatus: item.isPremium ?? false })}
                  />
                </View>
                <Pressable onPress={() => changeRole(item)} hitSlop={8}>
                  <Text className="text-sm font-medium text-secondary">Cambiar rol</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
