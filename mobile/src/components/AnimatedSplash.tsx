import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
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

// One smooth, decelerating curve for every movement (no springs: their
// overshoot read as a wobble on slower phones).
const EASE = Easing.bezier(0.22, 1, 0.36, 1);

// Takes over from the native splash (white + the mark, see app.json) without
// a visible jump: once both logo images are decoded, the mark shrinks and
// glides left while the "Oltinde" wordmark slides in beside it — the full
// website logo — then the screen fades to reveal the app, which has been
// building underneath the whole time.
export function AnimatedSplash({ ready, onExited }: AnimatedSplashProps) {
  const [entranceDone, setEntranceDone] = useState(false);
  const [exiting, setExiting] = useState(false);
  const loaded = useRef(0);
  const started = useRef(false);

  const markScale = useSharedValue(1);
  const markX = useSharedValue(0);
  const wordOpacity = useSharedValue(0);
  const wordX = useSharedValue(20);
  const container = useSharedValue(1);

  // Final layout: [mark][gap][wordmark], the whole group centred on screen.
  const GAP = 10;
  const group = MARK_SMALL + GAP + WORD_W;
  const markFinalX = -group / 2 + MARK_SMALL / 2;
  const wordFinalX = -group / 2 + MARK_SMALL + GAP + WORD_W / 2;

  function start() {
    if (started.current) return;
    started.current = true;
    // The native splash shows the same mark at the same size, so hiding it
    // only now (with our copy already painted) is seamless.
    SplashScreen.hideAsync().catch(() => {});
    markScale.value = withDelay(80, withTiming(MARK_SMALL / MARK, { duration: 650, easing: EASE }));
    markX.value = withDelay(180, withTiming(markFinalX, { duration: 650, easing: EASE }));
    wordX.value = withDelay(320, withTiming(0, { duration: 600, easing: EASE }));
    wordOpacity.value = withDelay(320, withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }, (finished) => {
      if (finished) runOnJS(setEntranceDone)(true);
    }));
  }

  function onImageLoad() {
    loaded.current += 1;
    if (loaded.current >= 2) start();
  }

  // Never wait forever on image decoding.
  useEffect(() => {
    const t = setTimeout(start, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ready && entranceDone && !exiting) {
      setExiting(true);
      container.value = withDelay(200, withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) }, (finished) => {
        if (finished) runOnJS(onExited)();
      }));
    }
  }, [ready, entranceDone, exiting, container, onExited]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: container.value }));
  const markStyle = useAnimatedStyle(() => ({ transform: [{ translateX: markX.value }, { scale: markScale.value }] }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: wordOpacity.value, transform: [{ translateX: wordFinalX + wordX.value }] }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents={exiting ? 'none' : 'auto'}>
      <View style={styles.row}>
        <Animated.View style={[styles.mark, markStyle]}>
          <Image source={require('../../assets/mark.png')} style={{ width: MARK, height: MARK }} contentFit="contain" onLoad={onImageLoad} />
        </Animated.View>
        <Animated.View style={[styles.word, wordStyle]}>
          <Image source={require('../../assets/wordmark.png')} style={{ width: WORD_W, height: WORD_H }} contentFit="contain" onLoad={onImageLoad} />
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
