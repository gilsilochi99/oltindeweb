
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Company, Branch } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  category: z.string().min(2, "La categoría debe tener al menos 2 caracteres."),
  services: z.array(z.string()).optional(),
  contact: z.object({
    email: z.string().email("Email no válido."),
    phone: z.string().optional(),
    website: z.string().url("URL no válida.").optional(),
  }),
  branches: z.array(
    z.object({
      name: z.string().min(2, "El nombre de la sucursal debe tener al menos 2 caracteres."),
      location: z.object({
        address: z.string().min(5, "La dirección debe tener al menos 5 caracteres."),
        city: z.string().min(2, "La ciudad debe tener al menos 2 caracteres."),
        country: z.string().min(2, "El país debe tener al menos 2 caracteres."),
      }),
    })
  ).min(1, "Debe haber al menos una sucursal."),
});

type CompanyFormValues = z.infer<typeof formSchema>;

interface CompanyFormProps {
  type: 'Create' | 'Update';
  initialData?: Company;
  onSubmit: (data: CompanyFormValues) => void;
}

export function CompanyForm({ type, initialData, onSubmit }: CompanyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      category: "",
      contact: { email: "" },
      branches: [{ name: "", location: { address: "", city: "", country: "" } }],
    },
  });

  const handleSubmit = async (values: CompanyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la empresa.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>{type === 'Create' ? 'Crear Empresa' : 'Actualizar Empresa'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="description" render={({ field }) => <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="category" render={({ field }) => <FormItem><FormLabel>Categoría</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
            <FormField control={form.control} name="contact.email" render={({ field }) => <FormItem><FormLabel>Email de Contacto</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>} />
          </CardContent>
        </Card>
        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Guardando...' : 'Guardar Cambios'}</Button>
      </form>
    </Form>
  );
}
