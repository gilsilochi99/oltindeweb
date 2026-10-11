'use client';

import { use } from 'react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalsListingsView } from '@/components/rentals/dashboard/RentalsListingsView';
import { companyRentalOwner } from '@/components/rentals/dashboard/owner';

export default function RentalsDashboardPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <RentalsListingsView owner={companyRentalOwner(company)} />}</SellerGate>;
}
