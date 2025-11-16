
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Document } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Upload, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { addDocument, deleteDocument } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

const documentSchema = z.object({
  name: z.string().min(3, "El nombre del documento es obligatorio."),
  file: z.string().startsWith('data:', "Debe seleccionar un archivo válido."),
});

function AddDocumentForm({ companyId, onDocumentAdded }: { companyId: string, onDocumentAdded: (newDoc: Document) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [file, setFile] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Used to reset the file input

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "Archivo demasiado grande",
          description: "Por favor, seleccione un archivo de menos de 5MB.",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFile(reader.result as string);
        setFileName(selectedFile.name);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = documentSchema.safeParse({ name, file });
    if (!validation.success) {
      toast({
        title: "Error de validación",
        description: validation.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      const result = await addDocument(companyId, { name, file });
      if (result.success && result.newDocument) {
        toast({ title: "Documento Subido", description: "Su documento ha sido añadido." });
        onDocumentAdded(result.newDocument);
        setName('');
        setFile('');
        setFileName('');
        setFileInputKey(Date.now()); // Reset file input
      } else {
        toast({ title: "Error al subir", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nuevo Documento</CardTitle>
        <CardDescription>Añada documentos públicos a su perfil (PDF, DOCX, etc). Límite de 5MB.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Documento</Label>
            <Input id="name" placeholder="Ej: Dossier de la Empresa" value={name} onChange={(e) => setName(e.target.value)} disabled={isPending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file-upload">Archivo</Label>
            <Input id="file-upload" type="file" onChange={handleFileChange} disabled={isPending} key={fileInputKey} />
            {fileName && <p className="text-sm text-muted-foreground">Archivo seleccionado: {fileName}</p>}
          </div>
          <Button type="submit" disabled={isPending || !file}>
            {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Subiendo...</> : <><Upload className="mr-2 h-4 w-4" /> Subir Documento</>}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function DocumentsPage({ params }: { params: { companyId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [company, setCompany] = useState<Company | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      const fetchCompanyData = async () => {
        setIsLoading(true);
        const data = await getCompanyById(params.companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
        }
        setCompany(data);
        setDocuments(data.documents?.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) || []);
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, params.companyId]);

  const handleNewDocument = (newDoc: Document) => {
    setDocuments(prev => [newDoc, ...prev]);
  };
  
  const handleDelete = async (docId: string) => {
    const result = await deleteDocument(params.companyId, docId);
    if(result.success) {
      toast({ title: "Documento eliminado" });
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } else {
      toast({ title: "Error", description: result.message, variant: "destructive" });
    }
  }

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Documentos</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-primary hover:underline">{company.name}</Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Subidos ({documents.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="p-3 bg-muted/50 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                           <FileText className="w-5 h-5 text-primary" />
                           <div>
                             <p className="font-semibold">{doc.name}</p>
                             <p className="text-xs text-muted-foreground">Subido el {new Date(doc.createdAt).toLocaleDateString()}</p>
                           </div>
                       </div>
                       <div className="flex items-center gap-2">
                          <Button variant="outline" size="icon" asChild>
                              <a href={doc.url} download={doc.name}>
                                <Download className="w-4 h-4" />
                              </a>
                          </Button>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el documento. No se puede deshacer.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(doc.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                       </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay documentos subidos para esta empresa.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <AddDocumentForm companyId={company.id} onDocumentAdded={handleNewDocument} />
        </div>
      </div>
    </div>
  );
}

    