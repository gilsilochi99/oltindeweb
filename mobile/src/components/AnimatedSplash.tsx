import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface AnimatedSplashProps {
  // Auth/data has resolved and the real app is ready to show. Exit only
  // starts once this AND the entrance animation are both done.
  ready: boolean;
  onExited: () => void;
}

const MARK = 160; // same size as the native splash image (app.json imageWidth)
const MARK_SMALL = 88;
const WORD_H = 46;
const WORD_W = Math.round((WORD_H * 1391) / 308); // wordmark.png aspect ratio

// Takes over from the native splash (white + the mark, see app.json) without
// a visible jump: the mark settles, shrinks and glides left while the
// "Oltinde" wordmark slides in beside it — the full website logo — then the
// screen fades into the app.
export function AnimatedSplash({ ready, onExited }: AnimatedSplashProps) {
  const [entranceDone, setEntranceDone] = useState(false);
  const [exiting, setExiting] = useState(false);

  const markScale = useSharedValue(1);
  const markX = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordX = useSharedValue(24);
  const container = useSharedValue(1);

  // Final layout: [mark][gap][wordmark], the whole group centred on screen.
  const GAP = 10;
  const group = MARK_SMALL + GAP + WORD_W;
  const markFinalX = -group / 2 + MARK_SMALL / 2;
  const wordFinalX = -group / 2 + MARK_SMALL + GAP + WORD_W / 2;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    markScale.value = withSequence(
      withTiming(1.06, { duration: 160, easing: Easing.out(Easing.quad) }),
      withSpring(MARK_SMALL / MARK, { damping: 14, stiffness: 140 }),
    );
    markX.value = withDelay(220, withSpring(markFinalX, { damping: 16, stiffness: 120 }));
    wordX.value = withDelay(330, withSpring(0, { damping: 16, stiffness: 120 }));
    wordOpacity.value = withDelay(330, withTiming(1, { duration: 320 }, (finished) => {
      if (finished) runOnJS(setEntranceDone)(true);
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && entranceDone && !exiting) {
      setExiting(true);
      container.value = withDelay(250, withTiming(0, { duration: 280 }, (finished) => {
        if (finished) runOnJS(onExited)();
      }));
    }
  }, [ready, entranceDone, exiting, container, onExited]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ translateX: markX.value }, { scale: markScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateX: wordFinalX + wordX.value }] }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      <View style={styles.row}>
        <Animated.View style={[styles.mark, markStyle]}>
          <Image source={require('../../assets/mark.png')} style={{ width: MARK, height: MARK }} contentFit="contain" />
        </Animated.View>
        <Animated.View style={[styles.word, wordStyle]}>
          <Image source={require('../../assets/wordmark.png')} style={{ width: WORD_W, height: WORD_H }} contentFit="contain" />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { width: '100%', height: MARK, alignItems: 'center', justifyContent: 'center' },
  mark: { position: 'absolute', width: MARK, height: MARK },
  word: { position: 'absolute', width: WORD_W, height: WORD_H },
});
