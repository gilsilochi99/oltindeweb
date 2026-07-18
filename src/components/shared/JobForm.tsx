
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
import type { JobPosting, EmploymentType, AcademicLevel } from "@/lib/types";
import { PlusCircle, Trash2 } from "lucide-react";
import { useState } from "react";

const employmentTypes: [EmploymentType, ...EmploymentType[]] = ['Tiempo completo', 'Medio tiempo', 'Contrato', 'Prácticas', 'Freelance'];

const academicLevels: [AcademicLevel, ...AcademicLevel[]] = [
  'Sin estudios formales',
  'Educación primaria',
  'Educación secundaria',
  'Formación Profesional',
  'Grado o Licenciatura',
  'Máster o Postgrado',
  'Doctorado',
];

const jobFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  sector: z.string().min(2, "El sector es obligatorio."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  employmentType: z.enum(employmentTypes),
  salaryRange: z.string().optional(),
  requirements: z.array(z.string()).min(1, "Debe haber al menos un requisito."),
  responsibilities: z.array(z.string()).min(1, "Debe haber al menos una responsabilidad."),
  academicLevel: z.enum(academicLevels),
  experience: z.array(z.string()).min(1, "Debe haber al menos un requisito de experiencia."),
  skills: z.array(z.string()).min(1, "Debe haber al menos una habilidad."),
  applicationMethod: z.enum(['email', 'link']),
  applicationValue: z.string().min(3, "Este campo es obligatorio."),
  applicationInstructions: z.string().optional(),
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
    responsibilities: initialData.responsibilities?.length ? initialData.responsibilities : [''],
    academicLevel: initialData.academicLevel || 'Educación secundaria',
    experience: initialData.experience?.length ? initialData.experience : [''],
    skills: initialData.skills?.length ? initialData.skills : [''],
    applicationMethod: initialData.applicationMethod,
    applicationValue: initialData.applicationValue,
    applicationInstructions: initialData.applicationInstructions || '',
    deadline: initialData.deadline ? initialData.deadline.split('T')[0] : '',
  } : {
    title: '',
    description: '',
    sector: '',
    city: '',
    employmentType: 'Tiempo completo',
    salaryRange: '',
    requirements: [''],
    responsibilities: [''],
    academicLevel: 'Educación secundaria',
    experience: [''],
    skills: [''],
    applicationMethod: 'email',
    applicationValue: '',
    applicationInstructions: '',
    deadline: '',
  };

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues,
  });

  // react-hook-form's Path/ArrayPath mapped types can bail out to `never`
  // once a schema has this many keys (a known TS complexity cliff, not a
  // logic error) — cast control locally so each field array still gets a
  // properly typed `fields`/`append`/`remove` via the string[] annotation.
  const { fields: reqFields, append: appendReq, remove: removeReq } = useFieldArray({
    control: form.control as any,
    name: "requirements",
  }) as { fields: { id: string }[]; append: (v: string) => void; remove: (i: number) => void };

  const { fields: respFields, append: appendResp, remove: removeResp } = useFieldArray({
    control: form.control as any,
    name: "responsibilities",
  }) as { fields: { id: string }[]; append: (v: string) => void; remove: (i: number) => void };

  const { fields: expFields, append: appendExp, remove: removeExp } = useFieldArray({
    control: form.control as any,
    name: "experience",
  }) as { fields: { id: string }[]; append: (v: string) => void; remove: (i: number) => void };

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control as any,
    name: "skills",
  }) as { fields: { id: string }[]; append: (v: string) => void; remove: (i: number) => void };

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
      const payload = {
        ...values,
        requirements: values.requirements.filter(r => r.trim()),
        responsibilities: values.responsibilities.filter(r => r.trim()),
        experience: values.experience.filter(r => r.trim()),
        skills: values.skills.filter(r => r.trim()),
      };
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

        <div>
          <FormLabel>Responsabilidades</FormLabel>
          <div className="space-y-2 mt-2">
            {respFields.map((field, index) => (
              <FormField key={field.id} control={form.control} name={`responsibilities.${index}`} render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Input {...field} /></FormControl>
                  {respFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeResp(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </FormItem>
              )} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendResp('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Responsabilidad</Button>
          </div>
        </div>

        <FormField control={form.control} name="academicLevel" render={({ field }) => (
          <FormItem>
            <FormLabel>Nivel Académico Requerido</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
              <SelectContent>
                {academicLevels.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div>
          <FormLabel>Experiencia</FormLabel>
          <div className="space-y-2 mt-2">
            {expFields.map((field, index) => (
              <FormField key={field.id} control={form.control} name={`experience.${index}`} render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Input {...field} placeholder="Ej: Mínimo 2 años en un puesto similar" /></FormControl>
                  {expFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeExp(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </FormItem>
              )} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendExp('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Requisito de Experiencia</Button>
          </div>
        </div>

        <div>
          <FormLabel>Habilidades</FormLabel>
          <div className="space-y-2 mt-2">
            {skillFields.map((field, index) => (
              <FormField key={field.id} control={form.control} name={`skills.${index}`} render={({ field }) => (
                <FormItem className="flex items-center gap-2">
                  <FormControl><Input {...field} placeholder="Ej: Manejo de Excel avanzado" /></FormControl>
                  {skillFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                </FormItem>
              )} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendSkill('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Habilidad</Button>
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

        <FormField control={form.control} name="applicationInstructions" render={({ field }) => (
          <FormItem>
            <FormLabel>Instrucciones de Solicitud (Opcional)</FormLabel>
            <FormControl><Textarea rows={3} {...field} placeholder="Ej: Indique el puesto en el asunto del correo y adjunte su CV en PDF." /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

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
