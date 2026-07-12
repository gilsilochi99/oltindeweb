

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getInstitutions, getUniqueCategories, getUniqueCities } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from '@/components/ui/button';
import { Loader2, PlusCircle, Upload, MoreHorizontal } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { InstitutionForm } from './_components/InstitutionForm';
import { BulkUploadDialog } from './_components/BulkUploadDialog';
import type { Institution, CategoryUsage } from '@/lib/types';
import { deleteInstitution } from '@/lib/actions';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';


export default function AdminInstitutionsPage() {
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [categories, setCategories] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
    const [dialogType, setDialogType] = useState<'Create' | 'Update'>('Create');
    const [selectedInstitution, setSelectedInstitution] = useState<Institution | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { isAdmin } = useAuth();

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [instData, catData, cityData] = await Promise.all([getInstitutions(), getUniqueCategories(), getUniqueCities()]);
            setInstitutions(instData);
            setCategories(catData.map(c => c.name));
            setCities(cityData);
        } catch (error) {
            toast({
                title: "Error",
                description: "No se pudieron cargar los datos.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    }, [toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const filteredInstitutions = useMemo(() => {
        return institutions.filter(institution =>
            institution.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [institutions, searchQuery]);

    const handleFormSubmit = () => {
        setIsFormOpen(false);
        fetchData();
    };
    
    const handleBulkUploadSuccess = () => {
        setIsBulkUploadOpen(false);
        fetchData();
    };

    const handleOpenDialog = (type: 'Create' | 'Update', institution?: Institution) => {
        setDialogType(type);
        setSelectedInstitution(institution);
        setIsFormOpen(true);
    };

    const handleDelete = async (institutionId: string) => {
        const result = await deleteInstitution(institutionId);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Institución eliminada correctamente.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Instituciones</h1>
                    <p className="text-muted-foreground">Añadir, editar o eliminar instituciones.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
                        <Upload className="mr-2 h-4 w-4" /> Subir Excel
                    </Button>
                    <Button onClick={() => handleOpenDialog('Create')}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Añadir Institución
                    </Button>
                </div>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Instituciones ({filteredInstitutions.length})</CardTitle>
                            <CardDescription>Estas son todas las instituciones disponibles en la plataforma.</CardDescription>
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
                                    <TableHead>Teléfono</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInstitutions.map((institution) => (
                                    <TableRow key={institution.id}>
                                        <TableCell className="font-medium">{institution.name}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{institution.category}</Badge>
                                        </TableCell>
                                        <TableCell>{institution.branches?.[0]?.contact.phone || 'N/A'}</TableCell>
                                        <TableCell>{institution.contact.email}</TableCell>
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
                                                        <DropdownMenuItem onClick={() => handleOpenDialog('Update', institution)}>Editar</DropdownMenuItem>
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
                                                            Esta acción no se puede deshacer. Esto eliminará permanentemente la institución.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(institution.id)}>Sí, eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{dialogType === 'Create' ? 'Añadir Nueva Institución' : 'Editar Institución'}</DialogTitle>
                        <DialogDescription>
                            Complete los detalles de la institución a continuación.
                        </DialogDescription>
                    </DialogHeader>
                    <InstitutionForm
                        type={dialogType}
                        initialData={selectedInstitution}
                        categories={categories}
                        cities={cities}
                        onFormSubmit={handleFormSubmit}
                    />
                </DialogContent>
            </Dialog>

             <BulkUploadDialog 
                isOpen={isBulkUploadOpen}
                onOpenChange={setIsBulkUploadOpen}
                onUploadSuccess={handleBulkUploadSuccess}
            />
        </div>
    );
}

    
