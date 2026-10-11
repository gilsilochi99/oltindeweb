'use client';

import { RentalsListingsView } from '@/components/rentals/dashboard/RentalsListingsView';
import { PRIVATE_RENTAL_OWNER } from '@/components/rentals/dashboard/owner';

export default function MyRentalsPage() {
  return <RentalsListingsView owner={PRIVATE_RENTAL_OWNER} />;
}
