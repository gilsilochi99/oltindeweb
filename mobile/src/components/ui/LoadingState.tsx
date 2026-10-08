import { useEffect } from 'react';
import { View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated';
import { ListSkeleton } from './motion';

// Loading placeholder. "list" shows shimmering cards in the shape of the
// list that's coming; "page" (default) a softly pulsing Oltinde mark.
export function LoadingState({ variant = 'page' }: { variant?: 'page' | 'list' }) {
  if (variant === 'list') return <ListSkeleton />;
  return <PulsingMark />;
}

function PulsingMark() {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0.6);
  useEffect(() => {
    const ease = Easing.inOut(Easing.quad);
    scale.value = withRepeat(withSequence(withTiming(1.05, { duration: 650, easing: ease }), withTiming(0.9, { duration: 650, easing: ease })), -1);
    opacity.value = withRepeat(withSequence(withTiming(1, { duration: 650, easing: ease }), withTiming(0.6, { duration: 650, easing: ease })), -1);
  }, [scale, opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  return (
    <View className="flex-1 items-center justify-center py-16">
      <Animated.View style={style}>
        <Image source={require('../../../assets/mark.png')} style={{ width: 52, height: 55 }} contentFit="contain" accessibilityLabel="Cargando" />
      </Animated.View>
    </View>
  );
}
