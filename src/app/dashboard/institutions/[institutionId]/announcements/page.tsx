
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter, notFound } from 'next/navigation';
import { getInstitutionById } from '@/lib/data';
import type { Institution, Announcement } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Calendar, Megaphone, UploadCloud, X, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { addInstitutionAnnouncement, deleteInstitutionAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import * as z from 'zod';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useStorage } from '@/hooks/use-storage';

const announcementSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
  image: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function AddAnnouncementForm({ institutionId, onAnnouncementAdded }: { institutionId: string, onAnnouncementAdded: (newAnnouncement: Announcement) => void }) {
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
        const path = `announcements/${institutionId}/${Date.now()}-${imageFile.name}`;
        const downloadURL = await uploadFile(imageFile, path);
        if (!downloadURL) {
          toast({ title: "Error al subir la imagen", variant: "destructive" });
          return;
        }
        imageUrl = downloadURL;
      }

      const result = await addInstitutionAnnouncement(institutionId, { ...values, image: imageUrl });
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
        <CardDescription>Publique actualizaciones importantes para su institución.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título del Anuncio</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Nuevas fechas de inscripción" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contenido del Anuncio</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describa el anuncio en detalle..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagen del Anuncio (Opcional)</FormLabel>
                  <FormControl>
                    <Input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </FormControl>
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        {imagePreview ? (
                          <div>
                            <Image src={imagePreview} alt="Vista previa de la imagen" width={200} height={200} className="mx-auto" />
                            <button type="button" onClick={removeImage} className="mt-2 text-red-500 hover:text-red-700">
                              <X className="h-4 w-4 mr-1 inline-block" /> Quitar imagen
                            </button>
                          </div>
                        ) : (
                          <>
                            <UploadCloud className="mx-auto h-12 w-12" />
                            <p className="text-sm">Arrastra y suelta o haz clic para subir una imagen</p>
                          </>
                        )}
                      </div>
                    </div>
                  </label>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : "Publicar Anuncio"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage({ params }: { params: { institutionId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [institution, setInstitution] = useState<Institution | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeleting, startDeleteTransition] = useTransition();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signin');
      } else {
        getInstitutionById(params.institutionId).then(data => {
          if (!data || data.ownerId !== user.uid) {
            notFound();
          } else {
            setInstitution(data);
            setAnnouncements(data.announcements || []);
            setLoading(false);
          }
        });
      }
    }
  }, [user, authLoading, params.institutionId, router]);

  const handleAnnouncementAdded = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleDelete = (announcementId: string) => {
    startDeleteTransition(async () => {
      const result = await deleteInstitutionAnnouncement(params.institutionId, announcementId);
      if (result.success) {
        toast({ title: "Anuncio eliminado" });
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  if (loading || authLoading) {
    return <div className="flex items-center justify-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!institution) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Anuncios de {institution.name}</h1>
        <Link href={`/dashboard/institutions/${institution.id}`}>
          <Button variant="outline">Volver al Dashboard</Button>
        </Link>
      </div>
      
      <AddAnnouncementForm institutionId={institution.id} onAnnouncementAdded={handleAnnouncementAdded} />

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Anuncios Publicados</h2>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="relative">
                <CardHeader>
                  <CardTitle>{announcement.title}</CardTitle>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>{new Date(announcement.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <p>{announcement.content}</p>
                  {announcement.image && <Image src={announcement.image} alt={announcement.title} width={300} height={200} className="mt-4 rounded-md" />}
                </CardContent>
                <div className="absolute top-4 right-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" disabled={isDeleting}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Esta acción no se puede deshacer. Esto eliminará permanentemente el anuncio.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(announcement.id)}>
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Eliminar"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-6 border-2 border-dashed rounded-lg">
            <Megaphone className="mx-auto h-12 w-12" />
            <h3 className="mt-2 text-sm font-medium">No hay anuncios</h3>
            <p className="mt-1 text-sm text-muted-foreground">Empieza por crear tu primer anuncio.</p>
          </div>
        )}
      </div>
    </div>
  );
}
