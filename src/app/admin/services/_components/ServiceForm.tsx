
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createService } from "@/lib/actions";
import { useState } from "react";

const serviceFormSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  description: z.string().min(10, "La descripción es obligatoria."),
  category: z.string().min(3, "La categoría es obligatoria."),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  onFormSubmit: () => void;
}

export function ServiceForm({ onFormSubmit }: ServiceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
    },
  });

  async function onSubmit(values: ServiceFormValues) {
    setIsSubmitting(true);
    try {
      const result = await createService(values);
      if (result.success) {
        toast({ title: "Servicio Creado", description: "El nuevo servicio ha sido añadido." });
        onFormSubmit();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo crear el servicio.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Servicio</FormLabel>
              <FormControl><Input {...field} /></FormControl>
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
              <FormControl><Textarea {...field} /></FormControl>
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
              <FormControl><Input {...field} placeholder="Ej: Consultoría" /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'Crear Servicio'}
        </Button>
      </form>
    </Form>
  );
}
