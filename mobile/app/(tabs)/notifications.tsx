import { appRouteForLink } from '../../src/lib/notification-links';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { router } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, BellRing } from 'lucide-react-native';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { rpc } from '../../src/lib/api';
import { useAuth } from '../../src/hooks/use-auth';
import { DataList } from '../../src/components/ui/DataList';
import type { Notification } from '../../src/lib/types';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['notifications', user?.uid],
    // Newest first, from the web app's database.
    queryFn: () => rpc<Notification[]>('getMyNotifications'),
    enabled: !!user,
  });

  const onPressNotification = async (notification: Notification) => {
    if (!notification.isRead) {
      rpc('markMyNotificationRead', notification.id).catch(() => {});
      queryClient.setQueryData<Notification[]>(['notifications', user?.uid], (prev) =>
        prev?.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)),
      );
    }
    if (notification.link) router.push(appRouteForLink(notification.link) as any);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader hide={['notifications']} />
      <Text className="px-4 pb-2 pt-4 text-xl font-extrabold uppercase tracking-wide text-foreground">Avisos</Text>
      <DataList
        data={notifications}
        isLoading={isLoading}
        onRefresh={refetch}
        isRefreshing={isRefetching}
        keyExtractor={(n) => n.id}
        emptyTitle="No tienes avisos"
        emptyDescription="Aquí verás ofertas, anuncios y novedades de tus empresas suscritas."
        emptyIcon={Bell}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onPressNotification(item)}
            className={`flex-row items-start gap-3 rounded-lg border p-3 ${item.isRead ? 'border-border bg-card' : 'border-primary bg-card'}`}
          >
            <View className="mt-0.5">
              <BellRing size={18} color={item.isRead ? '#8A8A8A' : '#FFCD00'} />
            </View>
            <View className="flex-1 gap-1">
              <Text className={`text-sm ${item.isRead ? 'text-foreground' : 'font-semibold text-foreground'}`}>
                {item.message}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {format(new Date(item.createdAt), "d 'de' MMMM, HH:mm", { locale: es })}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
