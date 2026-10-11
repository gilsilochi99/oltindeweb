'use client';

import { RentalNewView } from '@/components/rentals/dashboard/RentalNewView';
import { PRIVATE_RENTAL_OWNER } from '@/components/rentals/dashboard/owner';

export default function MyNewRentalPage() {
  return <RentalNewView owner={PRIVATE_RENTAL_OWNER} />;
}
