import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Store } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useCompaniesByOwner } from '../../src/hooks/use-queries';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ListCard } from '../../src/components/ui/ListCard';
import { Badge } from '../../src/components/ui/Badge';
import { Button } from '../../src/components/ui/Button';

export default function DashboardScreen() {
  const { user } = useAuth();
  const { data: companies, isLoading } = useCompaniesByOwner(user?.uid ?? '');

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['top']}>
        <EmptyState
          title="Inicia sesión"
          description="Inicia sesión para gestionar tu negocio en Oltinde."
          icon={Store}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <View className="flex-row items-center justify-between px-6 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Mi negocio</Text>
        <Pressable
          onPress={() => router.push('/business/new')}
          className="h-10 w-10 items-center justify-center rounded-full bg-primary"
        >
          <Plus size={20} color="#000000" />
        </Pressable>
      </View>

      {isLoading ? (
        <LoadingState />
      ) : companies && companies.length > 0 ? (
        <ScrollView contentContainerClassName="gap-3 px-6 py-5">
          {companies.map((company) => (
            <ListCard
              key={company.id}
              image={company.logo}
              title={company.name}
              subtitle={company.category}
              verified={company.isVerified}
              meta={company.isActive === false ? <Badge label="Inactiva" /> : null}
              onPress={() => router.push(`/business/${company.id}`)}
            />
          ))}
        </ScrollView>
      ) : (
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Store size={28} color="#8A8A8A" />
          </View>
          <Text className="text-center text-lg font-bold text-foreground">Todavía no tienes ningún negocio</Text>
          <Text className="text-center text-sm text-muted-foreground">
            Añade tu empresa o negocio a Oltinde para gestionar tu menú, empleos y pedidos desde aquí.
          </Text>
          <Button onPress={() => router.push('/business/new')} className="mt-2 px-8">
            Añadir mi negocio
          </Button>
        </View>
      )}
    </SafeAreaView>
  );
}
