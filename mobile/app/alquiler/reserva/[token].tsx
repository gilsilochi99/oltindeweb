import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react-native';
import { getBookingByToken } from '../../../src/lib/rentals';
import { BookingCard } from '../../../src/components/rentals/BookingCard';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

// Shown right after a booking request is sent.
export default function BookingSentScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const { data: booking, isLoading } = useQuery({
    queryKey: ['rentals', 'bookings', 'token', token],
    queryFn: () => getBookingByToken(token),
    enabled: !!token,
  });

  if (isLoading) return <LoadingState />;
  if (!booking) return <EmptyState title="Reserva no encontrada" />;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Solicitud enviada', headerBackVisible: false }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8">
        <View className="items-center gap-2 py-4">
          <CheckCircle2 size={52} color="#15803D" />
          <Text className="text-center text-xl font-extrabold text-foreground">Solicitud enviada</Text>
          <Text className="text-center text-sm text-muted-foreground">
            La empresa revisará su solicitud y le contactará. Las fechas quedan reservadas mientras tanto. Recibirá un aviso cuando la acepte o la rechace.
          </Text>
        </View>
        <BookingCard booking={booking} />
        <Button onPress={() => router.replace('/alquiler/reservas')}>Ver mis reservas</Button>
        <Button variant="outline" onPress={() => router.replace('/alquiler')}>Volver a Alquiler</Button>
      </ScrollView>
    </SafeAreaView>
  );
}
