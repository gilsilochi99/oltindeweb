import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Pencil, Plus, Trash2, Zap } from 'lucide-react-native';
import { useAuth } from '../../../../src/hooks/use-auth';
import { useJobPostingsByCompany, useJobPostingMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { Button } from '../../../../src/components/ui/Button';

export default function JobsManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isPremium } = useAuth();
  const { data: jobs, isLoading } = useJobPostingsByCompany(id);
  const { remove, toggleStatus } = useJobPostingMutations(id);

  const confirmDelete = (jobId: string, title: string) => {
    Alert.alert('Eliminar publicación', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(jobId) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Empleos',
          headerRight: () =>
            isPremium ? (
              <Pressable onPress={() => router.push(`/business/${id}/jobs/new`)} hitSlop={8}>
                <Plus size={22} color="#1A1C1C" />
              </Pressable>
            ) : null,
        }}
      />
      {isLoading ? (
        <LoadingState />
      ) : !isPremium ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Zap size={28} color="#000" />
          </View>
          <Text className="text-center text-lg font-bold text-foreground">Publicar empleos es una función premium</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Actualiza tu cuenta a Premium para publicar ofertas de empleo desde tu negocio.
          </Text>
        </View>
      ) : !jobs || jobs.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <EmptyState title="Todavía no has publicado empleos" description="Publica una vacante para que los candidatos puedan aplicar." />
          <Button onPress={() => router.push(`/business/${id}/jobs/new`)} className="px-8">
            Publicar empleo
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {jobs.map((job) => (
            <View key={job.id} className="gap-2 rounded-lg border border-border bg-card p-3.5">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm font-bold text-foreground">{job.title}</Text>
                <View className={`rounded-full px-2.5 py-1 ${job.status === 'open' ? 'bg-primary' : 'bg-muted'}`}>
                  <Text className={`text-xs font-semibold ${job.status === 'open' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {job.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">{job.sector} · {job.city} · {job.employmentType}</Text>
              <View className="flex-row items-center gap-3 pt-1">
                <Pressable onPress={() => toggleStatus.mutate({ jobId: job.id, status: job.status })}>
                  <Text className="text-sm font-medium text-secondary">{job.status === 'open' ? 'Cerrar' : 'Reabrir'}</Text>
                </Pressable>
                <Pressable onPress={() => router.push(`/business/${id}/jobs/${job.id}`)} className="flex-row items-center gap-1">
                  <Pencil size={14} color="#374151" />
                  <Text className="text-sm text-foreground">Editar</Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(job.id, job.title)} className="flex-row items-center gap-1">
                  <Trash2 size={14} color="#EF4444" />
                  <Text className="text-sm text-destructive">Eliminar</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
