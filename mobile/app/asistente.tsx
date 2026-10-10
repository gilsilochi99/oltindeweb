import { Redirect } from 'expo-router';

// The assistant now lives in the Buscar tab.
export default function AssistantRedirect() {
  return <Redirect href="/(tabs)/search" />;
}
