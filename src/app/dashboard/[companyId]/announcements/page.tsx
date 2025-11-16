

'use client';

import { useEffect, useState, useTransition } from 'react';
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


const announcementSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  content: z.string().min(10, "El contenido debe tener al menos 10 caracteres."),
  image: z.string().optional(),
});

type AnnouncementFormValues = z.infer<typeof announcementSchema>;

function AddAnnouncementForm({ companyId, onAnnouncementAdded }: { companyId: string, onAnnouncementAdded: (newAnnouncement: Announcement) => void }) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      image: '',
    },
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', '');
  };

  const onSubmit = (values: AnnouncementFormValues) => {
    startTransition(async () => {
      const result = await addAnnouncement(companyId, values);
      if (result.success && result.newAnnouncement) {
        toast({ title: "Anuncio publicado", description: "Su anuncio ahora es visible en su página." });
        onAnnouncementAdded(result.newAnnouncement);
        form.reset();
        setImagePreview(null);
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Anuncio</CardTitle>
        <CardDescription>Publique actualizaciones importantes para sus clientes.</CardDescription>
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
                    <Input placeholder="Ej: Nuevos Horarios" {...field} disabled={isPending} />
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
                    <Textarea placeholder="Describa su anuncio..." rows={4} {...field} disabled={isPending} />
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
                  <FormLabel>Imagen (Opcional)</FormLabel>
                  <FormControl>
                      <div className="w-full">
                        <Input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          accept="image/png, image/jpeg, image/gif"
                          onChange={handleImageChange}
                          disabled={isPending}
                        />
                        {imagePreview ? (
                          <div className="relative aspect-video rounded-lg border-2 border-dashed flex justify-center items-center">
                            <Image src={imagePreview} alt="Vista previa" fill objectFit="cover" className="rounded-lg" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="image-upload"
                            className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                          >
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span>Subir imagen</span>
                            <span className="text-xs mt-1">PNG, JPG, GIF</span>
                          </label>
                        )}
                      </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" disabled={isPending}>
              {isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Publicando...</> : "Publicar Anuncio"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function AnnouncementsPage({ params }: { params: { companyId: string } }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
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
        const data = await getCompanyById(params.companyId);
        if (!data || data.ownerId !== user.uid) {
          notFound();
        }
        setCompany(data);
        setAnnouncements(data.announcements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        setIsLoading(false);
      };
      fetchCompanyData();
    }
  }, [user, params.companyId]);
  
  const handleNewAnnouncement = (newAnnouncement: Announcement) => {
      setAnnouncements(prev => [newAnnouncement, ...prev]);
  }

  const handleDelete = async (announcementId: string) => {
    const result = await deleteAnnouncement(params.companyId, announcementId);
    if(result.success) {
      toast({ title: "Anuncio eliminado" });
      setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
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
        <h1 className="text-3xl font-bold font-headline">Gestionar Anuncios</h1>
        <p className="text-muted-foreground">
          Para la empresa: <Link href={`/companies/${company.id}`} className="font-semibold text-primary hover:underline">{company.name}</Link>
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
                  {announcements.map((ann) => (
                    <Card key={ann.id} className="bg-muted/50 overflow-hidden">
                       {ann.image && <Image src={ann.image} alt={ann.title} width={400} height={200} className="w-full h-32 object-cover" />}
                       <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                           <CardTitle className="text-base font-bold flex items-center gap-2">
                              <Megaphone className="w-4 h-4 text-primary"/>
                              {ann.title}
                          </CardTitle>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                  <Button variant="destructive" size="icon" className="w-7 h-7">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                  <AlertDialogHeader>
                                      <AlertDialogTitle>¿Está seguro?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                          Esta acción eliminará permanentemente el anuncio. No se puede deshacer.
                                      </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDelete(ann.id)}>Eliminar</AlertDialogAction>
                                  </AlertDialogFooter>
                              </AlertDialogContent>
                          </AlertDialog>
                        </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Publicado el {new Date(ann.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </CardHeader>
                      <CardContent>
                         <p className="text-sm text-foreground/80">{ann.content}</p>
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
