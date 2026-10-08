import { FlatList, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck } from 'lucide-react-native';
import { getMyBookings } from '../../src/lib/rentals';
import { BookingCard } from '../../src/components/rentals/BookingCard';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';

export default function MyBookingsScreen() {
  const bookings = useQuery({ queryKey: ['rentals', 'bookings', 'mine'], queryFn: getMyBookings });

  return (
    <>
      <Stack.Screen options={{ title: 'Mis reservas' }} />
      {bookings.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={bookings.data ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          renderItem={({ item }) => <BookingCard booking={item} />}
          refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={() => bookings.refetch()} />}
          ListEmptyComponent={<EmptyState icon={CalendarCheck} title="Todavía no tiene reservas" description="Sus solicitudes de alquiler aparecerán aquí." />}
        />
      )}
    </>
  );
}
