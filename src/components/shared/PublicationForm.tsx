
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createPost, updatePost } from "@/lib/actions";
import { useState, useEffect } from "react";
import type { Post } from "@/lib/types";

const publicationFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }),
  category: z.string().min(3, { message: "La categoría debe tener al menos 3 caracteres." }),
  excerpt: z.string().min(10, { message: "El extracto debe tener al menos 10 caracteres." }).max(200, { message: "El extracto no puede superar los 200 caracteres." }),
  content: z.string().min(20, { message: "El contenido debe tener al menos 20 caracteres." }),
});

type PublicationFormValues = z.infer<typeof publicationFormSchema>;

interface PublicationFormProps {
  type: 'Create' | 'Update';
  userId?: string;
  initialData?: Post;
  onFormSubmit?: () => void;
}

export function PublicationForm({ type, userId, initialData, onFormSubmit }: PublicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PublicationFormValues>({
    resolver: zodResolver(publicationFormSchema),
    defaultValues: initialData || { title: '', category: '', excerpt: '', content: '' },
  });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData);
    }
  }, [initialData, form]);

  async function onSubmit(values: PublicationFormValues) {
    if (!userId) {
        toast({ title: "Error", description: "Debe iniciar sesión para crear una publicación.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    try {
      if (type === 'Create') {
        await createPost({ authorId: userId, ...values });
        toast({ title: "Publicación Creada", description: "Su nueva publicación ha sido guardada." });
      } else if (type === 'Update' && initialData) {
        await updatePost(initialData.id, values, initialData.featuredImage || '');
        toast({ title: "Publicación Actualizada", description: "Los cambios han sido guardados." });
      }
      if (onFormSubmit) {
        onFormSubmit();
      }
    } catch (error) {
        console.error("Error submitting form: ", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la publicación. Por favor, inténtelo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="El título de su publicación" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <Input placeholder="ej. Noticias, Tutorial, Opinión" {...field} />
              </FormControl>
              <FormDescription>Asigne una categoría para facilitar la búsqueda.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="excerpt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Extracto</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Un resumen corto de su publicación."
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormDescription>Este es un resumen corto que se mostrará en las vistas previas.</FormDescription>
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
                <Textarea
                  placeholder="Escriba el contenido de su publicación aquí."
                  rows={12}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Publicación' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
