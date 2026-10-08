import { useEffect, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Star } from 'lucide-react-native';
import {
  canReplyToRentalReviews, getRentalReviewEligibility, getRentalReviews, replyToRentalReview, submitRentalReview,
} from '../../lib/rentals';
import { useAuth } from '../../hooks/use-auth';
import { Section } from '../ui/Section';
import { Button } from '../ui/Button';
import { StarRating } from '../ui/StarRating';

// Reviews of a rental listing: customers whose booking has ended can write
// one; the business can reply.
export function RentalReviewsSection({ listingId }: { listingId: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const reviews = useQuery({ queryKey: ['rentals', 'reviews', listingId], queryFn: () => getRentalReviews(listingId) });
  const eligibility = useQuery({ queryKey: ['rentals', 'reviewEligibility', listingId], queryFn: () => getRentalReviewEligibility(listingId), enabled: !!user });
  const canReply = useQuery({ queryKey: ['rentals', 'canReply', listingId], queryFn: () => canReplyToRentalReviews(listingId), enabled: !!user });

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reply, setReply] = useState('');

  useEffect(() => {
    const existing = eligibility.data?.existing;
    if (existing) {
      setRating(existing.rating);
      setComment(existing.comment);
    }
  }, [eligibility.data?.existing]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['rentals', 'reviews', listingId] });
    queryClient.invalidateQueries({ queryKey: ['rentals', 'listing'] });
  };
  const submit = useMutation({
    mutationFn: () => submitRentalReview(listingId, { rating, comment }),
    onSuccess: () => {
      refresh();
      Alert.alert('Gracias', 'Su valoración se ha publicado.');
    },
    onError: (e: Error) => Alert.alert('No se pudo publicar', e.message),
  });
  const sendReply = useMutation({
    mutationFn: (reviewId: string) => replyToRentalReview(reviewId, reply),
    onSuccess: () => {
      setReplyingTo(null);
      setReply('');
      refresh();
    },
    onError: (e: Error) => Alert.alert('No se pudo responder', e.message),
  });

  const data = reviews.data;
  return (
    <Section title={`Valoraciones${data?.count ? ` (${data.count})` : ''}`}>
      {data && data.count > 0 ? <StarRating rating={data.average} count={data.count} size={16} /> : null}

      {eligibility.data?.canReview ? (
        <View className="gap-2 rounded-lg border border-border bg-card p-3">
          <Text className="text-sm font-semibold text-foreground">{eligibility.data.existing ? 'Su valoración' : '¿Qué tal su experiencia?'}</Text>
          <View className="flex-row gap-1.5">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityLabel={`${n} estrellas`}>
                <Star size={28} color="#FFCD00" fill={n <= rating ? '#FFCD00' : 'transparent'} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Cuente cómo fue: estado, trato, puntualidad…"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[80px] rounded-lg border border-input bg-background p-3 text-sm text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
          <Button onPress={() => submit.mutate()} loading={submit.isPending} disabled={rating === 0 || comment.trim().length < 10}>
            Publicar valoración
          </Button>
        </View>
      ) : eligibility.data?.reason === 'not_stayed' && !canReply.data ? (
        <Text className="text-xs text-muted-foreground">Podrá valorar este alquiler cuando termine una reserva suya hecha en Oltinde.</Text>
      ) : null}

      {!data || data.reviews.length === 0 ? (
        <Text className="text-sm text-muted-foreground">Todavía no hay valoraciones.</Text>
      ) : (
        <View className="gap-3">
          {data.reviews.slice(0, 20).map((r) => (
            <View key={r.id} className="gap-1 rounded-lg border border-border bg-card p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{r.author}</Text>
                <View className="flex-row items-center gap-1">
                  <Star size={12} color="#FFCD00" fill="#FFCD00" />
                  <Text className="text-xs text-muted-foreground">{r.rating}</Text>
                </View>
              </View>
              <Text className="text-sm text-foreground">{r.comment}</Text>
              <Text className="text-xs text-muted-foreground">{format(new Date(r.date), "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
              {r.replyText ? (
                <View className="mt-1 gap-1 rounded-md bg-muted p-2">
                  <Text className="text-xs font-semibold text-foreground">Respuesta de la empresa</Text>
                  <Text className="text-xs text-foreground">{r.replyText}</Text>
                </View>
              ) : null}
              {canReply.data ? (
                replyingTo === r.id ? (
                  <View className="mt-1 gap-2">
                    <TextInput
                      value={reply}
                      onChangeText={setReply}
                      placeholder="Respuesta pública de la empresa"
                      placeholderTextColor="#9CA3AF"
                      multiline
                      className="min-h-[60px] rounded-lg border border-input bg-background p-2.5 text-sm text-foreground"
                      style={{ textAlignVertical: 'top' }}
                    />
                    <View className="flex-row gap-2">
                      <Button className="h-10 flex-1" onPress={() => sendReply.mutate(r.id)} loading={sendReply.isPending} disabled={reply.trim().length < 2}>Publicar</Button>
                      <Button className="h-10 flex-1" variant="ghost" onPress={() => setReplyingTo(null)}>Cancelar</Button>
                    </View>
                  </View>
                ) : (
                  <Pressable onPress={() => { setReplyingTo(r.id); setReply(r.replyText ?? ''); }} className="self-start pt-1">
                    <Text className="text-sm font-semibold text-secondary">{r.replyText ? 'Editar respuesta' : 'Responder'}</Text>
                  </Pressable>
                )
              ) : null}
            </View>
          ))}
        </View>
      )}
    </Section>
  );
}
