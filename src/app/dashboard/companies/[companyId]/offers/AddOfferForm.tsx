'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTransition, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStorage } from '@/hooks/use-storage';
import { addOffer } from '@/lib/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { v4 as uuidv4 } from 'uuid';
import type { Offer } from '@/lib/types';

const formSchema = z.object({
  title: z.string().min(1, 'El título es requerido.'),
  description: z.string().min(1, 'La descripción es requerida.'),
  discount: z.string().min(1, 'El descuento es requerido.'),
  validUntil: z.string().min(1, 'La fecha de validez es requerida.'),
  image: z.any().optional(),
});

type OfferFormValues = z.infer<typeof formSchema>;

interface AddOfferFormProps {
  companyId: string;
  onOfferAdded: (newOffer: Offer) => void;
}

export default function AddOfferForm({ companyId, onOfferAdded }: AddOfferFormProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPending, startTransition] = useTransition();

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      discount: '',
      validUntil: '',
      image: undefined,
    },
  });

  const onSubmit = (values: OfferFormValues) => {
    startTransition(async () => {
      try {
        let imageUrl: string | undefined = undefined;
        if (values.image && values.image instanceof File) {
            const file = values.image as File;
            const storagePath = `offers/${companyId}/${uuidv4()}-${file.name}`;
            imageUrl = await uploadFile(
              file,
              storagePath,
              setUploadProgress
            );
        }

        const offerData = {
          ...values,
          image: imageUrl,
        };

        const result = await addOffer(companyId, offerData);

        if (!result.success || !result.newOffer) {
          throw new Error(result.message || 'Failed to save the offer.');
        }

        toast({
          title: 'Oferta Creada',
          description: `"${values.title}" ha sido añadida con éxito.`,
        });
        form.reset();
        onOfferAdded(result.newOffer);

      } catch (err: any) {
        console.error("Error during offer creation:", err);
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
        <CardTitle>Crear Nueva Oferta</CardTitle>
        <CardDescription>Añada una oferta para atraer más clientes.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título de la Oferta</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 20% de descuento en..." {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Input placeholder="Una breve descripción de la oferta." {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="discount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descuento</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 20%, 10€, etc." {...field} disabled={isProcessing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="validUntil"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Válida Hasta</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} disabled={isProcessing} />
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
              {isProcessing ? 'Guardando...' : 'Guardar Oferta'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
