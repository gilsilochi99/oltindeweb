import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  BookOpen, CalendarCheck, ChevronRight, Gift, Heart, LifeBuoy, LogOut, Package, Shield, Store, type LucideIcon,
} from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { WEB_APP_URL } from '../../src/lib/config';
import { FadeInItem, tick } from '../../src/components/ui/motion';
import { AppHeader } from '../../src/components/ui/AppHeader';

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  manager: 'Gestor',
  editor: 'Editor',
  pharmacist: 'Farmacéutico',
  user: 'Usuario',
};

type Row = { icon: LucideIcon; label: string; hint?: string; onPress: () => void };

export default function ProfileScreen() {
  const { user, isPremium, isManager, signout } = useAuth();

  const onSignOut = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres cerrar sesión?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signout() },
    ]);
  };

  const groups: { title: string; rows: Row[] }[] = [
    {
      title: 'Mi actividad',
      rows: [
        { icon: Package, label: 'Mis compras', hint: 'Pedidos de la Tienda', onPress: () => router.push('/tienda/pedidos') },
        { icon: CalendarCheck, label: 'Mis reservas', hint: 'Alquileres solicitados', onPress: () => router.push('/alquiler/reservas') },
        { icon: Gift, label: 'Lista de deseos', onPress: () => router.push('/tienda/deseos') },
        { icon: Heart, label: 'Favoritos', hint: 'Empresas, trámites, empleos…', onPress: () => router.push('/favorites') },
      ],
    },
    {
      title: 'Empresas',
      rows: [
        { icon: Store, label: 'Mi negocio', hint: 'Gestiona tu empresa, productos y reservas', onPress: () => router.push('/dashboard') },
        ...(isManager ? [{ icon: Shield, label: 'Administración', hint: 'Panel de gestión de Oltinde', onPress: () => router.push('/admin') }] : []),
      ],
    },
    {
      title: 'Ayuda',
      rows: [
        { icon: BookOpen, label: 'Guía de usuario', onPress: () => Linking.openURL(`${WEB_APP_URL}/guia-de-usuario`) },
        { icon: LifeBuoy, label: 'Contacto y soporte', onPress: () => Linking.openURL(`${WEB_APP_URL}/contact`) },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader />
      <ScrollView contentContainerClassName="pb-10">
        <FadeInItem className="mx-4 mt-4 overflow-hidden rounded-xl bg-primary p-5">
          <View className="flex-row items-center gap-4">
            <View className="h-16 w-16 items-center justify-center rounded-full bg-black">
              <Text className="text-2xl font-semibold text-primary">{(user?.displayName ?? 'U').charAt(0).toUpperCase()}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xl font-semibold text-black" numberOfLines={1}>{user?.displayName ?? 'Mi cuenta'}</Text>
              <Text className="text-sm text-black/70" numberOfLines={1}>{user?.email}</Text>
              <View className="mt-2 flex-row gap-2">
                <View className="rounded bg-black/10 px-2 py-0.5">
                  <Text className="text-[11px] font-semibold text-black">{ROLE_LABEL[user?.role ?? 'user']}</Text>
                </View>
                {isPremium ? (
                  <View className="rounded bg-black px-2 py-0.5">
                    <Text className="text-[11px] font-semibold text-primary">Premium</Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </FadeInItem>

        {groups.map((g, gi) => (
          <FadeInItem key={g.title} index={gi + 1} className="mt-6 px-4">
            <Text className="mb-2 px-1 text-xs font-semibold text-foreground/60">{g.title}</Text>
            <View className="overflow-hidden rounded-lg border border-border bg-card">
              {g.rows.map((r, i) => (
                <Pressable
                  key={r.label}
                  onPress={() => {
                    tick('selection');
                    r.onPress();
                  }}
                  className={`flex-row items-center gap-3 px-4 py-3.5 active:bg-muted ${i > 0 ? 'border-t border-border' : ''}`}
                >
                  <View className="h-9 w-9 items-center justify-center rounded-md bg-primary/25">
                    <r.icon size={18} color="#000" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-[15px] font-semibold text-foreground">{r.label}</Text>
                    {r.hint ? <Text className="text-xs text-foreground/60">{r.hint}</Text> : null}
                  </View>
                  <ChevronRight size={18} color="#9A9A9A" />
                </Pressable>
              ))}
            </View>
          </FadeInItem>
        ))}

        <View className="mt-8 px-4">
          <Pressable onPress={onSignOut} className="h-12 flex-row items-center justify-center gap-2 rounded-md border border-destructive/40 bg-card active:bg-muted">
            <LogOut size={18} color="#B91C1C" />
            <Text className="text-base font-semibold text-destructive">Cerrar sesión</Text>
          </Pressable>
          <Text className="mt-4 text-center text-xs text-foreground/50">Oltinde · Guinea Ecuatorial</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
