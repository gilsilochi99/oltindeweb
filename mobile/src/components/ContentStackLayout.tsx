import { Stack } from 'expo-router';

// Shared header chrome for every top-level content section (companies,
// procedures, jobs...) — one config, imported by each section's _layout.tsx,
// instead of repeating screenOptions in a dozen files. White bar with a
// hairline and a bold title like the website's header; screens slide in from
// the right with the platform's native animation.
export function ContentStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#000000',
        headerTitleStyle: { fontWeight: '800', fontSize: 17 },
        headerShadowVisible: true,
        headerBackTitle: '',
        contentStyle: { backgroundColor: '#FAFAFA' },
        animation: 'slide_from_right',
        animationDuration: 260,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
