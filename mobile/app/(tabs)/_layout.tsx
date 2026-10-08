import { Tabs } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bell, Home, Search, ShoppingBag, UserRound } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { rpc } from '../../src/lib/api';
import { TabBar } from '../../src/components/ui/TabBar';

// Same tabs as the website's mobile bar (src/components/layout/MobileTabBar.tsx):
// Inicio, Buscar, Tienda, Avisos, Cuenta. "Mi negocio" and Admin are
// reached from Cuenta and the home screen.
export default function TabsLayout() {
  const { user } = useAuth();
  const unread = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: () => rpc<{ isRead: boolean }[]>('getMyNotifications'),
    enabled: !!user,
    select: (list) => list.filter((n) => !n.isRead).length,
  });

  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size, focused }) => <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar', tabBarIcon: ({ color, size, focused }) => <Search color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen name="tienda" options={{ title: 'Tienda', tabBarIcon: ({ color, size, focused }) => <ShoppingBag color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Avisos',
          tabBarBadge: unread.data ? (unread.data > 9 ? '9+' : unread.data) : undefined,
          tabBarIcon: ({ color, size, focused }) => <Bell color={color} size={size} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: 'Cuenta', tabBarIcon: ({ color, size, focused }) => <UserRound color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      {/* Still routes (links from Cuenta / Inicio), just not tabs. */}
      <Tabs.Screen name="dashboard" options={{ href: null, title: 'Mi negocio' }} />
      <Tabs.Screen name="admin" options={{ href: null, title: 'Admin' }} />
    </Tabs>
  );
}
