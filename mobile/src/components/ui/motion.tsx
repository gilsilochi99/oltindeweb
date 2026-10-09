// Motion primitives shared by every screen: a pressable that springs down a
// little when touched (with a light haptic tick), staggered entrance
// animations for lists, and shimmering placeholders while data loads.
import { useEffect, type ReactNode } from 'react';
import { Pressable, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, {
  FadeInDown,
  FadeInRight,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const PRESS_SPRING = { damping: 18, stiffness: 420, mass: 0.6 };

type Haptic = 'light' | 'medium' | 'selection' | 'none';

export function tick(kind: Haptic = 'light') {
  if (kind === 'none') return;
  if (kind === 'selection') Haptics.selectionAsync().catch(() => {});
  else Haptics.impactAsync(kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  children: ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: Haptic;
}

// Classes that size or place the element in its parent go on the outer
// (animated) wrapper; everything else (background, border, padding, content
// alignment) on the inner Pressable, which fills it.
const LAYOUT_CLASS = /^-?(flex-1|flex-auto|flex-none|grow|grow-0|shrink|shrink-0|self-\S+|w-\S+|min-w-\S+|max-w-\S+|h-\S+|min-h-\S+|max-h-\S+|basis-\S+|m[trblxy]?-\S+|absolute|relative|inset\S*|top-\S+|bottom-\S+|left-\S+|right-\S+|z-\S+)$/;

function splitClasses(className?: string): [string, string] {
  const outer: string[] = [];
  const inner: string[] = [];
  for (const c of (className ?? '').split(/\s+/).filter(Boolean)) (LAYOUT_CLASS.test(c) ? outer : inner).push(c);
  return [outer.join(' '), inner.join(' ')];
}

// Use instead of Pressable for anything tappable that looks like a card,
// tile or button: it springs down a little when touched, with a haptic tick.
// (classNames are applied to plain Views — NativeWind doesn't style
// Reanimated components — and only the transform is animated.)
export function PressableScale({ children, scaleTo = 0.96, haptic = 'light', onPressIn, onPressOut, onPress, style, disabled, className, ...props }: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const [outerClass, innerClass] = splitClasses(className);
  return (
    <View className={outerClass}>
      <Animated.View style={[{ flexGrow: 1 }, animated]}>
        <Pressable
          {...props}
          className={`flex-grow ${innerClass}`}
          disabled={disabled}
          onPressIn={(e) => {
            scale.value = withSpring(scaleTo, PRESS_SPRING);
            onPressIn?.(e);
          }}
          onPressOut={(e) => {
            scale.value = withSpring(1, PRESS_SPRING);
            onPressOut?.(e);
          }}
          onPress={(e) => {
            tick(haptic);
            onPress?.(e);
          }}
          style={style}
        >
          {children}
        </Pressable>
      </Animated.View>
    </View>
  );
}

// Entrance for the i-th item of a list or section: rises and fades in, a
// little after the one before it (capped so long lists don't lag).
export function FadeInItem({ index = 0, children, className, style, horizontal }: { index?: number; children: ReactNode; className?: string; style?: StyleProp<ViewStyle>; horizontal?: boolean }) {
  const delay = Math.min(index, 8) * 55;
  const entering = (horizontal ? FadeInRight : FadeInDown).delay(delay).duration(380).springify().damping(18).reduceMotion(ReduceMotion.System);
  // classNames go on a plain inner View: the animated wrapper only animates.
  return (
    <Animated.View entering={entering} style={style}>
      {className ? <View className={className}>{children}</View> : children}
    </Animated.View>
  );
}

// Shimmering grey block shown in place of content while it loads.
export function Skeleton({ className, style }: { className?: string; style?: StyleProp<ViewStyle> }) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 650 }), withTiming(0.55, { duration: 650 })), -1, false);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <View className={`overflow-hidden rounded-lg ${className ?? ''}`} style={style}>
      <Animated.View style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#EDEDED' }, animated]} />
    </View>
  );
}

// Placeholder list of cards (photo left, two text lines) for list screens.
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <View className="gap-3 px-4 py-4">
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} className="flex-row gap-3 rounded-lg border border-border bg-card p-3">
          <Skeleton className="h-20 w-20" />
          <View className="flex-1 justify-center gap-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </View>
        </View>
      ))}
    </View>
  );
}

// Placeholder grid of product-style tiles.
export function GridSkeleton({ count = 4, width }: { count?: number; width: number }) {
  return (
    <View className="flex-row flex-wrap gap-3 px-4 py-4">
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={{ width }} className="gap-2 rounded-lg border border-border bg-card p-2.5">
          <Skeleton style={{ width: width - 22, height: width - 22 }} />
          <Skeleton className="h-3.5 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
        </View>
      ))}
    </View>
  );
}
