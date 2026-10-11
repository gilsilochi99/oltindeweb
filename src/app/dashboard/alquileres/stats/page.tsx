'use client';

import { RentalsStatsView } from '@/components/rentals/dashboard/RentalsStatsView';
import { PRIVATE_RENTAL_OWNER } from '@/components/rentals/dashboard/owner';

export default function MyRentalStatsPage() {
  return <RentalsStatsView owner={PRIVATE_RENTAL_OWNER} />;
}
