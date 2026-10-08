'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalListingForm } from '@/components/rentals/RentalListingForm';
import { AvailabilityManager } from '@/components/rentals/AvailabilityManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getListingForEdit } from '@/lib/rentals/actions';
import { RENTAL_STATUS_LABELS, type RentalListing } from '@/lib/rentals/types';

export default function EditRentalPage({ params }: { params: Promise<{ companyId: string; listingId: string }> }) {
  const { companyId, listingId } = use(params);
  const [listing, setListing] = useState<RentalListing | null | 'missing'>(null);
  const [formKey, setFormKey] = useState(0);

  useEffect(() => {
    getListingForEdit(listingId).then(l => setListing(l && l.companyId === companyId ? l : 'missing'));
  }, [listingId, companyId, formKey]);

  if (listing === 'missing') notFound();

  return (
    <SellerGate companyId={companyId} feature="rentals">
      {company => (
        <div className="space-y-6 max-w-4xl">
          <div>
            <Link href={`/dashboard/companies/${companyId}/rentals`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Volver a alquileres</Link>
            <h1 className="text-3xl font-bold font-headline mt-2 flex items-center gap-3 flex-wrap">
              Editar anuncio
              {listing && <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>{RENTAL_STATUS_LABELS[listing.status]}</Badge>}
            </h1>
            <p className="text-muted-foreground">{company.name}</p>
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
                <RentalListingForm key={formKey} companyId={companyId} initialData={listing} onSaved={() => { setListing(null); setFormKey(k => k + 1); }} />
              </TabsContent>
              <TabsContent value="availability" className="mt-4">
                <AvailabilityManager listingId={listing.id} companyId={companyId} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      )}
    </SellerGate>
  );
}
