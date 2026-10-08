import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(({ label, error, className, ...props }, ref) => {
  return (
    <View className="gap-1.5">
      {label ? <Text className="text-sm font-medium text-foreground">{label}</Text> : null}
      <TextInput
        ref={ref}
        placeholderTextColor="#9CA3AF"
        className={`h-12 rounded-lg border border-input bg-card px-3 text-base text-foreground ${error ? 'border-destructive' : ''} ${className ?? ''}`}
        {...props}
      />
      {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
    </View>
  );
});
TextField.displayName = 'TextField';
