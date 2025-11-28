'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { addAnnouncement } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import type { Announcement } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido.'),
  content: z.string().min(1, 'El contenido es requerido.'),
  image: z.any().optional(),
});

type AnnouncementFormValues = z.infer<typeof formSchema>;

interface AddAnnouncementFormProps {
  companyId: string;
  onAnnouncementAdded: (newAnnouncement: Announcement) => void;
}

export default function AddAnnouncementForm({ companyId, onAnnouncementAdded }: AddAnnouncementFormProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<AnnouncementFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      image: undefined,
    },
  });

  const onSubmit = (values: AnnouncementFormValues) => {
    startTransition(async () => {
      try {
        let imageUrl: string | undefined = undefined;
        if (values.image && values.image instanceof File) {
            const file = values.image as File;
            const storagePath = `announcements/${companyId}/${uuidv4()}-${file.name}`;
            imageUrl = await uploadFile(
              file,
              storagePath,
              setUploadProgress
            );
        }

        const announcementData = {
          ...values,
          image: imageUrl,
        };

        const result = await addAnnouncement(companyId, announcementData);

        if (!result.success || !result.newAnnouncement) {
          throw new Error(result.message || 'Failed to save the announcement.');
        }

        toast({
          title: 'Anuncio Creado',
          description: `\"${values.title}\" ha sido añadido con éxito.`,
        });
        form.reset();
        onAnnouncementAdded(result.newAnnouncement);

      } catch (err: any) {
        console.error("Error during announcement creation:", err);
        toast({
            title: 'Error al guardar',
            description: err.message || 'An unexpected error occurred.',
            variant: "destructive"
        });
      } finally {
        setUploadProgress(0);
      }
    });
  };

  const isProcessing = isPending || isUploading;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crear Nuevo Anuncio</CardTitle>
        <CardDescription>Comparta novedades con sus seguidores.</CardDescription>
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
                    <Input placeholder="Ej: Nuevo Horario" {...field} disabled={isProcessing} />
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
                  <FormLabel>Contenido</FormLabel>
                  <FormControl>
                    <Input placeholder="Detalles del anuncio..." {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field: { onChange, ...rest } }) => (
                <FormItem>
                  <FormLabel>Imagen (Opcional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      onChange={(e) => onChange(e.target.files ? e.target.files[0] : null)} 
                      disabled={isProcessing} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%`}}></div>
              </div>
            )}
            <Button type="submit" disabled={isProcessing}>
              {isProcessing ? 'Guardando...' : 'Guardar Anuncio'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
