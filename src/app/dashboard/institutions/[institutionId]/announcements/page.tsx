
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
import { addInstitutionAnnouncement, deleteAnnouncement } from '@/lib/actions';
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
        <CardDescription>Publique actualizaciones importantes para sus clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             {/* Form Fields */}
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
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchInstitution() {
      if (user && params.institutionId) {
        const fetchedInstitution = await getInstitutionById(params.institutionId);
        if (!fetchedInstitution || fetchedInstitution.ownerId !== user.uid) {
          return notFound();
        }
        setInstitution(fetchedInstitution);
        setAnnouncements(fetchedInstitution.announcements || []);
        setLoading(false);
      }
    }
    fetchInstitution();
  }, [user, params.institutionId]);

  const handleAnnouncementAdded = (newAnnouncement: Announcement) => {
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };

  const handleDelete = (announcementId: string) => {
    startTransition(async () => {
        if(!institution) return;
      const result = await deleteAnnouncement(institution.id, announcementId, 'institution');
      if (result.success) {
        toast({ title: "Anuncio eliminado" });
        setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
      } else {
        toast({ title: "Error", description: result.message, variant: "destructive" });
      }
    });
  };

  if (loading || authLoading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10" /></div>;
  }

  if (!institution) {
    return notFound();
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Gestionar Anuncios de {institution.name}</h1>
      <AddAnnouncementForm institutionId={institution.id} onAnnouncementAdded={handleAnnouncementAdded} />
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Anuncios Publicados</h2>
        {announcements.length > 0 ? (
          <div className="space-y-4">
            {announcements.map((announcement) => (
              <Card key={announcement.id} className="flex flex-col md:flex-row items-start gap-4 p-4">
                 {/* Announcement content */}
              </Card>
            ))}
          </div>
        ) : (
          <p>No has publicado ningún anuncio todavía.</p>
        )}
      </div>
    </div>
  );
}
