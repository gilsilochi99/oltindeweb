
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
import { useStorage } from '@/hooks/use-storage';

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
          toast({ title: "Error al subir la imagen", variant: "destructive" });
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

export default function AnnouncementsPage({ params }: { params: { companyId: string } }) {
  // ... same as before
}
