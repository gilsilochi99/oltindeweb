import { redirect } from 'next/navigation';

// The old business advisor was replaced by the Asistente Oltinde.
export default function AdvisorPage() {
  redirect('/search');
}
