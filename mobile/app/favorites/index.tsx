import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import {
  useActiveCompanies,
  useActiveProfessionals,
  useProcedures,
  useInstitutions,
  useActiveJobPostings,
  useEvents,
  useTouristLocations,
  useItineraries,
} from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { ListCard } from '../../src/components/ui/ListCard';

export default function FavoritesScreen() {
  const { favorites } = useAuth();
  const companies = useActiveCompanies();
  const professionals = useActiveProfessionals();
  const procedures = useProcedures();
  const institutions = useInstitutions();
  const jobs = useActiveJobPostings();
  const events = useEvents();
  const places = useTouristLocations();
  const itineraries = useItineraries();

  const isLoading = [companies, professionals, procedures, institutions, jobs, events, places, itineraries].some(
    (q) => q.isLoading,
  );

  if (isLoading) return <LoadingState variant="list" />;

  const sections = [
    { title: 'Empresas', ids: favorites.companies, items: companies.data, href: 'companies', label: (i: any) => i.name, image: (i: any) => i.logo },
    { title: 'Profesionales', ids: favorites.professionals, items: professionals.data, href: 'professionals', label: (i: any) => i.displayName, image: (i: any) => i.photo },
    { title: 'Trámites', ids: favorites.procedures, items: procedures.data, href: 'procedures', label: (i: any) => i.name },
    { title: 'Instituciones', ids: favorites.institutions, items: institutions.data, href: 'institutions', label: (i: any) => i.name, image: (i: any) => i.logo },
    { title: 'Empleos', ids: favorites.jobs, items: jobs.data, href: 'jobs', label: (i: any) => i.title, image: (i: any) => i.companyLogo },
    { title: 'Eventos', ids: favorites.events, items: events.data, href: 'events', label: (i: any) => i.title, image: (i: any) => i.organizerLogo },
    { title: 'Lugares', ids: favorites.places, items: places.data, href: 'places', label: (i: any) => i.name, image: (i: any) => i.image },
    { title: 'Itinerarios', ids: favorites.itineraries, items: itineraries.data, href: 'itineraries', label: (i: any) => i.title, image: (i: any) => i.coverImage },
  ].map((s) => ({ ...s, matched: (s.items ?? []).filter((i: any) => s.ids.includes(i.id)) }));

  const hasAny = sections.some((s) => s.matched.length > 0);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Favoritos' }} />
      {!hasAny ? (
        <EmptyState
          title="Todavía no tienes favoritos"
          description="Toca el corazón en cualquier empresa, trámite o lugar para guardarlo aquí."
          icon={Heart}
        />
      ) : (
        <ScrollView>
          {sections
            .filter((s) => s.matched.length > 0)
            .map((s) => (
              <Section key={s.title} title={s.title}>
                <View className="gap-3">
                  {s.matched.map((item: any) => (
                    <ListCard
                      key={item.id}
                      image={s.image ? s.image(item) : undefined}
                      title={s.label(item)}
                      onPress={() => router.push(`/${s.href}/${item.id}` as any)}
                    />
                  ))}
                </View>
              </Section>
            ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
