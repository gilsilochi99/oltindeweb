
'use client';

import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { bulkSetPharmacyDuty } from '@/lib/actions';
import { Loader2, FileUp } from 'lucide-react';

interface PharmacyDutyUploadDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    onUploadSuccess: () => void;
}

function normalizeDate(value: unknown): string | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value.toISOString().slice(0, 10);
    }
    const str = String(value ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        return str;
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().slice(0, 10);
    }
    return null;
}

export function PharmacyDutyUploadDialog({ isOpen, onOpenChange, onUploadSuccess }: PharmacyDutyUploadDialogProps) {
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
            const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet, { raw: false });

            if (jsonData.length === 0) {
                throw new Error("El archivo Excel está vacío o tiene un formato incorrecto.");
            }

            const rows: { pharmacyName: string; date: string }[] = [];
            const invalidRows: number[] = [];
            jsonData.forEach((row, index) => {
                const name = row.pharmacyName ? String(row.pharmacyName).trim() : '';
                const date = normalizeDate(row.date);
                if (!name || !date) {
                    invalidRows.push(index + 2); // +2: header row + 1-indexed
                    return;
                }
                rows.push({ pharmacyName: name, date });
            });

            if (rows.length === 0) {
                throw new Error("Ninguna fila tiene 'pharmacyName' y 'date' válidos.");
            }

            const result = await bulkSetPharmacyDuty(rows);

            if (result.success) {
                const invalidNote = invalidRows.length > 0 ? ` (${invalidRows.length} fila(s) ignoradas por datos incompletos: ${invalidRows.join(', ')}.)` : '';
                toast({ title: "Éxito", description: `${result.message}${invalidNote}` });
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
                    <DialogTitle>Subida Mensual de Farmacias de Guardia</DialogTitle>
                    <DialogDescription>
                        Suba un archivo Excel (.xlsx) con el calendario de guardia del mes.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Input id="duty-excel-file" type="file" accept=".xlsx" onChange={handleFileChange} />
                    <p className="text-xs text-muted-foreground">
                        Cabeceras requeridas: <code>pharmacyName</code> (debe coincidir con el nombre exacto de la farmacia) y <code>date</code> (formato AAAA-MM-DD). Una fila por cada día de guardia — si una farmacia está de guardia varios días, añada una fila por día.
                        Al subir un mes, se reemplazan los días de guardia previos de ese mes para las farmacias incluidas.
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
                                Subir Calendario
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
