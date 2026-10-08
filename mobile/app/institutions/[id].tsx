import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { Globe, Mail, MapPin, MessageCircle, Navigation, Phone, Share2 } from 'lucide-react-native';
import type { ActionItem } from '../../src/components/ui/ActionBar';
import { useInstitution } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { DetailTabs, type DetailTab } from '../../src/components/ui/DetailTabs';
import { Section } from '../../src/components/ui/Section';
import { ReviewList } from '../../src/components/ui/ReviewList';
import { ReviewForm } from '../../src/components/ui/ReviewForm';
import { averageRating } from '../../src/components/ui/StarRating';

export default function InstitutionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: institution, isLoading } = useInstitution(id);
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!institution) return <EmptyState title="Institución no encontrada" />;

  const favorite = isFavorite('institution', institution.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('institution', institution.id) : addFavorite('institution', institution.id);
  };

  const mainBranch = institution.branches?.[0];
  const actions: ActionItem[] = [
    mainBranch?.contact?.phone && {
      icon: Phone,
      label: 'Llamar',
      onPress: () => Linking.openURL(`tel:${mainBranch.contact.phone}`),
    },
    mainBranch?.location && {
      icon: Navigation,
      label: 'Cómo llegar',
      onPress: () =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mainBranch.location.lat},${mainBranch.location.lng}`),
    },
    institution.contact?.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      onPress: () => Linking.openURL(`https://wa.me/${institution.contact.whatsapp}`),
    },
    institution.contact?.website && {
      icon: Globe,
      label: 'Sitio web',
      onPress: () => Linking.openURL(institution.contact.website),
    },
    {
      icon: Share2,
      label: 'Compartir',
      onPress: () => Share.share({ message: `${institution.name} en Oltinde: ${WEB_APP_URL}/institutions/${institution.id}` }),
    },
  ].filter(Boolean) as ActionItem[];

  const infoTab = (
    <View>
      <Section title="Sobre la institución">
        <Text className="text-sm leading-5 text-foreground">{institution.description}</Text>
      </Section>

      {institution.responsiblePerson?.name ? (
        <Section title="Responsable">
          <Text className="text-sm text-foreground">{institution.responsiblePerson.name}</Text>
          <Text className="text-xs text-muted-foreground">{institution.responsiblePerson.title}</Text>
        </Section>
      ) : null}

      <Section title="Contacto">
        <View className="gap-2.5">
          {institution.contact?.email ? (
            <Pressable onPress={() => Linking.openURL(`mailto:${institution.contact.email}`)}>
              <View className="flex-row items-center gap-2">
                <Mail size={16} color="#374151" />
                <Text className="text-sm text-foreground">{institution.contact.email}</Text>
              </View>
            </Pressable>
          ) : null}
          {institution.contact?.website ? (
            <Pressable onPress={() => Linking.openURL(institution.contact.website)}>
              <View className="flex-row items-center gap-2">
                <Globe size={16} color="#374151" />
                <Text className="text-sm text-foreground">{institution.contact.website}</Text>
              </View>
            </Pressable>
          ) : null}
          {institution.contact?.whatsapp ? (
            <Pressable onPress={() => Linking.openURL(`https://wa.me/${institution.contact.whatsapp}`)}>
              <View className="flex-row items-center gap-2">
                <MessageCircle size={16} color="#374151" />
                <Text className="text-sm text-foreground">WhatsApp: {institution.contact.whatsapp}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </Section>

      {institution.branches?.length > 0 ? (
        <Section title="Sucursales">
          <View className="gap-3">
            {institution.branches.map((branch) => (
              <View key={branch.id} className="gap-1.5 rounded-lg border border-border bg-card p-3">
                <Text className="text-sm font-semibold text-foreground">{branch.name}</Text>
                <View className="flex-row items-start gap-2">
                  <MapPin size={14} color="#8A8A8A" />
                  <Text className="flex-1 text-sm text-muted-foreground">
                    {branch.location?.address}, {branch.location?.city}
                  </Text>
                </View>
                {branch.contact?.phone ? (
                  <Pressable onPress={() => Linking.openURL(`tel:${branch.contact.phone}`)}>
                    <View className="flex-row items-center gap-2">
                      <Phone size={14} color="#8A8A8A" />
                      <Text className="text-sm text-muted-foreground">{branch.contact.phone}</Text>
                    </View>
                  </Pressable>
                ) : null}
                {branch.workingHours && branch.workingHours.length > 0 ? (
                  <View className="mt-1 gap-0.5 border-t border-border pt-1.5">
                    {branch.workingHours.map((wh, i) => (
                      <View key={i} className="flex-row justify-between">
                        <Text className="text-xs text-muted-foreground">{wh.day}</Text>
                        <Text className="text-xs text-muted-foreground">{wh.hours}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))}
          </View>
        </Section>
      ) : null}
    </View>
  );

  const proceduresTab = (
    <View className="gap-2 p-4">
      {(institution.procedures ?? []).map((proc) => (
        <Pressable
          key={proc.id}
          onPress={() => router.push(`/procedures/${proc.id}`)}
          className="rounded-lg border border-border bg-card p-3"
        >
          <Text className="text-sm font-medium text-foreground">{proc.name}</Text>
        </Pressable>
      ))}
    </View>
  );

  const reviewsTab = (
    <View className="px-4 py-5">
      <View className="gap-4">
        <ReviewForm entityType="institutions" entityId={institution.id} />
        <ReviewList reviews={institution.reviews} />
      </View>
    </View>
  );

  const tabs: DetailTab[] = [{ key: 'info', label: 'Información', content: infoTab }];
  if (institution.procedures && institution.procedures.length > 0) {
    tabs.push({ key: 'procedures', label: 'Trámites', content: proceduresTab });
  }
  tabs.push({ key: 'reviews', label: `Reseñas (${institution.reviews.length})`, content: reviewsTab });

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: institution.name }} />
      <ScrollView>
        <DetailHeader
          logo={institution.logo}
          title={institution.name}
          category={institution.category}
          rating={averageRating(institution.reviews)}
          reviewCount={institution.reviews.length}
          isFavorite={favorite}
          onToggleFavorite={toggleFavorite}
          actions={actions}
        />
        <DetailTabs tabs={tabs} />
      </ScrollView>
    </SafeAreaView>
  );
}
