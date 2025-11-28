
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Post } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  content: z.string().min(20, "El contenido debe tener al menos 20 caracteres."),
  category: z.string().min(3, "La categoría debe tener al menos 3 caracteres."),
});

type PublicationFormValues = z.infer<typeof formSchema>;

interface PublicationFormProps {
  type: 'Create' | 'Update';
  initialData?: Post;
  onFormSubmit: (data: PublicationFormValues) => void;
}

export function PublicationForm({ type, initialData, onFormSubmit }: PublicationFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PublicationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      title: "",
      content: "",
      category: "",
    },
  });

  const handleSubmit = async (values: PublicationFormValues) => {
    setIsSubmitting(true);
    try {
      await onFormSubmit(values);
    } catch (error) {
      console.error("Error submitting form: ", error);
      toast({ title: "Error", description: "No se pudo guardar la publicación.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{type === 'Create' ? 'Crear Publicación' : 'Actualizar Publicación'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => <FormItem><FormLabel>Título</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="content" render={({ field }) => <FormItem><FormLabel>Contenido</FormLabel><FormControl><Textarea {...field} rows={10} /></FormControl><FormMessage /></FormItem>} />
          </CardContent>
        </Card>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
      </form>
    </Form>
  );
}
