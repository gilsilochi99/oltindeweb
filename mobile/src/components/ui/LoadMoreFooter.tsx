import { Pressable, Text } from 'react-native';

// "Load 10 more" footer shared by every directory list screen once its
// client-side page (see useSearchableList) has more items than currently shown.
export function LoadMoreFooter({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className="items-center rounded-lg border border-border bg-card py-3.5 active:opacity-70">
      <Text className="text-sm font-semibold text-secondary">Cargar más</Text>
    </Pressable>
  );
}
