
'use client';

import { useEffect, useState, useTransition, use } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getCompanyById } from '@/lib/data';
import type { Company, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Megaphone, UploadCloud, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { addAnnouncement, deleteAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStorage } from '@/hooks/use-storage';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';

const announcementSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
  image: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function AddAnnouncementForm({ companyId, onAnnouncementAdded }: { companyId: string, onAnnouncementAdded: (newAnnouncement: Announcement) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const { uploadFile, isUploading } = useStorage();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: '', content: '', image: '' },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
    }
  };

  const removeImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    form.setValue('image', '');
    const fileInput = document.getElementById('image-upload') as HTMLInputElement;
    if(fileInput) fileInput.value = '';
  };

  const onSubmit = (values: AnnouncementFormValues) => {
    startTransition(async () => {
      let imageUrl = '';
      if (imageFile) {
        const path = `announcements/${companyId}/${Date.now()}-${imageFile.name}`;
        const downloadURL = await uploadFile(imageFile, path);
        if (!downloadURL) {
          toast({ title: "Error al subir la imagen", description: "No se pudo subir la imagen. Inténtelo de nuevo.", variant: "destructive" });
          return;
        }
        imageUrl = downloadURL;
      }

      const result = await addAnnouncement(companyId, { ...values, image: imageUrl });
      if (result.success && result.newAnnouncement) {
        toast({ title: "Anuncio publicado" });
        onAnnouncementAdded(result.newAnnouncement);
        form.reset();
        removeImage();
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  const isProcessing = isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Anuncio</CardTitle>
        <CardDescription>Publique actualizaciones importantes para sus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem>
                <FormLabel>Título</FormLabel>
                <FormControl><Input placeholder="Ej: Nuevo horario de atención" {...field} disabled={isProcessing} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="content" render={({ field }) => (
              <FormItem>
                <FormLabel>Contenido</FormLabel>
                <FormControl><Textarea rows={4} placeholder="Describa la actualización para sus clientes..." {...field} disabled={isProcessing} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="space-y-2">
              <FormLabel>Imagen (Opcional)</FormLabel>
              <Input
                id="image-upload"
                type="file"
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
                onChange={handleImageChange}
                disabled={isProcessing}
              />
              {imagePreview ? (
                <div className="relative aspect-video rounded-lg border-2 border-dashed flex justify-center items-center">
                  <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                  <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage} disabled={isProcessing}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <label
                  htmlFor="image-upload"
                  className={`cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground ${isProcessing ? 'cursor-not-allowed' : ''}`}
                >
                  <UploadCloud className="w-8 h-8 mb-2" />
                  <span>Subir imagen</span>
                  <span className="text-xs mt-1">PNG, JPG, GIF</span>
                </label>
              )}
            </div>
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {isUploading ? 'Subiendo imagen...' : 'Publicando...'}</> : "Publicar Anuncio"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DeleteAnnouncementButton({ companyId, announcement, onDeleted }: { companyId: string, announcement: Announcement, onDeleted: (id: string) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAnnouncement(companyId, announcement.id);
      if (result.success) {
        toast({ title: "Anuncio eliminado" });
        onDeleted(announcement.id);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive shrink-0" disabled={isPending}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente el anuncio
            <strong className="text-foreground"> {announcement.title}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "Eliminando..." : "Sí, eliminar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function AnnouncementsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
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
        const data = await getCompanyById(companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
          return;
        }
        setCompany(data);
        setAnnouncements((data.announcements || []).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, companyId]);

  const handleNewAnnouncement = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleDeleted = (announcementId: string) => {
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
  };

  if (isLoading || authLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }

  if (!company) {
    return null;
  }

  if (!company.isPremium) {
    return <CompanyPremiumRequired companyName={company.name} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Gestionar Anuncios</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-black hover:underline">{company.name}</Link>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anuncios Publicados ({announcements.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {announcements.length > 0 ? (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <Card key={announcement.id} className="relative overflow-hidden">
                      {announcement.image && <Image src={announcement.image} alt={announcement.title} width={400} height={200} className="w-full h-32 object-cover" />}
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <CardTitle className="text-base font-bold flex items-center gap-2 text-black">
                              <Megaphone className="w-5 h-5" />
                              {announcement.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(announcement.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <DeleteAnnouncementButton companyId={company.id} announcement={announcement} onDeleted={handleDeleted} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground/80">{announcement.content}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No hay anuncios publicados para esta empresa.</p>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-1">
          <AddAnnouncementForm companyId={company.id} onAnnouncementAdded={handleNewAnnouncement} />
        </div>
      </div>
    </div>
  );
}
