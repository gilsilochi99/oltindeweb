'use client';

import { deleteOffer } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Offer } from '@/lib/types';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface OffersListProps {
  companyId: string;
  offers: Offer[];
  onOfferDeleted: (offerId: string) => void;
}

export default function OffersList({ companyId, offers, onOfferDeleted }: OffersListProps) {
  const { toast } = useToast();

  const handleDelete = async (offerId: string) => {
    const result = await deleteOffer(companyId, offerId);
    if (result.success) {
      onOfferDeleted(offerId);
      toast({ title: 'Oferta eliminada', description: 'La oferta ha sido eliminada con éxito.' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
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
              <div key={offer.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  {offer.image && <Image src={offer.image} alt={offer.title} width={60} height={60} className="rounded-md" />}
                  <div>
                    <p className="font-semibold">{offer.title}</p>
                    <p className="text-sm text-muted-foreground">{offer.description}</p>
                    <p className="text-sm text-muted-foreground">Válida hasta: {new Date(offer.validUntil).toLocaleDateString()}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción eliminará permanentemente la oferta. No se puede deshacer.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(offer.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-muted-foreground">No hay ofertas publicadas.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
