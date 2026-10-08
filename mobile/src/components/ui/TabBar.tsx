import { useEffect } from 'react';
import { Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { tick } from './motion';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

// Bottom bar in the website's style (MobileTabBar.tsx): white, hairline on
// top, icon + small label. The active tab gets a yellow pill that slides
// between tabs, and its icon pops.
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Routes hidden with href: null don't get a button. expo-router turns
  // href: null into tabBarItemStyle { display: 'none' } (the href option
  // itself doesn't reach the tab bar).
  const routes = state.routes.filter((r) => {
    const style = descriptors[r.key].options.tabBarItemStyle as { display?: string } | undefined;
    return style?.display !== 'none';
  });
  const tabWidth = width / Math.max(1, routes.length);
  const activeIndex = Math.max(0, routes.findIndex((r) => r.key === state.routes[state.index].key));

  const x = useSharedValue(activeIndex * tabWidth);
  useEffect(() => {
    x.value = withSpring(activeIndex * tabWidth, SPRING);
  }, [activeIndex, tabWidth, x]);
  const pill = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View className="border-t border-border bg-card" style={{ paddingBottom: Math.max(insets.bottom, 6) }}>
      <Animated.View style={[{ position: 'absolute', top: 6, left: 0, width: tabWidth, alignItems: 'center' }, pill]}>
        <View className="h-8 w-14 rounded-full bg-primary" />
      </Animated.View>
      <View className="flex-row">
        {routes.map((route) => {
          const { options } = descriptors[route.key];
          const focused = state.routes[state.index].key === route.key;
          const color = focused ? '#000000' : '#6B6B6B';
          const label = typeof options.title === 'string' ? options.title : route.name;
          const badge = options.tabBarBadge;
          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              tick('selection');
              navigation.navigate(route.name, route.params);
            }
          };
          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              className="flex-1 items-center pb-1 pt-[10px]"
            >
              <TabIcon focused={focused}>
                {options.tabBarIcon?.({ focused, color, size: 22 })}
                {badge ? (
                  <View className="absolute -right-2.5 -top-1 min-w-[16px] items-center rounded-full bg-destructive px-1">
                    <Text className="text-[9px] font-extrabold text-white">{badge}</Text>
                  </View>
                ) : null}
              </TabIcon>
              <Text className={`mt-1.5 text-[11px] ${focused ? 'font-extrabold text-black' : 'font-medium text-[#6B6B6B]'}`} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ focused, children }: { focused: boolean; children: React.ReactNode }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (focused) scale.value = withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 260 }));
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}
