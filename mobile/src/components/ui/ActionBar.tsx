import { Pressable, Text, View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { tick } from './motion';

export interface ActionItem {
  icon: LucideIcon;
  label: string;
  onPress: () => void;
}

// The website's mobile QuickActionsRow: one bordered strip split into equal
// cells (Llamar, WhatsApp, Cómo llegar…), blue icon over a small label.
// Each detail screen passes only the actions it has data for.
export function ActionBar({ actions }: { actions: ActionItem[] }) {
  if (actions.length === 0) return null;
  return (
    <View className="flex-row overflow-hidden rounded-lg border border-border bg-card">
      {actions.map(({ icon: Icon, label, onPress }, i) => (
        <Pressable
          key={label}
          onPress={() => {
            tick('light');
            onPress();
          }}
          className={`flex-1 items-center gap-1 py-3 active:bg-muted ${i > 0 ? 'border-l border-border' : ''}`}
        >
          <Icon size={21} color="#0062A0" />
          <Text className="text-[11px] font-bold text-secondary" numberOfLines={1}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}
