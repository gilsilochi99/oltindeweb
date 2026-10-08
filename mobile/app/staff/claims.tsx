import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePendingClaims, useProcessClaim } from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';

export default function ClaimsModerationScreen() {
  const { data: claims, isLoading } = usePendingClaims();
  const processClaim = useProcessClaim();

  const confirmReject = (claim: NonNullable<typeof claims>[number]) => {
    Alert.alert('Rechazar reclamación', `¿Rechazar la reclamación de ${claim.userName} para "${claim.companyName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Rechazar', style: 'destructive', onPress: () => processClaim.mutate({ claim, approve: false }) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Reclamaciones' }} />
      {isLoading ? (
        <LoadingState />
      ) : !claims || claims.length === 0 ? (
        <EmptyState title="Sin reclamaciones pendientes" description="Aquí aparecerán las reclamaciones de negocios por revisar." />
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {claims.map((claim) => (
            <View key={claim.id} className="gap-2 rounded-lg border border-border bg-card p-3.5">
              <Pressable onPress={() => router.push(`/companies/${claim.companyId}`)}>
                <Text className="text-sm font-bold text-secondary">{claim.companyName}</Text>
              </Pressable>
              <Text className="text-sm text-foreground">{claim.userName}</Text>
              <Text className="text-xs text-muted-foreground">{claim.userEmail}</Text>
              <Text className="text-xs text-muted-foreground">
                {format(new Date(claim.createdAt), "d 'de' MMMM, yyyy", { locale: es })}
              </Text>
              <View className="flex-row gap-2 pt-1">
                <View className="flex-1">
                  <Button
                    variant="outline"
                    loading={processClaim.isPending}
                    onPress={() => confirmReject(claim)}
                  >
                    Rechazar
                  </Button>
                </View>
                <View className="flex-1">
                  <Button loading={processClaim.isPending} onPress={() => processClaim.mutate({ claim, approve: true })}>
                    Aprobar
                  </Button>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
