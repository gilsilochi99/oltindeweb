'use client';

import { use } from 'react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalsBookingsView } from '@/components/rentals/dashboard/RentalsBookingsView';
import { companyRentalOwner } from '@/components/rentals/dashboard/owner';

export default function RentalBookingsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <RentalsBookingsView owner={companyRentalOwner(company)} />}</SellerGate>;
}
