import { useEffect, useState } from 'react';
import { Keyboard, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Tabs } from 'expo-router';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withSequence, withTiming } from 'react-native-reanimated';
import { tick } from './motion';

type BottomTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

const PILL_W = 58;
const PILL_H = 32;

// Bottom bar in the website's style (MobileTabBar.tsx): white, hairline on
// top, icon + small label. The active tab's yellow pill is drawn behind its
// own icon (so it's always centred on it) and grows in; the icon pops.
// Hidden while the keyboard is open so it doesn't cover what's being typed.
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const keyboardOpen = useKeyboardOpen();
  // Routes hidden with href: null don't get a button. expo-router turns
  // href: null into tabBarItemStyle { display: 'none' } (the href option
  // itself doesn't reach the tab bar).
  const routes = state.routes.filter((r) => {
    const style = descriptors[r.key].options.tabBarItemStyle as { display?: string } | undefined;
    return style?.display !== 'none';
  });

  if (keyboardOpen) return null;

  return (
    <View style={{ flexDirection: 'row', backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E3E3E3', paddingBottom: Math.max(insets.bottom, 6) }}>
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
            style={{ flex: 1, alignItems: 'center', paddingTop: 8, paddingBottom: 2 }}
          >
            <TabIcon focused={focused} badge={badge}>
              {options.tabBarIcon?.({ focused, color, size: 22 })}
            </TabIcon>
            <Text style={{ marginTop: 4, fontSize: 11, fontWeight: focused ? '800' : '500', color }} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ focused, badge, children }: { focused: boolean; badge?: string | number; children: React.ReactNode }) {
  const pill = useSharedValue(focused ? 1 : 0);
  const icon = useSharedValue(1);
  useEffect(() => {
    pill.value = withSpring(focused ? 1 : 0, { damping: 16, stiffness: 240 });
    if (focused) icon.value = withSequence(withTiming(0.82, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 260 }));
  }, [focused, pill, icon]);
  const pillStyle = useAnimatedStyle(() => ({ opacity: pill.value, transform: [{ scaleX: 0.5 + pill.value * 0.5 }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: icon.value }] }));

  return (
    <View style={{ width: PILL_W, height: PILL_H, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: PILL_W, height: PILL_H, borderRadius: PILL_H / 2, backgroundColor: '#FFCD00' }, pillStyle]} />
      <Animated.View style={iconStyle}>{children}</Animated.View>
      {badge ? (
        <View style={{ position: 'absolute', top: 0, right: 10, minWidth: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#B91C1C', alignItems: 'center' }}>
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#FFFFFF' }}>{badge}</Text>
        </View>
      ) : null}
    </View>
  );
}

function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);
  return open;
}
