import { Text, View } from 'react-native';

type Variant = 'default' | 'primary' | 'outline';

const VARIANT_STYLES: Record<Variant, { container: string; text: string }> = {
  default: { container: 'bg-muted', text: 'text-muted-foreground' },
  primary: { container: 'bg-primary', text: 'text-primary-foreground' },
  outline: { container: 'bg-transparent border border-border', text: 'text-foreground' },
};

export function Badge({ label, variant = 'default' }: { label: string; variant?: Variant }) {
  const styles = VARIANT_STYLES[variant];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${styles.container}`}>
      <Text className={`text-xs font-medium ${styles.text}`}>{label}</Text>
    </View>
  );
}
