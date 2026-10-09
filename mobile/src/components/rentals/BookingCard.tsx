import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { ImageOff, Star } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BOOKING_STATUS_LABELS, addDaysIso, cancelMyBooking, formatIsoDate, todayIsoGQ, unitLabel, type RentalBooking, type RentalBookingStatus } from '../../lib/rentals';
import { absoluteUrl, formatXaf } from '../../lib/shop';

const STATUS_STYLE: Record<RentalBookingStatus, [string, string]> = {
  pending: ['bg-amber-100', 'text-amber-900'],
  accepted: ['bg-green-100', 'text-green-900'],
  rejected: ['bg-red-100', 'text-red-900'],
  cancelled: ['bg-red-100', 'text-red-900'],
  completed: ['bg-muted', 'text-muted-foreground'],
};

export function BookingCard({ booking }: { booking: RentalBooking }) {
  const queryClient = useQueryClient();
  const [bg, fg] = STATUS_STYLE[booking.status];
  const image = absoluteUrl(booking.listingImage);
  // Same rule as the server: the stay is over (finished, or last day passed).
  const ended = booking.status === 'completed' || (booking.status === 'accepted' && booking.endDate <= addDaysIso(todayIsoGQ(), 1));
  const cancellable = booking.status === 'pending' || (booking.status === 'accepted' && booking.startDate > todayIsoGQ());

  const cancel = useMutation({
    mutationFn: () => cancelMyBooking(booking.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['rentals', 'bookings'] }),
    onError: (e: Error) => Alert.alert('No se pudo cancelar', e.message),
  });

  const confirmCancel = () =>
    Alert.alert('Cancelar reserva', `¿Cancelar la reserva ${booking.bookingNumber}?`, [
      { text: 'No' },
      { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancel.mutate() },
    ]);

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4" style={{ elevation: 1 }}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <Text className="text-base font-semibold text-foreground">Reserva {booking.bookingNumber}</Text>
          {booking.companyName ? <Text className="text-xs text-muted-foreground">{booking.companyName}</Text> : null}
        </View>
        <View className={`rounded-full px-2.5 py-1 ${bg}`}>
          <Text className={`text-xs font-semibold ${fg}`}>{BOOKING_STATUS_LABELS[booking.status]}</Text>
        </View>
      </View>

      <Pressable
        disabled={!booking.listingSlug}
        onPress={() => booking.listingSlug && router.push(`/alquiler/${booking.listingSlug}`)}
        className="flex-row items-center gap-3"
      >
        <View className="h-14 w-14 items-center justify-center overflow-hidden rounded-lg bg-muted">
          {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <ImageOff size={16} color="#C4C4C4" />}
        </View>
        <View className="flex-1">
          <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{booking.listingTitle}</Text>
          <Text className="text-xs text-muted-foreground">
            {formatIsoDate(booking.startDate)} → {formatIsoDate(booking.endDate)}
          </Text>
        </View>
      </Pressable>

      <View className="gap-0.5 border-t border-border pt-3">
        <Text className="text-xs text-muted-foreground">
          {booking.units} {booking.term === 'short' ? unitLabel(booking.category, booking.units !== 1) : booking.units === 1 ? 'mes' : 'meses'} × {formatXaf(booking.unitPrice)}
          {booking.withDriver ? ' · con conductor' : ''}
        </Text>
        <Text className="text-base font-semibold text-foreground">Total: {formatXaf(booking.total)}</Text>
        {booking.deposit > 0 ? <Text className="text-xs text-muted-foreground">Fianza: {formatXaf(booking.deposit)}</Text> : null}
        {booking.ownerNote ? <Text className="mt-1 text-sm text-foreground">Mensaje de la empresa: {booking.ownerNote}</Text> : null}
        {booking.status === 'cancelled' && booking.cancelReason ? (
          <Text className="text-xs text-destructive">Motivo de la cancelación: {booking.cancelReason}</Text>
        ) : null}
      </View>

      {ended && booking.listingSlug ? (
        <Pressable onPress={() => router.push(`/alquiler/${booking.listingSlug}`)} className="flex-row items-center gap-1.5 self-start">
          <Star size={15} color="#B38F00" fill="#FFCD00" />
          <Text className="text-sm font-semibold text-secondary">Valorar este alquiler</Text>
        </Pressable>
      ) : null}

      {cancellable ? (
        <Pressable onPress={confirmCancel} disabled={cancel.isPending} className="self-start">
          <Text className="text-sm font-semibold text-destructive">{cancel.isPending ? 'Cancelando…' : 'Cancelar reserva'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
