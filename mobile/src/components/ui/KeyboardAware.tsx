import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

// Replacement for KeyboardAvoidingView that works on Android's edge-to-edge
// layout (where the window is no longer resized for the keyboard, so inputs
// at the bottom ended up hidden behind it). It measures where this view ends
// on screen and adds exactly the overlap with the keyboard as bottom padding,
// so it also works under a header without any offset to tune.
//
// It re-measures on every layout change too: the bottom tab bar hides when
// the keyboard opens, which makes this view taller right after the keyboard
// event — measuring only on the event left the input under the keyboard.
export function KeyboardAware({ children, className, style }: { children: ReactNode; className?: string; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  const keyboardTop = useRef<number | null>(null);
  const [padding, setPadding] = useState(0);

  // The view's outer frame doesn't include our own padding, so this is stable.
  const measure = useCallback(() => {
    const top = keyboardTop.current;
    if (top === null) return;
    ref.current?.measureInWindow((_x, y, _w, h) => {
      if (keyboardTop.current === null) return;
      const next = Math.max(0, Math.round(y + h - top));
      setPadding((prev) => (prev === next ? prev : next));
    });
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      keyboardTop.current = e.endCoordinates.screenY;
      measure();
      // Once more after the tab bar and other keyboard-driven changes settle.
      setTimeout(measure, 120);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      keyboardTop.current = null;
      setPadding(0);
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, [measure]);

  return (
    <View ref={ref} onLayout={measure} className={className ?? 'flex-1'} style={[{ paddingBottom: padding }, style]}>
      {children}
    </View>
  );
}
