import { Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Inbox } from 'lucide-react-native';

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-2 px-8 py-16">
      <Icon size={40} color="#8A8A8A" />
      <Text className="text-center text-base font-semibold text-foreground">{title}</Text>
      {description ? (
        <Text className="text-center text-sm text-muted-foreground">{description}</Text>
      ) : null}
    </View>
  );
}
