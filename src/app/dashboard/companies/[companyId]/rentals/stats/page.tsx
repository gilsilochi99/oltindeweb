'use client';

import { use } from 'react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalsStatsView } from '@/components/rentals/dashboard/RentalsStatsView';
import { companyRentalOwner } from '@/components/rentals/dashboard/owner';

export default function RentalStatsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <RentalsStatsView owner={companyRentalOwner(company)} />}</SellerGate>;
}
