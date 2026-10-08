import { Children, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { FadeInItem, tick } from './motion';

// Titled horizontal shelf (home screens of Tienda / Alquiler / Inicio),
// with the website's section header: bold title, optional "NUEVO" tag and
// a "Ver todo →" link. Items slide in one after another.
export function Rail({ title, subtitle, isNew, onSeeAll, children }: { title: string; subtitle?: string; isNew?: boolean; onSeeAll?: () => void; children: ReactNode }) {
  return (
    <View className="mt-7">
      <View className="flex-row items-end justify-between gap-3 px-4">
        <View className="flex-1">
          <View className="flex-row items-center gap-2">
            <Text className="text-lg font-extrabold uppercase tracking-wide text-foreground">{title}</Text>
            {isNew ? <NewTag /> : null}
          </View>
          {subtitle ? <Text className="mt-0.5 text-xs text-foreground/60">{subtitle}</Text> : null}
        </View>
        {onSeeAll ? (
          <Pressable
            onPress={() => {
              tick('selection');
              onSeeAll();
            }}
            hitSlop={10}
            className="flex-row items-center gap-1 pb-0.5"
          >
            <Text className="text-sm font-bold text-foreground underline">Ver todo</Text>
            <ArrowRight size={15} color="#1A1C1C" />
          </Pressable>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-4 py-3" decelerationRate="fast">
        {Children.toArray(children).map((child, i) => (
          <FadeInItem key={i} index={i} horizontal>
            {child}
          </FadeInItem>
        ))}
      </ScrollView>
    </View>
  );
}

export function NewTag({ label = 'Nuevo' }: { label?: string }) {
  return (
    <View className="rounded bg-primary px-1.5 py-0.5">
      <Text className="text-[10px] font-extrabold uppercase text-black">{label}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        tick('selection');
        onPress();
      }}
      className={`rounded-full border px-3.5 py-2 ${selected ? 'border-foreground bg-foreground' : 'border-border bg-card'}`}
    >
      <Text className={`text-sm ${selected ? 'font-bold text-background' : 'font-medium text-foreground'}`}>{label}</Text>
    </Pressable>
  );
}
