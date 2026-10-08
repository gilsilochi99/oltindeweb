import { Linking, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Mail, MapPin, MessageCircle, Navigation, Phone, Share2 } from 'lucide-react-native';
import { useHealthFacility, useServices } from '../../src/hooks/use-queries';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { DetailHeader } from '../../src/components/ui/DetailHeader';
import { Section } from '../../src/components/ui/Section';
import { Badge } from '../../src/components/ui/Badge';
import type { ActionItem } from '../../src/components/ui/ActionBar';

const TYPE_LABEL: Record<string, string> = { hospital: 'Hospital', clinic: 'Clínica', pharmacy: 'Farmacia' };

export default function HealthFacilityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: facility, isLoading } = useHealthFacility(id);
  const { data: allServices } = useServices();

  if (isLoading) return <LoadingState />;
  if (!facility) return <EmptyState title="Centro no encontrado" />;

  const serviceNames = (facility.services ?? [])
    .map((serviceId) => allServices?.find((s) => s.id === serviceId)?.name)
    .filter((name): name is string => Boolean(name));

  const isOnDutyToday = facility.onDutyDates?.includes(new Date().toISOString().slice(0, 10));
  const mainBranch = facility.branches?.[0];

  const actions: ActionItem[] = [
    facility.contact?.whatsapp && {
      icon: MessageCircle,
      label: 'WhatsApp',
      onPress: () => Linking.openURL(`https://wa.me/${facility.contact!.whatsapp}`),
    },
    mainBranch?.location && {
      icon: Navigation,
      label: 'Cómo llegar',
      onPress: () =>
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mainBranch.location.lat},${mainBranch.location.lng}`),
    },
    {
      icon: Share2,
      label: 'Compartir',
      onPress: () => Share.share({ message: `${facility.name} en Oltinde: ${WEB_APP_URL}/health/${facility.id}` }),
    },
  ].filter(Boolean) as ActionItem[];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: facility.name }} />
      <ScrollView>
        <DetailHeader
          logo={facility.image}
          title={facility.name}
          category={`${TYPE_LABEL[facility.type]} · ${facility.ownership === 'public' ? 'Pública' : 'Privada'}`}
          verified={facility.isVerified}
          actions={actions}
        />

        <View className="flex-row flex-wrap gap-2 px-4">
          {facility.emergencyServices ? <Badge label="Urgencias 24h" variant="primary" /> : null}
          {isOnDutyToday ? <Badge label="De guardia hoy" variant="primary" /> : null}
        </View>

        <Section title="Descripción">
          <Text className="text-sm leading-5 text-foreground">{facility.description}</Text>
        </Section>

        {facility.specialties && facility.specialties.length > 0 ? (
          <Section title="Especialidades">
            <View className="flex-row flex-wrap gap-2">
              {facility.specialties.map((s) => (
                <Badge key={s} label={s} />
              ))}
            </View>
          </Section>
        ) : null}

        {serviceNames.length > 0 ? (
          <Section title="Servicios">
            <View className="flex-row flex-wrap gap-2">
              {serviceNames.map((name) => (
                <Badge key={name} label={name} variant="outline" />
              ))}
            </View>
          </Section>
        ) : null}

        {facility.contact?.whatsapp ? (
          <Section title="Contacto">
            <Pressable onPress={() => Linking.openURL(`https://wa.me/${facility.contact!.whatsapp}`)}>
              <View className="flex-row items-center gap-2">
                <MessageCircle size={16} color="#374151" />
                <Text className="text-sm text-foreground">WhatsApp: {facility.contact.whatsapp}</Text>
              </View>
            </Pressable>
          </Section>
        ) : null}

        {facility.branches?.length > 0 ? (
          <Section title="Sucursales">
            <View className="gap-3">
              {facility.branches.map((branch) => (
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
                  {branch.contact?.email ? (
                    <Pressable onPress={() => Linking.openURL(`mailto:${branch.contact.email}`)}>
                      <View className="flex-row items-center gap-2">
                        <Mail size={14} color="#8A8A8A" />
                        <Text className="text-sm text-muted-foreground">{branch.contact.email}</Text>
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
      </ScrollView>
    </SafeAreaView>
  );
}
