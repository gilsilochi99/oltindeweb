'use client';

import { useState, useTransition } from 'react';
import { deleteOffer } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Offer } from '@/lib/types';
import Image from 'next/image';

interface OffersListProps {
  companyId: string;
  initialOffers: Offer[];
}

export default function OffersList({ companyId, initialOffers }: OffersListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [offers, setOffers] = useState<Offer[]>(initialOffers);

  const handleDelete = (offerId: string) => {
    startTransition(async () => {
      const result = await deleteOffer(companyId, offerId);
      if (result.success) {
        setOffers(offers.filter(offer => offer.id !== offerId));
        toast({ title: 'Oferta eliminada', description: 'La oferta ha sido eliminada con éxito.' });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ofertas Actuales</CardTitle>
        <CardDescription>Lista de todas las ofertas publicadas.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {offers.length > 0 ? (
            offers.map(offer => (
              <div key={offer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {offer.image && <Image src={offer.image} alt={offer.title} width={60} height={60} className="rounded-md" />}
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-gray-500">{offer.description}</p>
                    <p className="text-sm text-gray-500">Válida hasta: {new Date(offer.validUntil).toLocaleDateString()}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(offer.id)}
                  disabled={isPending}
                >
                  {isPending ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            ))
          ) : (
            <p>No hay ofertas publicadas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
