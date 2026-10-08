import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { ExternalLink, Mail, MessageCircle, Phone, Share2 } from 'lucide-react-native';
import type { ActionItem } from '../../src/components/ui/ActionBar';
import { useProfessional } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { DetailTabs, type DetailTab } from '../../src/components/ui/DetailTabs';
import { Section } from '../../src/components/ui/Section';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { ReviewForm } from '../../src/components/ui/ReviewForm';
import { Badge } from '../../src/components/ui/Badge';
import { averageRating } from '../../src/components/ui/StarRating';

export default function ProfessionalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: professional, isLoading } = useProfessional(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!professional) return <EmptyState title="Profesional no encontrado" />;

  const favorite = isFavorite('professional', professional.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('professional', professional.id) : addFavorite('professional', professional.id);
  };

  const actions: ActionItem[] = [
    professional.contact?.phone && {
      icon: Phone,
      label: 'Llamar',
      onPress: () => Linking.openURL(`tel:${professional.contact.phone}`),
    },
    professional.contact?.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      onPress: () => Linking.openURL(`https://wa.me/${professional.contact.whatsapp}`),
    },
    professional.contact?.email && {
      icon: Mail,
      label: 'Email',
      onPress: () => Linking.openURL(`mailto:${professional.contact.email}`),
    },
    professional.contact?.linkedin && {
      icon: ExternalLink,
      label: 'LinkedIn',
      onPress: () => Linking.openURL(professional.contact.linkedin!),
    },
    {
      icon: Share2,
      label: 'Compartir',
      onPress: () =>
        Share.share({ message: `${professional.displayName} en Oltinde: ${WEB_APP_URL}/professionals/${professional.id}` }),
    },
  ].filter(Boolean) as ActionItem[];

  const infoTab = (
    <View>
      {professional.availability ? (
        <View className="flex-row px-4 pb-2 pt-4">
          <Badge label={professional.availability} variant="primary" />
        </View>
      ) : null}

      <Section title="Sobre mí">
        <Text className="text-sm leading-5 text-foreground">{professional.bio}</Text>
      </Section>

      {professional.skills?.length > 0 ? (
        <Section title="Habilidades">
          <View className="flex-row flex-wrap gap-2">
            {professional.skills.map((skill) => (
              <Badge key={skill} label={skill} />
            ))}
          </View>
        </Section>
      ) : null}

      {professional.services?.length > 0 ? (
        <Section title="Servicios">
          <View className="gap-2">
            {professional.services.map((service) => (
              <View key={service.id} className="flex-row items-center justify-between rounded-lg border border-border bg-card p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{service.name}</Text>
                  {service.description ? (
                    <Text className="text-xs text-muted-foreground">{service.description}</Text>
                  ) : null}
                </View>
                {service.price ? <Text className="text-sm font-semibold text-foreground">{service.price}</Text> : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <Section title="Contacto">
        <View className="gap-2.5">
          {professional.contact?.phone ? (
            <Pressable onPress={() => Linking.openURL(`tel:${professional.contact.phone}`)}>
              <View className="flex-row items-center gap-2">
                <Phone size={16} color="#374151" />
                <Text className="text-sm text-foreground">{professional.contact.phone}</Text>
              </View>
            </Pressable>
          ) : null}
          {professional.contact?.whatsapp ? (
            <Pressable onPress={() => Linking.openURL(`https://wa.me/${professional.contact.whatsapp}`)}>
              <View className="flex-row items-center gap-2">
                <MessageCircle size={16} color="#374151" />
                <Text className="text-sm text-foreground">WhatsApp: {professional.contact.whatsapp}</Text>
              </View>
            </Pressable>
          ) : null}
          {professional.contact?.email ? (
            <Pressable onPress={() => Linking.openURL(`mailto:${professional.contact.email}`)}>
              <View className="flex-row items-center gap-2">
                <Mail size={16} color="#374151" />
                <Text className="text-sm text-foreground">{professional.contact.email}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </Section>
    </View>
  );

  const portfolioTab = (
    <View className="flex-row flex-wrap gap-2 p-4">
      {(professional.portfolio ?? []).map((uri, i) => (
        <Image key={i} source={{ uri }} style={{ width: '48.5%', aspectRatio: 1, borderRadius: 12 }} contentFit="cover" />
      ))}
    </View>
  );

  const reviewsTab = (
    <View className="px-4 py-5">
      <View className="gap-4">
        <ReviewForm entityType="professionals" entityId={professional.id} />
        <ReviewList reviews={professional.reviews} />
      </View>
    </View>
  );

  const tabs: DetailTab[] = [{ key: 'info', label: 'Información', content: infoTab }];
  if (professional.portfolio && professional.portfolio.length > 0) {
    tabs.push({ key: 'portfolio', label: 'Portafolio', content: portfolioTab });
  }
  tabs.push({ key: 'reviews', label: `Reseñas (${professional.reviews.length})`, content: reviewsTab });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: professional.displayName }} />
      <ScrollView>
        <DetailHeader
          logo={professional.photo}
          title={professional.displayName}
          category={`${professional.title} · ${professional.city}`}
          rating={averageRating(professional.reviews)}
          reviewCount={professional.reviews.length}
          verified={professional.isVerified}
          isFavorite={favorite}
          onToggleFavorite={toggleFavorite}
          actions={actions}
        />
        <DetailTabs tabs={tabs} />
      </ScrollView>
    </SafeAreaView>
  );
}
