import { Linking, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarClock } from 'lucide-react-native';
import { useJob, useCompany } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Section } from '../../src/components/ui/Section';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';
import { ListCard } from '../../src/components/ui/ListCard';

export default function JobDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: job, isLoading } = useJob(id);
  const { data: company } = useCompany(job?.companyId ?? '');
  const { user, isFavorite, addFavorite, removeFavorite } = useAuth();

  if (isLoading) return <LoadingState />;
  if (!job) return <EmptyState title="Empleo no encontrado" />;

  const favorite = isFavorite('job', job.id);
  const toggleFavorite = () => {
    if (!user) return;
    favorite ? removeFavorite('job', job.id) : addFavorite('job', job.id);
  };

  const isClosed = job.status === 'closed';
  const apply = () => {
    if (job.applicationMethod === 'email') {
      Linking.openURL(`mailto:${job.applicationValue}?subject=${encodeURIComponent(`Solicitud: ${job.title}`)}`);
    } else {
      Linking.openURL(job.applicationValue);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: job.title }} />
      <ScrollView>
        <View className="gap-2 px-4 py-4">
          <Text className="text-2xl font-bold text-foreground">{job.title}</Text>
          <Text className="text-base text-muted-foreground">
            {job.companyName} · {job.city}
          </Text>
          <View className="flex-row flex-wrap gap-2 pt-1">
            <Badge label={job.employmentType} variant="primary" />
            {job.sector ? <Badge label={job.sector} /> : null}
            {job.salaryRange ? <Badge label={job.salaryRange} variant="outline" /> : null}
            {isClosed ? <Badge label="Cerrado" variant="outline" /> : null}
          </View>
          {job.deadline ? (
            <View className="flex-row items-center gap-2 pt-1">
              <CalendarClock size={15} color="#8A8A8A" />
              <Text className="text-sm text-muted-foreground">
                Fecha límite: {format(new Date(job.deadline), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </Text>
            </View>
          ) : null}
        </View>

        <Section title="Descripción">
          <Text className="text-sm leading-5 text-foreground">{job.description}</Text>
        </Section>

        {job.requirements?.length > 0 ? (
          <Section title="Requisitos">
            <View className="gap-1.5">
              {job.requirements.map((r, i) => (
                <Text key={i} className="text-sm text-foreground">
                  • {r}
                </Text>
              ))}
            </View>
          </Section>
        ) : null}

        {job.responsibilities && job.responsibilities.length > 0 ? (
          <Section title="Responsabilidades">
            <View className="gap-1.5">
              {job.responsibilities.map((r, i) => (
                <Text key={i} className="text-sm text-foreground">
                  • {r}
                </Text>
              ))}
            </View>
          </Section>
        ) : null}

        {job.academicLevel ? (
          <Section title="Nivel académico requerido">
            <Text className="text-sm text-foreground">{job.academicLevel}</Text>
          </Section>
        ) : null}

        {job.experience && job.experience.length > 0 ? (
          <Section title="Experiencia">
            <View className="gap-1.5">
              {job.experience.map((exp, i) => (
                <Text key={i} className="text-sm text-foreground">
                  • {exp}
                </Text>
              ))}
            </View>
          </Section>
        ) : null}

        {job.skills && job.skills.length > 0 ? (
          <Section title="Habilidades">
            <View className="flex-row flex-wrap gap-2">
              {job.skills.map((skill) => (
                <Badge key={skill} label={skill} />
              ))}
            </View>
          </Section>
        ) : null}

        {job.applicationInstructions ? (
          <Section title="Cómo aplicar">
            <Text className="text-sm leading-5 text-foreground">{job.applicationInstructions}</Text>
          </Section>
        ) : null}

        {company ? (
          <Section title="Empresa">
            <ListCard
              image={company.logo}
              title={company.name}
              subtitle={company.category}
              verified={company.isVerified}
              onPress={() => router.push(`/companies/${company.id}`)}
            />
          </Section>
        ) : null}

        <View className="gap-3 px-4 py-4">
          <Button onPress={apply} disabled={isClosed}>
            {isClosed ? 'Empleo cerrado' : 'Aplicar ahora'}
          </Button>
          <Button variant="outline" onPress={toggleFavorite}>
            {favorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
