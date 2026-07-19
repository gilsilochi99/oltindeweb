
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { getItinerariesByAuthor } from '@/lib/data';
import { deleteItinerary } from '@/lib/actions';
import type { Itinerary } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, MapPin, CalendarDays, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

export default function DashboardItinerariesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getItinerariesByAuthor(user.uid);
    setItineraries(data);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (itineraryId: string) => {
    if (!user) return;
    const result = await deleteItinerary(itineraryId, user.uid);
    if (result.success) {
      toast({ title: 'Itinerario eliminado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Mis Itinerarios</h1>
          <p className="text-muted-foreground">Cree y comparta planes de viaje con la comunidad.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/itineraries/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Itinerario
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Itinerarios Creados ({itineraries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {itineraries.length > 0 ? (
            <div className="space-y-4">
              {itineraries.map((itinerary) => (
                <Card key={itinerary.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2 flex-wrap">
                          {itinerary.title}
                          {itinerary.visibility === 'unlisted' && <Badge variant="secondary">No listado</Badge>}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{itinerary.city}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{itinerary.durationDays} día{itinerary.durationDays === 1 ? '' : 's'}</span>
                          <span>{itinerary.stops.length} parada{itinerary.stops.length === 1 ? '' : 's'}</span>
                        </div>
                      </div>
                      <AlertDialog>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Abrir menú</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/itineraries/${itinerary.id}`} target="_blank">Ver Público</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/itineraries/${itinerary.id}`}>Editar</Link>
                            </DropdownMenuItem>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                            </AlertDialogTrigger>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el itinerario.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(itinerary.id)}>Sí, eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 line-clamp-2">{itinerary.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Todavía no ha creado ningún itinerario.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
