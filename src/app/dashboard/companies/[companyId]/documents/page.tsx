
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Document } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, FileText, Trash2, Download } from 'lucide-react';
import Link from 'next/link';
import { deleteDocument } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import AddDocumentForm from './AddDocumentForm';

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

  const handleDocumentAdded = (newDocument: Document) => {
    setDocuments(prev => [newDocument, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
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
                              <a href={doc.url} target="_blank" rel="noopener noreferrer">
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
                                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
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
          <AddDocumentForm companyId={company.id} onDocumentAdded={handleDocumentAdded} />
        </div>
      </div>
    </div>
  );
}
