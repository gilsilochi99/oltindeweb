
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealthFacilities } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, MoreHorizontal, PlusCircle, Syringe } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { HealthFacility, HealthFacilityType } from '@/lib/types';
import { deleteHealthFacility, toggleHealthFacilityFeatured } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const TYPE_LABELS: Record<HealthFacilityType, string> = {
    hospital: 'Hospital',
    clinic: 'Clínica',
    pharmacy: 'Farmacia',
};

export default function AdminHealthPage() {
    const [facilities, setFacilities] = useState<HealthFacility[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | HealthFacilityType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const data = await getHealthFacilities();
        setFacilities(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredFacilities = useMemo(() => {
        return facilities
            .filter(f => activeTab === 'all' || f.type === activeTab)
            .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [facilities, activeTab, searchQuery]);

    const handleDelete = async (facilityId: string) => {
        const result = await deleteHealthFacility(facilityId);
        if (result.success) {
            toast({ title: 'Centro eliminado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    const handleToggleFeatured = async (facilityId: string) => {
        const result = await toggleHealthFacilityFeatured(facilityId);
        if (result.success) {
            toast({ title: result.newState ? 'Centro destacado' : 'Centro ya no destacado' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start gap-4 flex-wrap">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Salud</h1>
                    <p className="text-muted-foreground">Hospitales, clínicas y farmacias del directorio.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/admin/health/pharmacies-on-duty"><Syringe className="mr-2 h-4 w-4" /> Farmacias de Guardia</Link>
                    </Button>
                    <Button asChild>
                        <Link href="/admin/health/new"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Centro</Link>
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center flex-wrap gap-4">
                        <div>
                            <CardTitle>Centros de Salud ({filteredFacilities.length})</CardTitle>
                            <CardDescription>Hospitales, clínicas y farmacias publicados en la plataforma.</CardDescription>
                        </div>
                        <Input
                            placeholder="Buscar por nombre..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | HealthFacilityType)} className="mt-4">
                        <TabsList>
                            <TabsTrigger value="all">Todos</TabsTrigger>
                            <TabsTrigger value="hospital">Hospitales</TabsTrigger>
                            <TabsTrigger value="clinic">Clínicas</TabsTrigger>
                            <TabsTrigger value="pharmacy">Farmacias</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : filteredFacilities.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Destacado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredFacilities.map((facility) => (
                                    <TableRow key={facility.id}>
                                        <TableCell className="font-medium">{facility.name}</TableCell>
                                        <TableCell><Badge variant="secondary">{TYPE_LABELS[facility.type]}</Badge></TableCell>
                                        <TableCell>{facility.location.city}</TableCell>
                                        <TableCell>
                                            {facility.isFeatured ? (
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
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/health/${facility.id}/edit`}>Editar</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleFeatured(facility.id)}>
                                                            {facility.isFeatured ? 'Quitar de destacados' : 'Marcar como destacado'}
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
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente este centro de salud.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(facility.id)}>Sí, eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay centros de salud registrados todavía.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
