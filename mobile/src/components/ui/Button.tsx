import type { ReactNode } from 'react';
import { ActivityIndicator, Text, type PressableProps } from 'react-native';
import { PressableScale } from './motion';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'dark';

interface ButtonProps extends Omit<PressableProps, 'children' | 'style'> {
  children: ReactNode;
  variant?: Variant;
  loading?: boolean;
}

// Same shapes as the website's buttons: square corners, yellow primary with
// black text, blue secondary, thin-bordered outline.
const VARIANT_CONTAINER: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  outline: 'bg-card border border-foreground/25',
  ghost: 'bg-transparent',
  dark: 'bg-[#111111]',
};

const VARIANT_TEXT: Record<Variant, string> = {
  primary: 'text-primary-foreground',
  secondary: 'text-secondary-foreground',
  outline: 'text-foreground',
  ghost: 'text-foreground',
  dark: 'text-white',
};

export function Button({ children, variant = 'primary', loading, disabled, className, ...props }: ButtonProps & { className?: string }) {
  const isDisabled = disabled || loading;
  return (
    <PressableScale
      disabled={isDisabled}
      scaleTo={0.97}
      haptic={variant === 'ghost' ? 'none' : 'light'}
      className={`h-12 flex-row items-center justify-center rounded-md px-4 ${VARIANT_CONTAINER[variant]} ${isDisabled ? 'opacity-50' : ''} ${className ?? ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' || variant === 'outline' || variant === 'ghost' ? '#000' : '#fff'} />
      ) : (
        <Text className={`text-base font-semibold ${VARIANT_TEXT[variant]}`}>{children}</Text>
      )}
    </PressableScale>
  );
}
