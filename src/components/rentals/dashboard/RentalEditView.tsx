'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RentalListingForm } from '@/components/rentals/RentalListingForm';
import { AvailabilityManager } from '@/components/rentals/AvailabilityManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getListingForEdit } from '@/lib/rentals/actions';
import { RENTAL_STATUS_LABELS, type RentalListing } from '@/lib/rentals/types';
import type { RentalOwner } from './owner';

// The listing must belong to this owner (a company's page can't open a
// private listing and the other way round).
function belongs(l: RentalListing, owner: RentalOwner) {
  return owner.isIndividual ? l.isIndividual : l.companyId === owner.scope;
}

export function RentalEditView({ owner, listingId, bookingsHref }: { owner: RentalOwner; listingId: string; bookingsHref: string }) {
  const [listing, setListing] = useState<RentalListing | null | 'missing'>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    getListingForEdit(listingId).then(l => setListing(l && belongs(l, owner) ? l : 'missing'));
  }, [listingId, owner, formKey]);

  if (listing === 'missing') notFound();

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <Link href={owner.basePath} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver a alquileres</Link>
        <h1 className="text-3xl font-bold font-headline mt-2 flex items-center gap-3 flex-wrap">
          Editar anuncio
          {listing && <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>{RENTAL_STATUS_LABELS[listing.status]}</Badge>}
        </h1>
        <p className="text-muted-foreground">{owner.isIndividual ? 'Como particular' : owner.name}</p>
      </div>
      {listing === null ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : (
        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Detalles</TabsTrigger>
            <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
          </TabsList>
          <TabsContent value="details" className="mt-4">
            <RentalListingForm key={formKey} scope={owner.scope} initialData={listing} onSaved={() => { setListing(null); setFormKey(k => k + 1); }} />
          </TabsContent>
          <TabsContent value="availability" className="mt-4">
            <AvailabilityManager listingId={listing.id} bookingsHref={bookingsHref} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
