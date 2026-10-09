import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAnnouncement } from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';

export default function AnnouncementDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data, isLoading } = useAnnouncement(id);

  if (isLoading) return <LoadingState />;
  if (!data) return <EmptyState title="Anuncio no encontrado" />;

  const { announcement, company } = data;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: announcement.title }} />
      <ScrollView>
        {announcement.image ? (
          <View className="h-48 w-full bg-muted">
            <Image source={{ uri: announcement.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          </View>
        ) : null}
        <View className="gap-3 px-4 py-4">
          <Text className="text-2xl font-semibold text-foreground">{announcement.title}</Text>
          <Text className="text-sm text-muted-foreground">
            {company.name} · {format(new Date(announcement.createdAt), "d 'de' MMMM 'de' yyyy", { locale: es })}
          </Text>
          <Text className="text-sm leading-5 text-foreground">{announcement.content}</Text>

          <Button variant="outline" onPress={() => router.push(`/companies/${company.id}`)}>
            Ver {company.name}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
