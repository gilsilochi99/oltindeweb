
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkCreateInstitutions } from '@/lib/actions';
import { Loader2, FileUp } from 'lucide-react';
import type { Institution } from '@/lib/types';

interface BulkUploadDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onUploadSuccess: () => void;
}

type BulkInstitutionData = {
    name: string;
    description: string;
    category: string;
    email: string;
    website: string;
    phone: string;
    address: string;
    city: string;
    responsiblePersonName?: string;
    responsiblePersonTitle?: string;
}

export function BulkUploadDialog({ isOpen, onOpenChange, onUploadSuccess }: BulkUploadDialogProps) {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { toast } = useToast();

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast({ title: "Error", description: "Por favor, seleccione un archivo.", variant: "destructive" });
            return;
        }

        setIsUploading(true);
        try {
            const data = await file.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                 throw new Error("El archivo Excel está vacío o tiene un formato incorrecto.");
            }

            const requiredColumns = ['name', 'description', 'category', 'email', 'website', 'phone', 'address', 'city'];
            const institutionsToCreate: BulkInstitutionData[] = jsonData.map(row => {
                for (const col of requiredColumns) {
                    if (!row[col]) {
                        throw new Error(`Cada fila debe tener las columnas requeridas. Falta: '${col}'.`);
                    }
                }
                return {
                    name: String(row.name),
                    description: String(row.description),
                    category: String(row.category),
                    email: String(row.email),
                    website: String(row.website),
                    phone: String(row.phone),
                    address: String(row.address),
                    city: String(row.city),
                    responsiblePersonName: row.responsiblePersonName ? String(row.responsiblePersonName) : undefined,
                    responsiblePersonTitle: row.responsiblePersonTitle ? String(row.responsiblePersonTitle) : undefined,
                };
            });
            
            const result = await bulkCreateInstitutions(institutionsToCreate);

            if (result.success) {
                toast({ title: "Éxito", description: `${result.count} instituciones han sido añadidas.` });
                onUploadSuccess();
            } else {
                throw new Error(result.message);
            }

        } catch (error: any) {
            toast({
                title: "Error de Subida",
                description: error.message || "Ocurrió un error al procesar el archivo.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Subida Masiva de Instituciones</DialogTitle>
                    <DialogDescription>
                        Suba un archivo Excel (.xlsx) con las columnas requeridas.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input id="excel-file" type="file" accept=".xlsx" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">
                        Cabeceras requeridas: `name`, `description`, `category`, `email`, `website`, `phone`, `address`, `city`. Opcionales: `responsiblePersonName`, `responsiblePersonTitle`.
                    </p>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleUpload} disabled={!file || isUploading}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Subiendo...
                            </>
                        ) : (
                             <>
                                <FileUp className="mr-2 h-4 w-4" />
                                Subir y Crear
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
