'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { RentalListingForm } from '@/components/rentals/RentalListingForm';
import type { RentalOwner } from './owner';

export function RentalNewView({ owner }: { owner: RentalOwner }) {
  const router = useRouter();
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href={owner.basePath} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver a alquileres</Link>
        <h1 className="text-3xl font-bold font-headline mt-2">Nuevo anuncio de alquiler</h1>
        <p className="text-muted-foreground">{owner.isIndividual ? 'Como particular' : owner.name}</p>
      </div>
      <RentalListingForm scope={owner.scope} onSaved={() => { router.push(owner.basePath); router.refresh(); }} />
    </div>
  );
}
