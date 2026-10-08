import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { CalendarDays, MapPin } from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useEvent, useCompany, useInstitution } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { ListCard } from '../../src/components/ui/ListCard';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: event, isLoading } = useEvent(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();
  const isCompanyOrganizer = event?.organizerType === 'company';
  const { data: organizerCompany } = useCompany(isCompanyOrganizer ? event?.organizerId ?? '' : '');
  const { data: organizerInstitution } = useInstitution(!isCompanyOrganizer ? event?.organizerId ?? '' : '');

  if (isLoading) return <LoadingState />;
  if (!event) return <EmptyState title="Evento no encontrado" />;

  const favorite = isFavorite('event', event.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('event', event.id) : addFavorite('event', event.id);
  };

  const register = () => {
    if (!event.registrationValue) return;
    if (event.registrationMethod === 'email') {
      Linking.openURL(`mailto:${event.registrationValue}?subject=${encodeURIComponent(`Inscripción: ${event.title}`)}`);
    } else {
      Linking.openURL(event.registrationValue);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: event.title }} />
      <ScrollView>
        <View className="gap-2 px-4 py-4">
          <Text className="text-2xl font-bold text-foreground">{event.title}</Text>
          <Text className="text-sm text-muted-foreground">Organiza {event.organizerName}</Text>
          <View className="flex-row flex-wrap gap-2 pt-1">
            <Badge label={event.category} />
            {event.status === 'cancelled' ? <Badge label="Cancelado" variant="outline" /> : null}
          </View>
        </View>

        <Section title="Fecha y lugar">
          <View className="gap-2">
            <View className="flex-row items-center gap-2">
              <CalendarDays size={16} color="#374151" />
              <Text className="text-sm text-foreground">
                Inicio: {format(new Date(event.startDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
              </Text>
            </View>
            {event.endDate ? (
              <View className="flex-row items-center gap-2">
                <CalendarDays size={16} color="#374151" />
                <Text className="text-sm text-foreground">
                  Fin: {format(new Date(event.endDate), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </Text>
              </View>
            ) : null}
            <View className="flex-row items-start gap-2">
              <MapPin size={16} color="#374151" />
              <Text className="flex-1 text-sm text-foreground">
                {event.address ? `${event.address}, ` : ''}
                {event.city}
              </Text>
            </View>
          </View>
        </Section>

        <Section title="Descripción">
          <Text className="text-sm leading-5 text-foreground">{event.description}</Text>
        </Section>

        {organizerCompany || organizerInstitution ? (
          <Section title="Organiza">
            <ListCard
              image={event.organizerLogo}
              title={event.organizerName}
              subtitle={organizerCompany?.category ?? organizerInstitution?.category}
              onPress={() =>
                router.push(
                  isCompanyOrganizer ? `/companies/${event.organizerId}` : `/institutions/${event.organizerId}`,
                )
              }
            />
          </Section>
        ) : null}

        <View className="gap-3 px-4 py-4">
          {event.registrationMethod !== 'none' && event.registrationValue ? (
            <Button onPress={register}>Inscribirse</Button>
          ) : (
            <Text className="text-center text-sm text-muted-foreground">
              Entrada libre, no se requiere registro
            </Text>
          )}
          <Button variant="outline" onPress={toggleFavorite}>
            {favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
