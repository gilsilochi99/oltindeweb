
'use client';

import { useEffect, useState, useCallback, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById, getEvents, getUniqueEventCategories, getUniqueCities } from '@/lib/data';
import { deleteEvent, toggleEventStatus } from '@/lib/actions';
import type { Company, CalendarEvent } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, MapPin, CalendarDays, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { EventForm } from '@/components/shared/EventForm';

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CompanyEventsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'Create' | 'Update'>('Create');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const companyData = await getCompanyById(companyId);
    if (!companyData || (companyData.ownerId !== user.uid && !isAdmin)) {
      notFound();
      return;
    }
    const [allEvents, cityList, categoryList] = await Promise.all([
      getEvents(),
      getUniqueCities(),
      getUniqueEventCategories(),
    ]);
    setCompany(companyData);
    setEvents(allEvents.filter(e => e.organizerType === 'company' && e.organizerId === companyId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    setCities(cityList);
    setCategories(categoryList);
    setIsLoading(false);
  }, [user, isAdmin, companyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenDialog = (type: 'Create' | 'Update', event?: CalendarEvent) => {
    setDialogType(type);
    setSelectedEvent(event);
    setIsDialogOpen(true);
  };

  const handleFormSubmit = () => {
    setIsDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (eventId: string) => {
    if (!user) return;
    const result = await deleteEvent(eventId, user.uid, isAdmin);
    if (result.success) {
      toast({ title: 'Evento eliminado' });
      fetchData();
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
  };

  const handleToggleStatus = async (eventId: string) => {
    if (!user) return;
    const result = await toggleEventStatus(eventId, user.uid, isAdmin);
    if (result.success) {
      toast({ title: result.status === 'scheduled' ? 'Evento reactivado' : 'Evento cancelado' });
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

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Gestionar Eventos</h1>
          <p className="text-muted-foreground">
            Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
          </p>
        </div>
        <Button onClick={() => handleOpenDialog('Create')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Publicar Evento
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos Publicados ({events.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <Card key={event.id} className="relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-base font-bold flex items-center gap-2">
                          <CalendarDays className="w-4 h-4 text-black" />
                          {event.title}
                          {event.status === 'cancelled' && <Badge variant="destructive">Cancelado</Badge>}
                        </CardTitle>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1.5">
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.city}</span>
                          <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{formatEventDate(event.startDate)}</span>
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
                            <DropdownMenuItem onClick={() => handleOpenDialog('Update', event)}>Editar</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(event.id)}>
                              {event.status === 'scheduled' ? 'Cancelar evento' : 'Reactivar evento'}
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
                              Esta acción no se puede deshacer. Esto eliminará permanentemente el evento.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(event.id)}>Sí, eliminar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/80 line-clamp-2">{event.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No hay eventos publicados para esta empresa.</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogType === 'Create' ? 'Publicar Nuevo Evento' : 'Editar Evento'}</DialogTitle>
            <DialogDescription>Complete los detalles del evento.</DialogDescription>
          </DialogHeader>
          {user && (
            <EventForm
              type={dialogType}
              initialData={selectedEvent}
              cities={cities}
              categories={categories}
              userId={user.uid}
              isAdmin={isAdmin}
              fixedOrganizer={{ type: 'company', id: company.id }}
              onFormSubmit={handleFormSubmit}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
