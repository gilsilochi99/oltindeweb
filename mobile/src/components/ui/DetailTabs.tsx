import { useState, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { tick } from './motion';

export interface DetailTab {
  key: string;
  label: string;
  content: ReactNode;
}

// Tab strip for detail screens with several content-heavy sections
// (companies, etc.): uppercase labels with a black underline on the active
// one, like the website's section nav. RN has no scroll-to-anchor, so each
// tab swaps the panel below; the new panel fades in.
export function DetailTabs({ tabs }: { tabs: DetailTab[] }) {
  const [active, setActive] = useState(tabs[0]?.key);
  if (tabs.length === 0) return null;
  const activeTab = tabs.find((t) => t.key === active) ?? tabs[0];

  return (
    <View>
      <View className="border-b border-border bg-card">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-2">
          {tabs.map((tab) => {
            const selected = tab.key === activeTab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => {
                  if (selected) return;
                  tick('selection');
                  setActive(tab.key);
                }}
                className="px-3 pt-3"
              >
                <Text className={`pb-2.5 text-[13px] uppercase tracking-wide ${selected ? 'font-extrabold text-foreground' : 'font-semibold text-foreground/55'}`}>
                  {tab.label}
                </Text>
                <View className={`h-[3px] rounded-t ${selected ? 'bg-foreground' : 'bg-transparent'}`} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <Animated.View key={activeTab.key} entering={FadeIn.duration(220)}>
        {activeTab.content}
      </Animated.View>
    </View>
  );
}
