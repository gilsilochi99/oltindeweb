

'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getEvents, getCompanies, getInstitutions, getUniqueEventCategories, getUniqueCities } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { CalendarEvent } from '@/lib/types';
import { deleteEvent, toggleEventStatus } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { EventForm } from '@/components/shared/EventForm';

function formatEventDate(iso: string): string {
    return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminEventsPage() {
    const [events, setEvents] = useState<CalendarEvent[]>([]);
    const [organizerOptions, setOrganizerOptions] = useState<{ companies: { id: string; name: string }[]; institutions: { id: string; name: string }[] }>({ companies: [], institutions: [] });
    const [cities, setCities] = useState<string[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'Create' | 'Update'>('Create');
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | undefined>(undefined);
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();

    const fetchData = useCallback(async () => {
        const [eventsData, companies, institutions, categoryList, cityList] = await Promise.all([
            getEvents(),
            getCompanies(),
            getInstitutions(),
            getUniqueEventCategories(),
            getUniqueCities(),
        ]);
        eventsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEvents(eventsData);
        setOrganizerOptions({
            companies: companies.map(c => ({ id: c.id, name: c.name })),
            institutions: institutions.map(i => ({ id: i.id, name: i.name })),
        });
        setCategories(categoryList);
        setCities(cityList);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredEvents = useMemo(() => {
        return events.filter(event =>
            event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            event.organizerName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [events, searchQuery]);

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
        const result = await deleteEvent(eventId, user.uid, true);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Evento eliminado correctamente.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleToggleStatus = async (eventId: string) => {
        if (!user) return;
        const result = await toggleEventStatus(eventId, user.uid, true);
        if (result.success) {
            toast({ title: result.status === 'scheduled' ? 'Evento reactivado' : 'Evento cancelado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Eventos</h1>
                    <p className="text-muted-foreground">Supervisar todos los eventos publicados en la plataforma.</p>
                </div>
                <Button onClick={() => handleOpenDialog('Create')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Evento
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Eventos ({filteredEvents.length})</CardTitle>
                            <CardDescription>Eventos organizados por empresas e instituciones.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por título u organizador..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Título</TableHead>
                                <TableHead>Organizador</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredEvents.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/events/${event.id}`} target="_blank" className="hover:underline hover:text-primary">{event.title}</Link>
                                    </TableCell>
                                    <TableCell>{event.organizerName}</TableCell>
                                    <TableCell>{event.city}</TableCell>
                                    <TableCell>{formatEventDate(event.startDate)}</TableCell>
                                    <TableCell>
                                        {event.status === 'scheduled' ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Programado</Badge>
                                        ) : (
                                            <Badge variant="destructive">Cancelado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-right">
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
                                                    {isAdmin && (
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive">Eliminar</DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    )}
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
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{dialogType === 'Create' ? 'Crear Nuevo Evento' : 'Editar Evento'}</DialogTitle>
                        <DialogDescription>Complete los detalles del evento a continuación.</DialogDescription>
                    </DialogHeader>
                    {user && (
                        <EventForm
                            type={dialogType}
                            initialData={selectedEvent}
                            cities={cities}
                            categories={categories}
                            userId={user.uid}
                            isAdmin={true}
                            organizerOptions={organizerOptions}
                            onFormSubmit={handleFormSubmit}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
