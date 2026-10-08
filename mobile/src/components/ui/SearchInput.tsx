import { Pressable, TextInput, View, type TextInputProps } from 'react-native';
import { Search, X } from 'lucide-react-native';

interface SearchInputProps extends TextInputProps {
  containerClassName?: string;
}

export function SearchInput({ containerClassName, ...props }: SearchInputProps) {
  const { value, onChangeText } = props;
  return (
    <View className={`flex-row items-center gap-2 rounded-lg border border-input bg-card px-3 ${containerClassName ?? ''}`}>
      <Search size={18} color="#8A8A8A" />
      <TextInput
        placeholderTextColor="#9CA3AF"
        className="h-12 flex-1 text-base text-foreground"
        {...props}
      />
      {value ? (
        <Pressable onPress={() => onChangeText?.('')} hitSlop={8}>
          <X size={16} color="#8A8A8A" />
        </Pressable>
      ) : null}
    </View>
  );
}
