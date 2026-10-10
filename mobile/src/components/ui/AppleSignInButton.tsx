import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '../../hooks/use-auth';

// Apple's own "Continuar con Apple" button — iPhone/iPad only (the App Store
// requires it next to Google sign-in); renders nothing on Android.
export function AppleSignInButton() {
  const { signInWithApple } = useAuth();
  const [available, setAvailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    AppleAuthentication.isAvailableAsync().then(setAvailable).catch(() => setAvailable(false));
  }, []);

  if (!available) return null;

  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
      buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
      cornerRadius={6}
      style={{ height: 48, width: '100%', opacity: busy ? 0.6 : 1 }}
      onPress={async () => {
        if (busy) return;
        setBusy(true);
        try {
          await signInWithApple();
        } catch (error) {
          Alert.alert('No se pudo iniciar sesión con Apple', error instanceof Error ? error.message : 'Inténtalo de nuevo.');
        } finally {
          setBusy(false);
        }
      }}
    />
  );
}
