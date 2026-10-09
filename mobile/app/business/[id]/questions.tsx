import { useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageCircleQuestion } from 'lucide-react-native';
import { answerProductQuestion, getSellerQuestions, type SellerQuestion } from '../../../src/lib/business';
import { Button } from '../../../src/components/ui/Button';
import { Chip } from '../../../src/components/ui/Rail';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

// Customers' questions about the seller's products (web: shop/questions):
// unanswered first; answering notifies the customer.
export default function SellerQuestionsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [unansweredOnly, setUnansweredOnly] = useState(true);
  const questions = useQuery({
    queryKey: ['seller', 'questions', id, unansweredOnly],
    queryFn: () => getSellerQuestions(id, unansweredOnly),
  });

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: 'Preguntas de clientes' }} />
      <View className="flex-row gap-2 border-b border-border px-4 py-3">
        <Chip label="Sin responder" selected={unansweredOnly} onPress={() => setUnansweredOnly(true)} />
        <Chip label="Todas" selected={!unansweredOnly} onPress={() => setUnansweredOnly(false)} />
      </View>
      {questions.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={questions.data ?? []}
          keyExtractor={(q) => q.id}
          contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={questions.isRefetching} onRefresh={() => questions.refetch()} />}
          ListEmptyComponent={
            <EmptyState
              icon={MessageCircleQuestion}
              title={unansweredOnly ? 'No hay preguntas pendientes' : 'Todavía no hay preguntas'}
              description="Las preguntas de los clientes sobre sus productos aparecerán aquí."
            />
          }
          renderItem={({ item }) => <QuestionCard companyId={id} question={item} />}
        />
      )}
    </KeyboardAware>
  );
}

function QuestionCard({ companyId, question }: { companyId: string; question: SellerQuestion }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(!question.answer);
  const [answer, setAnswer] = useState(question.answer ?? '');
  const save = useMutation({
    mutationFn: () => answerProductQuestion(question.id, answer.trim()),
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['seller', 'questions', companyId] });
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  return (
    <View className="gap-2.5 rounded-lg border border-border bg-card p-4">
      <Text className="text-xs text-secondary" onPress={() => router.push(`/tienda/p/${question.productSlug}`)} numberOfLines={1}>
        {question.productTitle}
      </Text>
      <Text className="text-[15px] font-semibold text-foreground">{question.question}</Text>
      <Text className="text-xs text-muted-foreground">
        {question.authorName} · {new Date(question.createdAt).toLocaleDateString('es-ES')}
      </Text>
      {editing ? (
        <View className="gap-2">
          <TextInput
            value={answer}
            onChangeText={setAnswer}
            placeholder="Escriba su respuesta…"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[72px] rounded-lg border border-input bg-background p-3 text-sm text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
          <View className="flex-row gap-2">
            <Button className="flex-1" onPress={() => save.mutate()} loading={save.isPending} disabled={answer.trim().length < 2}>
              Responder
            </Button>
            {question.answer ? (
              <Button variant="ghost" onPress={() => { setAnswer(question.answer ?? ''); setEditing(false); }}>Cancelar</Button>
            ) : null}
          </View>
        </View>
      ) : (
        <View className="gap-1 rounded-md bg-muted p-3">
          <Text className="text-sm text-foreground">{question.answer}</Text>
          <Text className="text-xs font-semibold text-secondary" onPress={() => setEditing(true)}>Editar respuesta</Text>
        </View>
      )}
    </View>
  );
}
