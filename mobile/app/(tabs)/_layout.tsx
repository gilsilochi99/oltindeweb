import { Tabs } from 'expo-router';
import { Home, Search, ShoppingBag, UserRound } from 'lucide-react-native';
import { TabBar } from '../../src/components/ui/TabBar';
import { PublishProvider, usePublishSheet } from '../../src/components/PublishSheet';

// Same tabs as the website's mobile bar (src/components/layout/MobileTabBar.tsx):
// Inicio, Buscar, + (the "Publicar" sheet), Tienda, Cuenta. Avisos is the bell
// in the header; "Mi negocio" and Admin are reached from Cuenta.
export default function TabsLayout() {
  return (
    <PublishProvider>
      <TabsWithPublish />
    </PublishProvider>
  );
}

function TabsWithPublish() {
  const { open } = usePublishSheet();
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} onPublish={open} />}>
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size, focused }) => <Home color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar', tabBarIcon: ({ color, size, focused }) => <Search color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen name="tienda" options={{ title: 'Tienda', tabBarIcon: ({ color, size, focused }) => <ShoppingBag color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Cuenta', tabBarIcon: ({ color, size, focused }) => <UserRound color={color} size={size} strokeWidth={focused ? 2.5 : 2} /> }} />
      {/* Still routes (header bell, links from Cuenta / Inicio), just not tabs. */}
      <Tabs.Screen name="notifications" options={{ href: null, title: 'Avisos' }} />
      <Tabs.Screen name="dashboard" options={{ href: null, title: 'Mi negocio' }} />
      <Tabs.Screen name="admin" options={{ href: null, title: 'Admin' }} />
    </Tabs>
  );
}
