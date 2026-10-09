import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { CheckCircle2, Download, Heart } from 'lucide-react-native';
import { useProcedure } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { ReviewForm } from '../../src/components/ui/ReviewForm';
import { Badge } from '../../src/components/ui/Badge';

export default function ProcedureDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: procedure, isLoading } = useProcedure(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!procedure) return <EmptyState title="Trámite no encontrado" />;

  const favorite = isFavorite('procedure', procedure.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('procedure', procedure.id) : addFavorite('procedure', procedure.id);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: procedure.name }} />
      <ScrollView>
        <View className="gap-2 px-4 py-4">
          <View className="flex-row items-start justify-between gap-2">
            <Text className="flex-1 text-2xl font-semibold text-foreground">{procedure.name}</Text>
            <Pressable onPress={toggleFavorite} className="h-10 w-10 items-center justify-center">
              <Heart size={22} color="#E11D48" fill={favorite ? '#E11D48' : 'transparent'} />
            </Pressable>
          </View>
          <View className="flex-row flex-wrap items-center gap-2">
            <Badge label={procedure.category} />
            <Pressable onPress={() => router.push(`/institutions/${procedure.institutionId}`)}>
              <Badge label={procedure.institution} variant="outline" />
            </Pressable>
          </View>
        </View>

        <Section title="Descripción">
          <Text className="text-sm leading-5 text-foreground">{procedure.description}</Text>
        </Section>

        <Section title="Costo">
          <Text className="text-sm font-semibold text-foreground">{procedure.cost}</Text>
        </Section>

        {procedure.requirements?.length > 0 ? (
          <Section title="Requisitos">
            <View className="gap-2">
              {procedure.requirements.map((req, i) => (
                <View key={i} className="flex-row items-start gap-2">
                  <CheckCircle2 size={16} color="#1976D2" style={{ marginTop: 1 }} />
                  <Text className="flex-1 text-sm text-foreground">{req}</Text>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {procedure.steps?.length > 0 ? (
          <Section title="Pasos a seguir">
            <View className="gap-3">
              {procedure.steps.map((step) => (
                <View key={step.step} className="flex-row gap-3">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                    <Text className="text-sm font-semibold text-primary-foreground">{step.step}</Text>
                  </View>
                  <View className="flex-1 gap-0.5">
                    <Text className="text-sm text-foreground">{step.description}</Text>
                    {step.location ? (
                      <Text className="text-xs text-muted-foreground">{step.location}</Text>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>
          </Section>
        ) : null}

        {procedure.documents && procedure.documents.length > 0 ? (
          <Section title="Documentos">
            <View className="gap-2">
              {procedure.documents.map((doc) => (
                <Pressable
                  key={doc.id}
                  onPress={() => Linking.openURL(doc.url)}
                  className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3"
                >
                  <Text className="flex-1 text-sm font-medium text-foreground" numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Download size={16} color="#8A8A8A" />
                </Pressable>
              ))}
            </View>
          </Section>
        ) : null}

        <Section title={`Reseñas (${procedure.reviews.length})`}>
          <View className="gap-4">
            <ReviewForm entityType="procedures" entityId={procedure.id} />
            <ReviewList reviews={procedure.reviews} />
          </View>
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}
