import { Pressable, Switch, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { ImageOff } from 'lucide-react-native';

const STATUS_LABEL = { draft: 'Borrador', active: 'Publicado', archived: 'Archivado' } as const;

// One product / rental listing in the business panel: photo, title, price
// line, and a publish switch.
export function ManagedItemRow({
  image,
  title,
  subtitle,
  status,
  busy,
  onToggle,
  onPress,
}: {
  image?: string;
  title: string;
  subtitle?: string;
  status: 'draft' | 'active' | 'archived';
  busy?: boolean;
  onToggle: (publish: boolean) => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3 active:opacity-80" style={{ elevation: 1 }}>
      <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-muted">
        {image ? <Image source={{ uri: image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : <ImageOff size={16} color="#C4C4C4" />}
      </View>
      <View className="flex-1 gap-0.5">
        <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{title}</Text>
        {subtitle ? <Text className="text-xs text-muted-foreground" numberOfLines={1}>{subtitle}</Text> : null}
        <Text className={`text-xs font-semibold ${status === 'active' ? 'text-green-700' : 'text-muted-foreground'}`}>{STATUS_LABEL[status]}</Text>
      </View>
      <Switch value={status === 'active'} disabled={busy} onValueChange={onToggle} />
    </Pressable>
  );
}
