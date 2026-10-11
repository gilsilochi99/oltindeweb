'use client';

import { use } from 'react';
import { RentalEditView } from '@/components/rentals/dashboard/RentalEditView';
import { PRIVATE_RENTAL_OWNER } from '@/components/rentals/dashboard/owner';

export default function MyEditRentalPage({ params }: { params: Promise<{ listingId: string }> }) {
  const { listingId } = use(params);
  return <RentalEditView owner={PRIVATE_RENTAL_OWNER} listingId={listingId} bookingsHref="/dashboard/alquileres/bookings" />;
}
