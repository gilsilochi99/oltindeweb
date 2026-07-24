
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getHealthFacilitiesByType } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { Loader2, Upload, PlusCircle, ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { HealthFacility } from '@/lib/types';
import { PharmacyDutyUploadDialog } from '../_components/PharmacyDutyUploadDialog';

function currentMonthLabel() {
    return new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export default function AdminPharmaciesOnDutyPage() {
    const [pharmacies, setPharmacies] = useState<HealthFacility[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploadOpen, setIsUploadOpen] = useState(false);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        const data = await getHealthFacilitiesByType('pharmacy');
        data.sort((a, b) => a.name.localeCompare(b.name));
        setPharmacies(data);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
    const monthPrefix = useMemo(() => today.slice(0, 7), [today]);

    const rows = useMemo(() => pharmacies.map(pharmacy => {
        const thisMonthDates = (pharmacy.onDutyDates || []).filter(d => d.startsWith(monthPrefix)).sort();
        const isOnDutyToday = thisMonthDates.includes(today);
        return { pharmacy, thisMonthDates, isOnDutyToday };
    }), [pharmacies, monthPrefix, today]);

    const handleUploadSuccess = () => {
        setIsUploadOpen(false);
        fetchData();
    };

    return (
        <div className="space-y-6">
            <div>
                <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2">
                    <Link href="/admin/health"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Salud</Link>
                </Button>
                <div className="flex justify-between items-start gap-4 flex-wrap">
                    <div>
                        <h1 className="text-2xl font-bold font-headline">Farmacias de Guardia</h1>
                        <p className="text-muted-foreground">Calendario de guardia — {currentMonthLabel()}.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/admin/health/new?type=pharmacy"><PlusCircle className="mr-2 h-4 w-4" /> Añadir Farmacia</Link>
                        </Button>
                        <Button onClick={() => setIsUploadOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" /> Subir Calendario Mensual
                        </Button>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Farmacias ({pharmacies.length})</CardTitle>
                    <CardDescription>Días de guardia registrados este mes para cada farmacia.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : rows.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Ciudad</TableHead>
                                    <TableHead>Días de Guardia (este mes)</TableHead>
                                    <TableHead>En Guardia Hoy</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {rows.map(({ pharmacy, thisMonthDates, isOnDutyToday }) => (
                                    <TableRow key={pharmacy.id}>
                                        <TableCell className="font-medium">{pharmacy.name}</TableCell>
                                        <TableCell>{pharmacy.branches?.[0]?.location.city}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {thisMonthDates.length > 0
                                                ? thisMonthDates.map(d => d.slice(8, 10)).join(', ')
                                                : 'Sin días asignados'}
                                        </TableCell>
                                        <TableCell>
                                            {isOnDutyToday ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800">Sí</Badge>
                                            ) : (
                                                <Badge variant="outline">No</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">No hay farmacias registradas todavía.</p>
                    )}
                </CardContent>
            </Card>

            <PharmacyDutyUploadDialog
                isOpen={isUploadOpen}
                onOpenChange={setIsUploadOpen}
                onUploadSuccess={handleUploadSuccess}
            />
        </div>
    );
}
