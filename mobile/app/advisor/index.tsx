import { Redirect } from 'expo-router';

// The old business advisor was replaced by the Asistente Oltinde (Buscar tab).
export default function AdvisorRedirect() {
  return <Redirect href="/(tabs)/search" />;
}
