import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Star } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useAddReview } from '../../hooks/use-queries';
import type { ReviewableEntityType } from '../../lib/data';
import { Button } from './Button';
import { TextField } from './TextField';

interface ReviewFormProps {
  entityType: ReviewableEntityType;
  entityId: string;
}

// Mirrors src/components/shared/AddReviewForm.tsx — same star picker +
// comment flow, writing straight to Firestore since any signed-in user is
// allowed to append to a listing's `reviews` field (see firestore.rules).
export function ReviewForm({ entityType, entityId }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const mutation = useAddReview(entityType, entityId);

  if (!user) {
    return (
      <Pressable onPress={() => router.push('/(auth)/signin')} className="rounded-lg border border-border bg-card p-4">
        <Text className="text-center text-sm font-medium text-secondary">Inicia sesión para dejar tu reseña</Text>
      </Pressable>
    );
  }

  const submit = () => {
    if (rating === 0) {
      Alert.alert('Selecciona una calificación', 'Toca una estrella para calificar.');
      return;
    }
    if (!comment.trim()) {
      Alert.alert('Escribe un comentario', 'Comparte brevemente tu experiencia.');
      return;
    }
    mutation.mutate(
      { rating, comment: comment.trim(), userId: user.uid, authorName: user.displayName || 'Anónimo' },
      {
        onSuccess: () => {
          setRating(0);
          setComment('');
        },
        onError: () => Alert.alert('Error', 'No se pudo enviar tu reseña. Inténtalo de nuevo.'),
      },
    );
  };

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <Text className="text-sm font-semibold text-foreground">Deja tu reseña</Text>
      <View className="flex-row gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable key={i} onPress={() => setRating(i)} hitSlop={6}>
            <Star size={28} color="#FFB800" fill={i <= rating ? '#FFB800' : 'transparent'} />
          </Pressable>
        ))}
      </View>
      <TextField
        placeholder="Describe tu experiencia…"
        value={comment}
        onChangeText={setComment}
        multiline
        numberOfLines={3}
        style={{ height: 80, textAlignVertical: 'top', paddingTop: 10 }}
      />
      <Button onPress={submit} loading={mutation.isPending}>
        Enviar reseña
      </Button>
    </View>
  );
}
