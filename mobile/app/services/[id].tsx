import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { MapPin } from 'lucide-react-native';
import { useActiveCompanies, useServices } from '../../src/hooks/use-queries';
import { buildServiceDirectory, serviceIcon } from '../../src/lib/services-directory';
import { ListCard } from '../../src/components/ui/ListCard';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Rail';
import { averageRating } from '../../src/components/ui/StarRating';

// One service (web: /services/[name]): the companies offering it, with the
// branches where they do, and related services in the same category.
export default function ServiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const services = useServices();
  const companies = useActiveCompanies();
  const directory = useMemo(
    () => buildServiceDirectory(services.data ?? [], companies.data ?? []),
    [services.data, companies.data],
  );
  const entry = directory.find((d) => d.service.id === id);

  if (services.isLoading || companies.isLoading) return <LoadingState />;
  if (!entry) return <EmptyState title="Servicio no encontrado" />;

  const { service, providers } = entry;
  const Icon = serviceIcon(service.category);
  const cities = new Set(providers.flatMap((p) => p.branches.map((b) => b.location?.city)).filter(Boolean));
  const related = directory.filter((d) => d.service.category === service.category && d.service.id !== service.id).slice(0, 8);

  return (
    <>
      <Stack.Screen options={{ title: service.name }} />
      <ScrollView contentContainerClassName="pb-10">
        <View className="flex-row gap-4 bg-card px-4 py-5">
          <View className="h-14 w-14 items-center justify-center rounded-lg bg-primary/25">
            <Icon size={26} color="#000" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="text-xl font-semibold text-foreground">{service.name}</Text>
            <Text className="text-sm text-muted-foreground">
              {service.description || `Empresas que ofrecen servicios de ${service.name.toLowerCase()} en Guinea Ecuatorial.`}
            </Text>
            <Text className="mt-1 text-xs text-foreground/70">
              {service.category} · {providers.length} {providers.length === 1 ? 'proveedor' : 'proveedores'} · {cities.size} {cities.size === 1 ? 'ciudad' : 'ciudades'}
            </Text>
          </View>
        </View>

        <Section title={`Proveedores (${providers.length})`}>
          {providers.length ? (
            <View className="gap-3">
              {providers.map((c, i) => (
                <View key={c.id} className="gap-1.5">
                  <ListCard
                    index={i}
                    image={c.logo}
                    title={c.name}
                    subtitle={c.category}
                    verified={c.isVerified}
                    rating={averageRating(c.reviews)}
                    reviewCount={c.reviews.length}
                    phone={c.branches[0]?.contact?.phone}
                    whatsapp={c.contact?.socialMedia?.whatsapp}
                    onPress={() => router.push(`/companies/${c.id}`)}
                  />
                  {c.branches.map((b) => (
                    <View key={b.id} className="flex-row items-center gap-1.5 px-2">
                      <MapPin size={13} color="#6B6B6B" />
                      <Text className="flex-1 text-xs text-muted-foreground" numberOfLines={1}>
                        {b.name} · {[b.location?.address, b.location?.city].filter(Boolean).join(', ')}
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-muted-foreground">Aún no hay empresas que ofrezcan este servicio.</Text>
          )}
        </Section>

        {related.length ? (
          <Section title={`Más en ${service.category}`}>
            <View className="flex-row flex-wrap gap-2">
              {related.map((d) => (
                <Chip key={d.service.id} label={d.service.name} onPress={() => router.push(`/services/${d.service.id}`)} />
              ))}
            </View>
          </Section>
        ) : null}

        <Section title="¿Ofrece este servicio?">
          <Text className="mb-3 text-sm text-muted-foreground">Añada su empresa al directorio y aparezca en esta lista.</Text>
          <Button variant="outline" onPress={() => router.push('/business/new')}>Publicar mi empresa</Button>
        </Section>
      </ScrollView>
    </>
  );
}
