import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOffer } from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

export default function OfferDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useOffer(id);

  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState title="Oferta no encontrada" />;

  const { offer, company } = data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: offer.title }} />
      <ScrollView>
        {offer.image ? (
          <View className="h-48 w-full bg-muted">
            <Image source={{ uri: offer.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
        ) : null}
        <View className="gap-3 px-4 py-4">
          <Badge label={offer.discount} variant="primary" />
          <Text className="text-2xl font-bold text-foreground">{offer.title}</Text>
          <Text className="text-sm text-muted-foreground">
            Válido hasta {format(new Date(offer.validUntil), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
          <Text className="text-sm leading-5 text-foreground">{offer.description}</Text>

          <Button variant="outline" onPress={() => router.push(`/companies/${company.id}`)}>
            Ver {company.name}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
