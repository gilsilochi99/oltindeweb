import '../global.css';

import { useState } from 'react';
import { useColorScheme, View, type ColorSchemeName } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '../src/hooks/use-auth';
import { FoodCartProvider } from '../src/hooks/use-food-cart';
import { ShopCartProvider } from '../src/hooks/use-shop-cart';
import { usePushNotifications } from '../src/hooks/use-push-notifications';
import { AnimatedSplash } from '../src/components/AnimatedSplash';

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <FoodCartProvider>
              <ShopCartProvider>
                <RootNavigator colorScheme={colorScheme} />
              </ShopCartProvider>
            </FoodCartProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ colorScheme }: { colorScheme: ColorSchemeName }) {
  const { user, loading } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  usePushNotifications(splashVisible ? undefined : user?.uid);

  // The app is built underneath the splash as soon as auth has resolved, so
  // when the logo fades out the first screen is already laid out (building it
  // at the moment the splash ended made both animations stutter).
  return (
    <View style={{ flex: 1 }}>
      {loading ? null : <AppStack colorScheme={colorScheme} signedIn={!!user} />}
      {splashVisible ? <AnimatedSplash ready={!loading} onExited={() => setSplashVisible(false)} /> : null}
    </View>
  );
}

function AppStack({ colorScheme, signedIn }: { colorScheme: ColorSchemeName; signedIn: boolean }) {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right', animationDuration: 260 }} key={colorScheme}>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="tienda" />
        <Stack.Screen name="alquiler" />
        <Stack.Screen name="companies" />
        <Stack.Screen name="professionals" />
        <Stack.Screen name="procedures" />
        <Stack.Screen name="institutions" />
        <Stack.Screen name="health" />
        <Stack.Screen name="places" />
        <Stack.Screen name="jobs" />
        <Stack.Screen name="events" />
        <Stack.Screen name="offers" />
        <Stack.Screen name="announcements" />
        <Stack.Screen name="contribuciones" />
        <Stack.Screen name="itineraries" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="checkout" />
        <Stack.Screen name="map" />
        <Stack.Screen name="advisor" />
        <Stack.Screen name="business" />
        <Stack.Screen name="staff" />
      </Stack.Protected>
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      </Stack.Protected>
    </Stack>
  );
}
