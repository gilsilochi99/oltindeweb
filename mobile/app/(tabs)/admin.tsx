import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Briefcase, ChevronRight, FileText, HeartPulse, Landmark, MapPinned, ShieldQuestion, Users } from 'lucide-react-native';
import { usePendingClaims, usePendingPlaces } from '../../src/hooks/use-queries';

function AdminRow({
  icon: Icon,
  label,
  subtitle,
  badge,
  onPress,
}: {
  icon: typeof Users;
  label: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 active:opacity-70"
    >
      <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Icon size={18} color="#1A1C1C" />
      </View>
      <View className="flex-1">
        <Text className="text-sm font-semibold text-foreground">{label}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground">{subtitle}</Text> : null}
      </View>
      {badge ? (
        <View className="h-6 min-w-6 items-center justify-center rounded-full bg-primary px-1.5">
          <Text className="text-xs font-bold text-primary-foreground">{badge}</Text>
        </View>
      ) : null}
      <ChevronRight size={18} color="#8A8A8A" />
    </Pressable>
  );
}

export default function AdminScreen() {
  const { data: claims } = usePendingClaims();
  const { data: places } = usePendingPlaces();

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <Text className="px-4 pb-2 pt-4 text-2xl font-extrabold text-foreground">Administración</Text>
      <ScrollView contentContainerClassName="gap-2.5 p-4">
        <AdminRow
          icon={ShieldQuestion}
          label="Reclamaciones"
          subtitle="Aprueba o rechaza reclamaciones de negocios"
          badge={claims?.length}
          onPress={() => router.push('/staff/claims')}
        />
        <AdminRow
          icon={MapPinned}
          label="Lugares pendientes"
          subtitle="Modera lugares sugeridos por usuarios"
          badge={places?.length}
          onPress={() => router.push('/staff/places')}
        />
        <AdminRow
          icon={Users}
          label="Usuarios y roles"
          subtitle="Gestiona roles y cuentas premium"
          onPress={() => router.push('/staff/users')}
        />
        <AdminRow
          icon={FileText}
          label="Trámites"
          subtitle="Crea y edita los trámites de la app"
          onPress={() => router.push('/staff/procedures')}
        />
        <AdminRow
          icon={Landmark}
          label="Instituciones"
          subtitle="Crea y edita instituciones públicas"
          onPress={() => router.push('/staff/institutions')}
        />
        <AdminRow
          icon={HeartPulse}
          label="Salud"
          subtitle="Hospitales, clínicas y farmacias"
          onPress={() => router.push('/staff/health')}
        />
        <AdminRow
          icon={Briefcase}
          label="Servicios"
          subtitle="Catálogo de servicios de la app"
          onPress={() => router.push('/staff/services')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
