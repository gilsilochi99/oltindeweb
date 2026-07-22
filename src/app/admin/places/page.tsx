
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPendingTouristLocations, getAllTouristLocationsForAdmin } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, CheckCircle2, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import type { TouristLocation } from '@/lib/types';
import { reviewTouristLocation, deleteTouristLocation, toggleTouristLocationFeatured } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

export default function AdminPlacesPage() {
    const [pending, setPending] = useState<TouristLocation[]>([]);
    const [allLocations, setAllLocations] = useState<TouristLocation[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { user, isAdmin, isManager } = useAuth();
    const canModerate = isAdmin || isManager;

    const fetchData = async () => {
        const [pendingData, allData] = await Promise.all([
            getPendingTouristLocations(),
            getAllTouristLocationsForAdmin(),
        ]);
        setPending(pendingData);
        setAllLocations(allData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const approvedLocations = useMemo(() => {
        return allLocations
            .filter(l => l.status === 'approved')
            .filter(l => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [allLocations, searchQuery]);

    const handleReview = async (locationId: string, decision: 'approved' | 'rejected') => {
        if (!user) return;
        const result = await reviewTouristLocation(locationId, user.uid, canModerate, decision);
        if (result.success) {
            toast({ title: decision === 'approved' ? 'Lugar aprobado' : 'Lugar rechazado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleDelete = async (locationId: string) => {
        if (!user) return;
        const result = await deleteTouristLocation(locationId, user.uid, canModerate);
        if (result.success) {
            toast({ title: 'Lugar eliminado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleToggleFeatured = async (locationId: string) => {
        const result = await toggleTouristLocationFeatured(locationId);
        if (result.success) {
            toast({ title: result.newState ? 'Lugar destacado' : 'Lugar ya no destacado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Lugares Turísticos</h1>
                    <p className="text-muted-foreground">Revise las sugerencias de la comunidad y administre los lugares publicados.</p>
                </div>
                <Button asChild>
                    <Link href="/admin/places/new">Añadir Lugar</Link>
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Pendientes de Revisión ({pending.length})</CardTitle>
                    <CardDescription>Sugerencias enviadas por usuarios, esperando aprobación.</CardDescription>
                </CardHeader>
                <CardContent>
                    {pending.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pending.map((location) => (
                                    <TableRow key={location.id}>
                                        <TableCell className="font-medium">{location.name}</TableCell>
                                        <TableCell>{location.category}</TableCell>
                                        <TableCell>{location.location.city}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" onClick={() => handleReview(location.id, 'approved')}>
                                                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-green-600" /> Aprobar
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={() => handleReview(location.id, 'rejected')}>
                                                    <XCircle className="w-4 h-4 mr-1.5 text-destructive" /> Rechazar
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay sugerencias pendientes.</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Lugares Publicados ({approvedLocations.length})</CardTitle>
                            <CardDescription>Lugares turísticos visibles públicamente.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por nombre..."
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
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Ciudad</TableHead>
                                <TableHead>Destacado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {approvedLocations.map((location) => (
                                <TableRow key={location.id}>
                                    <TableCell className="font-medium">
                                        <Link href={`/places/${location.id}`} target="_blank" className="hover:underline hover:text-black">{location.name}</Link>
                                    </TableCell>
                                    <TableCell>{location.category}</TableCell>
                                    <TableCell>{location.location.city}</TableCell>
                                    <TableCell>
                                        {location.isFeatured ? (
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
                                                    <DropdownMenuItem onClick={() => handleToggleFeatured(location.id)}>
                                                        {location.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/admin/places/${location.id}/edit`}>Editar</Link>
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
                                                        Esta acción no se puede deshacer. Esto eliminará permanentemente el lugar turístico.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDelete(location.id)}>Sí, eliminar</AlertDialogAction>
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
