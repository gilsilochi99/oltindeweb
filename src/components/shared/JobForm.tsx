
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createJobPosting, updateJobPosting } from "@/lib/actions";
import type { JobPosting, EmploymentType } from "@/lib/types";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";

const employmentTypes: [EmploymentType, ...EmploymentType[]] = ['Tiempo completo', 'Medio tiempo', 'Contrato', 'Prácticas', 'Freelance'];

const jobFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  sector: z.string().min(2, "El sector es obligatorio."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  employmentType: z.enum(employmentTypes),
  salaryRange: z.string().optional(),
  requirements: z.array(z.string()).min(1, "Debe haber al menos un requisito."),
  applicationMethod: z.enum(['email', 'link']),
  applicationValue: z.string().min(3, "Este campo es obligatorio."),
  deadline: z.string().optional(),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

interface JobFormProps {
  type: 'Create' | 'Update';
  companyId: string;
  userId: string;
  initialData?: JobPosting;
  cities: string[];
  sectors: string[];
  onFormSubmit: () => void;
}

export function JobForm({ type, companyId, userId, initialData, cities, sectors, onFormSubmit }: JobFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: JobFormValues = initialData ? {
    title: initialData.title,
    description: initialData.description,
    sector: initialData.sector,
    city: initialData.city,
    employmentType: initialData.employmentType,
    salaryRange: initialData.salaryRange || '',
    requirements: initialData.requirements.length ? initialData.requirements : [''],
    applicationMethod: initialData.applicationMethod,
    applicationValue: initialData.applicationValue,
    deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
  } : {
    title: '',
    description: '',
    sector: '',
    city: '',
    employmentType: 'Tiempo completo',
    salaryRange: '',
    requirements: [''],
    applicationMethod: 'email',
    applicationValue: '',
    deadline: '',
  };

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues,
  });

  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control: form.control,
    name: "requirements",
  });

  const applicationMethod = form.watch('applicationMethod');

  async function onSubmit(values: JobFormValues) {
    const isValidEmail = values.applicationMethod === 'email' && z.string().email().safeParse(values.applicationValue).success;
    const isValidUrl = values.applicationMethod === 'link' && z.string().url().safeParse(values.applicationValue).success;
    if (!isValidEmail && !isValidUrl) {
      form.setError('applicationValue', {
        message: values.applicationMethod === 'email' ? 'Introduzca un email válido.' : 'Introduzca una URL válida (https://...).',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { ...values, requirements: values.requirements.filter(r => r.trim()) };
      if (type === 'Create') {
        const result = await createJobPosting(companyId, userId, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Empleo Publicado", description: "La oferta de empleo ya es visible públicamente." });
      } else if (initialData) {
        const result = await updateJobPosting(initialData.id, userId, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Empleo Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el empleo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Título del Puesto</FormLabel><FormControl><Input {...field} placeholder="Ej: Contable Senior" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="sector" render={({ field }) => (
            <FormItem>
              <FormLabel>Sector</FormLabel>
              <FormControl>
                <Input {...field} list="job-sector-options" placeholder="Ej: Contabilidad" />
              </FormControl>
              <datalist id="job-sector-options">
                {sectors.map(s => <option key={s} value={s} />)}
              </datalist>
              <FormDescription>Puede ser uno existente o nuevo.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>Ciudad</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una ciudad" /></SelectTrigger></FormControl>
                <SelectContent>
                  {cities.map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="employmentType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Empleo</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {employmentTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="salaryRange" render={({ field }) => (
            <FormItem><FormLabel>Rango Salarial (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ej: 500.000 - 700.000 XAF" /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div>
          <FormLabel>Requisitos</FormLabel>
          <div className="space-y-2 mt-2">
            {reqFields.map((field, index) => (
              <FormField key={field.id} control={form.control} name={`requirements.${index}`} render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Input {...field} /></FormControl>
                  {reqFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeReq(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </FormItem>
              )} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendReq('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Requisito</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="applicationMethod" render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Aplicación</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="email">Correo Electrónico</SelectItem>
                  <SelectItem value="link">Enlace Externo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="applicationValue" render={({ field }) => (
            <FormItem>
              <FormLabel>{applicationMethod === 'email' ? 'Email de Contacto' : 'Enlace de Aplicación'}</FormLabel>
              <FormControl><Input {...field} placeholder={applicationMethod === 'email' ? 'empleos@empresa.com' : 'https://...'} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="deadline" render={({ field }) => (
          <FormItem>
            <FormLabel>Fecha Límite (Opcional)</FormLabel>
            <FormControl><Input type="date" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Publicar Empleo' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
