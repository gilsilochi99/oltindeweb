import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Phase 1+ replaces each of these with real list/detail screens per the
// roadmap in the mobile app plan — this just proves the tab/auth shell
// works end-to-end for now.
export function PlaceholderScreen({ title, description }: { title: string; description: string }) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-background px-8" edges={['top']}>
      <Text className="mb-2 text-xl font-semibold text-foreground">{title}</Text>
      <Text className="text-center text-base text-muted-foreground">{description}</Text>
    </SafeAreaView>
  );
}
