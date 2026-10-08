import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { usePost, useAddPostComment } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { stripHtml } from '../../src/lib/strip-html';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Badge } from '../../src/components/ui/Badge';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: post, isLoading } = usePost(id);
  const { user } = useAuth();
  const addComment = useAddPostComment(id);
  const [comment, setComment] = useState('');

  if (isLoading) return <LoadingState />;
  if (!post) return <EmptyState title="Contribución no encontrada" />;

  const submitComment = () => {
    if (!comment.trim()) return;
    addComment.mutate(
      { comment: comment.trim(), userId: user!.uid, authorName: user!.displayName || 'Anónimo' },
      {
        onSuccess: () => setComment(''),
        onError: () => Alert.alert('Error', 'No se pudo publicar tu comentario. Inténtalo de nuevo.'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: post.title }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView>
        {post.featuredImage ? (
          <View>
            <View className="h-52 w-full bg-muted">
              <Image source={{ uri: post.featuredImage }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </View>
            {post.imageDescription ? (
              <Text className="px-4 pt-1 text-xs italic text-muted-foreground">{post.imageDescription}</Text>
            ) : null}
          </View>
        ) : null}
        <View className="gap-2 px-4 py-4">
          {post.category ? <Badge label={post.category} /> : null}
          <Text className="text-2xl font-bold text-foreground">{post.title}</Text>
          {post.excerpt ? <Text className="text-sm font-medium text-muted-foreground">{post.excerpt}</Text> : null}
          <Text className="text-sm text-muted-foreground">
            {post.authorName} · {format(new Date(post.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
          <Text className="text-sm leading-6 text-foreground">{stripHtml(post.content)}</Text>
        </View>

        <Section title={`Comentarios (${post.comments?.length ?? 0})`}>
          <View className="gap-4">
            {user ? (
              <View className="gap-2">
                <TextField
                  placeholder="Escribe un comentario…"
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  style={{ height: 70, textAlignVertical: 'top', paddingTop: 10 }}
                />
                <Button onPress={submitComment} loading={addComment.isPending} disabled={!comment.trim()}>
                  Comentar
                </Button>
              </View>
            ) : (
              <Button variant="outline" onPress={() => router.push('/(auth)/signin')}>
                Inicia sesión para comentar
              </Button>
            )}

            {post.comments && post.comments.length > 0 ? (
              <View className="gap-3">
                {post.comments.map((c) => (
                  <View key={c.id} className="gap-1 rounded-lg border border-border bg-card p-3">
                    <Text className="text-sm font-semibold text-foreground">{c.authorName}</Text>
                    <Text className="text-sm text-foreground">{c.comment}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground">Todavía no hay comentarios.</Text>
            )}
          </View>
        </Section>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
