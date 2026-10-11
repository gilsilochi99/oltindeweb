'use client';

import { use, useMemo } from 'react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalEditView } from '@/components/rentals/dashboard/RentalEditView';
import { companyRentalOwner } from '@/components/rentals/dashboard/owner';
import type { Company } from '@/lib/types';

function Edit({ company, listingId }: { company: Company; listingId: string }) {
  const owner = useMemo(() => companyRentalOwner(company), [company.id, company.name]); // eslint-disable-line react-hooks/exhaustive-deps
  return <RentalEditView owner={owner} listingId={listingId} bookingsHref={`${owner.basePath}/bookings`} />;
}

export default function EditRentalPage({ params }: { params: Promise<{ companyId: string; listingId: string }> }) {
  const { companyId, listingId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <Edit company={company} listingId={listingId} />}</SellerGate>;
}
