import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Keyboard, Platform, View, type StyleProp, type ViewStyle } from 'react-native';

// Replacement for KeyboardAvoidingView that works on Android's edge-to-edge
// layout (where the window is no longer resized for the keyboard, so inputs
// at the bottom ended up hidden behind it). It measures where this view ends
// on screen and adds exactly the overlap with the keyboard as bottom padding,
// so it also works under a header without any offset to tune.
export function KeyboardAware({ children, className, style }: { children: ReactNode; className?: string; style?: StyleProp<ViewStyle> }) {
  const ref = useRef<View>(null);
  const [padding, setPadding] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (e) => {
      const keyboardTop = e.endCoordinates.screenY;
      ref.current?.measureInWindow((_x, y, _w, h) => {
        setPadding(Math.max(0, y + h - keyboardTop));
      });
    });
    const hide = Keyboard.addListener(hideEvent, () => setPadding(0));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return (
    <View ref={ref} className={className ?? 'flex-1'} style={[{ paddingBottom: padding }, style]}>
      {children}
    </View>
  );
}
