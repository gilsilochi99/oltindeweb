'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalListingForm } from '@/components/rentals/RentalListingForm';

export default function NewRentalPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const router = useRouter();
  return (
    <SellerGate companyId={companyId}>
      {company => (
        <div className="space-y-6 max-w-4xl">
          <div>
            <Link href={`/dashboard/companies/${companyId}/rentals`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver a alquileres</Link>
            <h1 className="text-3xl font-bold font-headline mt-2">Nuevo anuncio de alquiler</h1>
            <p className="text-muted-foreground">{company.name}</p>
          </div>
          <RentalListingForm companyId={companyId} onSaved={() => { router.push(`/dashboard/companies/${companyId}/rentals`); router.refresh(); }} />
        </div>
      )}
    </SellerGate>
  );
}
