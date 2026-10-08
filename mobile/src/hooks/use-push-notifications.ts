// Push notifications for the signed-in user (Android).
//
// The phone's native FCM token is saved on the server with the same
// addMyPushToken the website uses, so every notification the site sends
// (new order, booking request, status changes...) also reaches the app.
// Tapping one opens the matching screen (see notification-links.ts).
//
// iOS would need APNs → FCM token mapping; not set up yet.
import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { rpc } from '../lib/api';
import { appRouteForLink } from '../lib/notification-links';

// Show notifications that arrive while the app is open, too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerDevice(): Promise<string | null> {
  if (Platform.OS !== 'android' || !Device.isDevice) return null;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Avisos',
    importance: Notifications.AndroidImportance.HIGH,
    lightColor: '#FFCD00',
  });
  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== 'granted') return null;
  const { data: token } = await Notifications.getDevicePushTokenAsync(); // FCM token on Android
  await rpc('addMyPushToken', token);
  return token;
}

// This phone's token while signed in. Removed on sign-out (before the
// account is signed out, while the server can still tell whose it is).
let currentToken: string | null = null;

export async function forgetPushDevice(): Promise<void> {
  const token = currentToken;
  currentToken = null;
  if (token) await rpc('removeMyPushToken', token).catch(() => {});
}

function linkOf(response: Notifications.NotificationResponse | null | undefined): string | undefined {
  const data = response?.notification.request.content.data as { link?: unknown } | undefined;
  return typeof data?.link === 'string' ? data.link : undefined;
}

export function usePushNotifications(userId: string | undefined) {
  const queryClient = useQueryClient();
  // Register while signed in (sign-out calls forgetPushDevice).
  useEffect(() => {
    if (!userId) return;
    registerDevice()
      .then((token) => {
        currentToken = token;
      })
      .catch((error) => console.warn('Push registration failed:', error));
  }, [userId]);

  // Tap on a notification: the app was in the background, or opened by it.
  const lastResponse = Notifications.useLastNotificationResponse();
  const handled = useRef<string | null>(null);
  useEffect(() => {
    if (!userId || !lastResponse) return;
    const id = lastResponse.notification.request.identifier;
    const link = linkOf(lastResponse);
    if (!link || handled.current === id) return;
    handled.current = id;
    router.push(appRouteForLink(link) as never);
  }, [lastResponse, userId]);

  // A notification arriving while the app is open: refresh the lists it may affect.
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['seller'] });
      queryClient.invalidateQueries({ queryKey: ['advertiser'] });
      queryClient.invalidateQueries({ queryKey: ['shop', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['rentals', 'bookings'] });
    });
    return () => sub.remove();
  }, [queryClient]);
}
