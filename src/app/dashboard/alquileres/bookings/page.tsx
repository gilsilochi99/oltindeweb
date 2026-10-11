'use client';

import { RentalsBookingsView } from '@/components/rentals/dashboard/RentalsBookingsView';
import { PRIVATE_RENTAL_OWNER } from '@/components/rentals/dashboard/owner';

export default function MyRentalBookingsPage() {
  return <RentalsBookingsView owner={PRIVATE_RENTAL_OWNER} />;
}
