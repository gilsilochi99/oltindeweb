import { View } from 'react-native';
import { SearchInput } from './SearchInput';

interface ListSearchBarProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

// Inline search row every directory list screen reveals under its header
// when the search icon (ListSearchHeaderButton) is tapped.
export function ListSearchBar({ visible, value, onChangeText, placeholder }: ListSearchBarProps) {
  if (!visible) return null;
  return (
    <View className="px-4 pb-3 pt-1">
      <SearchInput placeholder={placeholder} value={value} onChangeText={onChangeText} autoFocus returnKeyType="search" />
    </View>
  );
}
