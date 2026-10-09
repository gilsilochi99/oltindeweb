import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

// Detail-page section. Titles are like the website's <h2>s.
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-3 border-t border-border px-4 py-5">
      <Text className="text-base font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}
