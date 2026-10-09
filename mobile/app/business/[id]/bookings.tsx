import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarCheck, MessageCircle, Phone } from 'lucide-react-native';
import { BOOKING_STATUS_LABELS, addDaysIso, formatIsoDate, todayIsoGQ, unitLabel, type RentalBooking, type RentalBookingStatus } from '../../../src/lib/rentals';
import { formatXaf } from '../../../src/lib/shop';
import { getAdvertiserBookings, respondToBooking } from '../../../src/lib/business';
import { Chip } from '../../../src/components/ui/Rail';
import { ReasonModal } from '../../../src/components/ui/ReasonModal';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';

const FILTERS: (RentalBookingStatus | undefined)[] = ['pending', 'accepted', 'completed', 'rejected', 'cancelled', undefined];

export default function AdvertiserBookingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [filter, setFilter] = useState<RentalBookingStatus | undefined>('pending');
  const bookings = useQuery({ queryKey: ['advertiser', 'bookings', id, filter], queryFn: () => getAdvertiserBookings(id, filter) });
  const counts = bookings.data?.counts ?? {};

  return (
    <>
      <Stack.Screen options={{ title: 'Reservas de alquiler' }} />
      <View className="border-b border-border px-4 py-3">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          {FILTERS.map((f) => (
            <Chip
              key={f ?? 'all'}
              label={f ? `${BOOKING_STATUS_LABELS[f].replace(' de respuesta', 's')}${counts[f] ? ` (${counts[f]})` : ''}` : 'Todas'}
              selected={filter === f}
              onPress={() => setFilter(f)}
            />
          ))}
        </ScrollView>
      </View>
      {bookings.isLoading ? (
        <LoadingState />
      ) : (
        <FlatList
          data={bookings.data?.bookings ?? []}
          keyExtractor={(b) => b.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          renderItem={({ item }) => <AdvertiserBookingCard booking={item} />}
          refreshControl={<RefreshControl refreshing={bookings.isRefetching} onRefresh={() => bookings.refetch()} />}
          ListEmptyComponent={<EmptyState icon={CalendarCheck} title="No hay reservas" description="Las solicitudes de sus clientes aparecerán aquí." />}
        />
      )}
    </>
  );
}

function AdvertiserBookingCard({ booking: b }: { booking: RentalBooking }) {
  const queryClient = useQueryClient();
  const [asking, setAsking] = useState<'rejected' | 'cancelled' | null>(null);
  const respond = useMutation({
    mutationFn: ({ to, note }: { to: 'accepted' | 'rejected' | 'cancelled' | 'completed'; note?: string }) => respondToBooking(b.id, to, note),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['advertiser', 'bookings'] }),
    onError: (e: Error) => Alert.alert('No se pudo actualizar', e.message),
  });

  const today = todayIsoGQ();
  const finished = b.endDate <= addDaysIso(today, 1);
  const digits = b.customerPhone.replace(/[^\d]/g, '');

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4" style={{ elevation: 1 }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">Reserva {b.bookingNumber}</Text>
          <Text className="text-xs text-muted-foreground" numberOfLines={1}>{b.listingTitle}</Text>
        </View>
        <Text className="text-xs font-semibold text-foreground">{BOOKING_STATUS_LABELS[b.status]}</Text>
      </View>

      <View className="gap-0.5">
        <Text className="text-sm text-foreground">{formatIsoDate(b.startDate)} → {formatIsoDate(b.endDate)}</Text>
        <Text className="text-xs text-muted-foreground">
          {b.units} {b.term === 'short' ? unitLabel(b.category, b.units !== 1) : b.units === 1 ? 'mes' : 'meses'}
          {b.guests ? ` · ${b.guests} personas` : ''}{b.withDriver ? ' · con conductor' : ''}
        </Text>
        <Text className="text-base font-semibold text-foreground">{formatXaf(b.total)}</Text>
        {b.deposit > 0 ? <Text className="text-xs text-muted-foreground">Fianza: {formatXaf(b.deposit)}</Text> : null}
      </View>

      <View className="gap-1 border-t border-border pt-3">
        <Text className="text-sm font-semibold text-foreground">{b.customerName}</Text>
        {b.message ? <Text className="text-sm text-foreground">“{b.message}”</Text> : null}
        <View className="mt-1 flex-row gap-2">
          <Pressable onPress={() => Linking.openURL(`tel:${b.customerPhone.replace(/\s/g, '')}`)} className="flex-row items-center gap-1.5 rounded-lg border border-border px-3 py-2">
            <Phone size={14} color="#1A1C1C" />
            <Text className="text-xs font-semibold text-foreground">Llamar</Text>
          </Pressable>
          {digits.length >= 6 ? (
            <Pressable
              onPress={() => Linking.openURL(`https://wa.me/${digits}?text=${encodeURIComponent(`Hola ${b.customerName}, le escribimos sobre su reserva ${b.bookingNumber} (${b.listingTitle}) en Oltinde.`)}`)}
              className="flex-row items-center gap-1.5 rounded-lg px-3 py-2"
              style={{ backgroundColor: '#25D366' }}
            >
              <MessageCircle size={14} color="#fff" />
              <Text className="text-xs font-semibold text-white">WhatsApp</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {b.status === 'pending' ? (
        <View className="flex-row gap-2">
          <Pressable disabled={respond.isPending} onPress={() => respond.mutate({ to: 'accepted' })} className="flex-1 items-center rounded-lg bg-primary py-2.5">
            <Text className="text-sm font-semibold text-primary-foreground">Aceptar</Text>
          </Pressable>
          <Pressable disabled={respond.isPending} onPress={() => setAsking('rejected')} className="flex-1 items-center rounded-lg border border-destructive py-2.5">
            <Text className="text-sm font-semibold text-destructive">Rechazar</Text>
          </Pressable>
        </View>
      ) : b.status === 'accepted' ? (
        <View className="flex-row gap-2">
          {finished ? (
            <Pressable disabled={respond.isPending} onPress={() => respond.mutate({ to: 'completed' })} className="flex-1 items-center rounded-lg bg-primary py-2.5">
              <Text className="text-sm font-semibold text-primary-foreground">Marcar como finalizada</Text>
            </Pressable>
          ) : null}
          <Pressable disabled={respond.isPending} onPress={() => setAsking('cancelled')} className="flex-1 items-center rounded-lg border border-destructive py-2.5">
            <Text className="text-sm font-semibold text-destructive">Cancelar</Text>
          </Pressable>
        </View>
      ) : null}
      {b.ownerNote ? <Text className="text-xs text-muted-foreground">Su nota: {b.ownerNote}</Text> : null}
      {b.cancelReason ? <Text className="text-xs text-destructive">Motivo del cliente: {b.cancelReason}</Text> : null}

      <ReasonModal
        visible={asking !== null}
        title={asking === 'rejected' ? 'Rechazar la solicitud' : 'Cancelar la reserva'}
        description="El cliente recibirá un aviso con este motivo."
        options={['Fechas no disponibles', 'No disponible en esas condiciones', 'No pudimos contactar con usted']}
        confirmLabel={asking === 'rejected' ? 'Rechazar' : 'Cancelar reserva'}
        onClose={() => setAsking(null)}
        onConfirm={(note) => {
          const to = asking!;
          setAsking(null);
          respond.mutate({ to, note });
        }}
      />
    </View>
  );
}
