
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllItinerariesForAdmin } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { Itinerary } from '@/lib/types';
import { deleteItinerary, toggleItineraryFeatured } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AdminItinerariesPage() {
    const [itineraries, setItineraries] = useState<Itinerary[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { user, isAdmin } = useAuth();

    const fetchData = async () => {
        const data = await getAllItinerariesForAdmin();
        setItineraries(data);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredItineraries = useMemo(() => {
        return itineraries.filter(itinerary =>
            itinerary.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            itinerary.authorName.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [itineraries, searchQuery]);

    const handleDelete = async (itineraryId: string) => {
        if (!user) return;
        const result = await deleteItinerary(itineraryId, user.uid, true);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Itinerario eliminado correctamente.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleToggleFeatured = async (itineraryId: string) => {
        const result = await toggleItineraryFeatured(itineraryId);
        if (result.success) {
            toast({ title: result.newState ? 'Itinerario destacado' : 'Itinerario ya no destacado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold font-headline">Gestionar Itinerarios</h1>
                <p className="text-muted-foreground">Supervisar los itinerarios creados por la comunidad.</p>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Itinerarios ({filteredItineraries.length})</CardTitle>
                            <CardDescription>Todos los itinerarios creados por usuarios.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por título o autor..."
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
                                <TableHead>Autor</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>Visibilidad</TableHead>
                                <TableHead>Destacado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItineraries.map((itinerary) => (
                                <TableRow key={itinerary.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/itineraries/${itinerary.id}`} target="_blank" className="hover:underline hover:text-black">{itinerary.title}</Link>
                                    </TableCell>
                                    <TableCell>{itinerary.authorName}</TableCell>
                                    <TableCell>{itinerary.city}</TableCell>
                                    <TableCell>
                                        {itinerary.visibility === 'public' ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Público</Badge>
                                        ) : (
                                            <Badge variant="outline">No listado</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {itinerary.isFeatured ? (
                                            <Badge variant="secondary" className="bg-green-100 text-green-800">Sí</Badge>
                                        ) : (
                                            <Badge variant="outline">No</Badge>
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
                                                    <DropdownMenuItem onClick={() => handleToggleFeatured(itinerary.id)}>
                                                        {itinerary.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
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
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el itinerario.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(itinerary.id)}>Sí, eliminar</AlertDialogAction>
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
        </div>
    )
}
