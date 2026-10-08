import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Plus, Trash2 } from 'lucide-react-native';
import { useEventsByCompany, useCompanyEventMutations } from '../../../../src/hooks/use-queries';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';
import { Button } from '../../../../src/components/ui/Button';

export default function EventsManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: events, isLoading } = useEventsByCompany(id);
  const { remove, toggleStatus } = useCompanyEventMutations(id);

  const confirmDelete = (eventId: string, title: string) => {
    Alert.alert('Eliminar evento', `¿Eliminar "${title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(eventId) },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Eventos',
          headerRight: () => (
            <Pressable onPress={() => router.push(`/business/${id}/events/new`)} hitSlop={8}>
              <Plus size={22} color="#1A1C1C" />
            </Pressable>
          ),
        }}
      />
      {isLoading ? (
        <LoadingState />
      ) : !events || events.length === 0 ? (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <EmptyState title="Todavía no has organizado eventos" description="Anuncia un evento para que aparezca en el calendario de Oltinde." />
          <Button onPress={() => router.push(`/business/${id}/events/new`)} className="px-8">
            Crear evento
          </Button>
        </View>
      ) : (
        <ScrollView contentContainerClassName="gap-2.5 p-4">
          {events.map((event) => (
            <View key={event.id} className="gap-2 rounded-lg border border-border bg-card p-3.5">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-sm font-bold text-foreground">{event.title}</Text>
                <View className={`rounded-full px-2.5 py-1 ${event.status === 'scheduled' ? 'bg-primary' : 'bg-muted'}`}>
                  <Text className={`text-xs font-semibold ${event.status === 'scheduled' ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    {event.status === 'scheduled' ? 'Programado' : 'Cancelado'}
                  </Text>
                </View>
              </View>
              <Text className="text-xs text-muted-foreground">
                {format(new Date(event.startDate), "d 'de' MMMM, HH:mm", { locale: es })} · {event.city}
              </Text>
              <View className="flex-row items-center gap-3 pt-1">
                <Pressable onPress={() => toggleStatus.mutate({ eventId: event.id, status: event.status })}>
                  <Text className="text-sm font-medium text-secondary">
                    {event.status === 'scheduled' ? 'Cancelar evento' : 'Reprogramar'}
                  </Text>
                </Pressable>
                <Pressable onPress={() => confirmDelete(event.id, event.title)} className="flex-row items-center gap-1">
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
