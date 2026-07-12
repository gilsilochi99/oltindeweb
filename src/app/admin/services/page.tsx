
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServices } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Upload } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ServiceForm } from './_components/ServiceForm';
import { BulkUploadDialog } from './_components/BulkUploadDialog';
import type { Service } from '@/lib/types';

export default function AdminServicesPage() {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const { toast } = useToast();

    const fetchServices = useCallback(async () => {
        setIsLoading(true);
        try {
            const servicesData = await getServices();
            setServices(servicesData);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los servicios.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchServices();
    }, [fetchServices]);

    const handleFormSubmit = () => {
        setIsFormOpen(false);
        fetchServices();
    }
    
    const handleBulkUploadSuccess = () => {
        setIsBulkUploadOpen(false);
        fetchServices();
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Servicios</h1>
                    <p className="text-muted-foreground">Añadir, editar o eliminar servicios.</p>
                </div>
                <div className="flex gap-2">
                     <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Subir Excel
                    </Button>
                    <Button onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Servicio
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Servicios ({services.length})</CardTitle>
                    <CardDescription>Estos son todos los servicios disponibles en la plataforma.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Categoría</TableHead>
                                    <TableHead>Descripción</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {services.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-medium">{service.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{service.category}</Badge>
                                        </TableCell>
                                        <TableCell>{service.description}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Añadir Nuevo Servicio</DialogTitle>
                        <DialogDescription>
                            Complete los detalles del servicio a continuación.
                        </DialogDescription>
                    </DialogHeader>
                    <ServiceForm onFormSubmit={handleFormSubmit} />
                </DialogContent>
            </Dialog>

             <BulkUploadDialog 
                isOpen={isBulkUploadOpen}
                onOpenChange={setIsBulkUploadOpen}
                onUploadSuccess={handleBulkUploadSuccess}
            />
        </div>
    )
}
