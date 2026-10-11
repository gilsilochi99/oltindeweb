import { Text, View } from 'react-native';
import { router } from 'expo-router';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';
import { Button } from './Button';

export type EmptyAction = { label: string; onPress: () => void };

// What a screen shows when there's nothing in it. Every empty screen should
// offer the next step (`action`): "Buscar alquileres", "Escribir una
// contribución"… so the user is never left at a dead end. `back` adds
// "Volver" for screens of something that no longer exists.
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  secondary,
  back,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: EmptyAction;
  secondary?: EmptyAction;
  back?: boolean;
}) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const primary = action ?? (back ? { label: 'Volver', onPress: goBack } : undefined);
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8 py-16">
      <Icon size={40} color="#8A8A8A" />
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
      {primary ? (
        <View className="mt-3 w-full max-w-xs gap-2">
          <Button onPress={primary.onPress}>{primary.label}</Button>
          {secondary ? <Button variant="outline" onPress={secondary.onPress}>{secondary.label}</Button> : null}
        </View>
      ) : null}
    </View>
  );
}
