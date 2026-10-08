import { Pressable } from 'react-native';
import { Search, X } from 'lucide-react-native';

// Header-right search toggle shared by every directory list screen: a plain
// magnifying-glass icon that flips to an X once the inline search bar (see
// each index.tsx's use of useSearchableList) is expanded below the header.
export function ListSearchHeaderButton({ isSearching, onToggle }: { isSearching: boolean; onToggle: () => void }) {
  return (
    <Pressable onPress={onToggle} hitSlop={8}>
      {isSearching ? <X size={22} color="#1A1C1C" /> : <Search size={22} color="#1A1C1C" />}
    </Pressable>
  );
}
