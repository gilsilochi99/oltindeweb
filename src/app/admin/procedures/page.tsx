

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProcedures, getInstitutions, getUniqueCategories } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ProcedureForm } from './_components/ProcedureForm';
import type { Procedure, Institution, CategoryUsage } from '@/lib/types';
import { deleteProcedure } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';

function ProcedureActions({ procedure, onEdit, onDelete }: { procedure: Procedure; onEdit: () => void; onDelete: () => void; }) {
  const { isAdmin } = useAuth();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menú</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}>Editar</DropdownMenuItem>
        {isAdmin && <DropdownMenuItem onClick={onDelete} className="text-destructive">Eliminar</DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function AdminProceduresPage() {
    const [procedures, setProcedures] = useState<Procedure[]>([]);
    const [institutions, setInstitutions] = useState<Institution[]>([]);
    const [categories, setCategories] = useState<CategoryUsage[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedProcedure, setSelectedProcedure] = useState<Procedure | undefined>(undefined);
    const [dialogType, setDialogType] = useState<'Create' | 'Update'>('Create');
    const [searchQuery, setSearchQuery] = useState('');
    const { toast } = useToast();
    const { isAdmin } = useAuth();

    const fetchData = async () => {
        const [procData, instData, catData] = await Promise.all([getProcedures(), getInstitutions(), getUniqueCategories()]);
        setProcedures(procData);
        setInstitutions(instData);
        setCategories(catData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredProcedures = useMemo(() => {
        return procedures.filter(procedure =>
            procedure.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [procedures, searchQuery]);

    const handleFormSubmit = () => {
        setIsDialogOpen(false);
        fetchData(); // Refresh data
    };

    const handleOpenDialog = (type: 'Create' | 'Update', procedure?: Procedure) => {
        setDialogType(type);
        setSelectedProcedure(procedure);
        setIsDialogOpen(true);
    };
    
    const handleDeleteProcedure = async (procedureId: string) => {
        const result = await deleteProcedure(procedureId);
        if (result.success) {
            toast({ title: 'Éxito', description: 'Trámite eliminado correctamente.' });
            fetchData();
        } else {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        }
    };


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold font-headline">Gestionar Trámites</h1>
                    <p className="text-muted-foreground">Añadir, editar o eliminar trámites.</p>
                </div>
                <Button onClick={() => handleOpenDialog('Create')}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Trámite
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Trámites ({filteredProcedures.length})</CardTitle>
                            <CardDescription>Estos son todos los trámites disponibles en la plataforma.</CardDescription>
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
                                <TableHead>Institución</TableHead>
                                <TableHead>Costo</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredProcedures.map((procedure) => (
                                <TableRow key={procedure.id}>
                                    <TableCell className="font-medium">{procedure.name}</TableCell>
                                    <TableCell>{procedure.category}</TableCell>
                                    <TableCell>{procedure.institution}</TableCell>
                                    <TableCell>{procedure.cost}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => handleOpenDialog('Update', procedure)}>Editar</DropdownMenuItem>
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
                                                    Esta acción no se puede deshacer. Esto eliminará permanentemente el trámite.
                                                </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteProcedure(procedure.id)}>Sí, eliminar</AlertDialogAction>
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
                        <DialogTitle>{dialogType === 'Create' ? 'Añadir Nuevo Trámite' : 'Editar Trámite'}</DialogTitle>
                        <DialogDescription>
                            Complete los detalles del trámite a continuación.
                        </DialogDescription>
                    </DialogHeader>
                    <ProcedureForm
                        type={dialogType}
                        initialData={selectedProcedure}
                        institutions={institutions}
                        categories={categories.map(c => c.name)}
                        onFormSubmit={handleFormSubmit}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
