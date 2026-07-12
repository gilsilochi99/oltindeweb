
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { createEvent, updateEvent } from "@/lib/actions";
import type { CalendarEvent, EventOrganizerType } from "@/lib/types";
import { useState } from "react";

function toDatetimeLocal(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(local: string): string {
  if (!local) return '';
  const d = new Date(local);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

const eventFormSchema = z.object({
  title: z.string().min(5, "El título debe tener al menos 5 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  category: z.string().min(2, "La categoría es obligatoria."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  address: z.string().optional(),
  startDate: z.string().min(1, "Debe indicar la fecha y hora de inicio."),
  endDate: z.string().optional(),
  registrationMethod: z.enum(['email', 'link', 'none']),
  registrationValue: z.string().optional(),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface OrganizerOption {
  id: string;
  name: string;
}

interface EventFormProps {
  type: 'Create' | 'Update';
  initialData?: CalendarEvent;
  cities: string[];
  categories: string[];
  userId: string | null;
  isAdmin: boolean;
  onFormSubmit: () => void;
  // Fixed organizer: used by the company self-service dashboard, where the organizer
  // is always the company whose /events page this form was opened from.
  fixedOrganizer?: { type: EventOrganizerType; id: string };
  // Pickable organizer: used by the admin create/edit form, since admins can organize
  // an event under any company OR institution (institutions have no owner dashboard).
  organizerOptions?: { companies: OrganizerOption[]; institutions: OrganizerOption[] };
}

export function EventForm({ type, initialData, cities, categories, userId, isAdmin, onFormSubmit, fixedOrganizer, organizerOptions }: EventFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizerType, setOrganizerType] = useState<EventOrganizerType>(
    fixedOrganizer?.type || initialData?.organizerType || 'company'
  );
  const [organizerId, setOrganizerId] = useState<string>(
    fixedOrganizer?.id || initialData?.organizerId || ''
  );
  const [organizerError, setOrganizerError] = useState<string | null>(null);

  const defaultValues: EventFormValues = initialData ? {
    title: initialData.title,
    description: initialData.description,
    category: initialData.category,
    city: initialData.city,
    address: initialData.address || '',
    startDate: toDatetimeLocal(initialData.startDate),
    endDate: toDatetimeLocal(initialData.endDate),
    registrationMethod: initialData.registrationMethod,
    registrationValue: initialData.registrationValue || '',
  } : {
    title: '',
    description: '',
    category: '',
    city: '',
    address: '',
    startDate: '',
    endDate: '',
    registrationMethod: 'none',
    registrationValue: '',
  };

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues,
  });

  const registrationMethod = form.watch('registrationMethod');
  const organizerList = organizerType === 'company' ? organizerOptions?.companies : organizerOptions?.institutions;

  async function onSubmit(values: EventFormValues) {
    if (!fixedOrganizer && !organizerId) {
      setOrganizerError('Debe seleccionar un organizador.');
      return;
    }
    setOrganizerError(null);

    if (values.registrationMethod === 'email') {
      const isValid = z.string().email().safeParse(values.registrationValue).success;
      if (!isValid) {
        form.setError('registrationValue', { message: 'Introduzca un email válido.' });
        return;
      }
    } else if (values.registrationMethod === 'link') {
      const isValid = z.string().url().safeParse(values.registrationValue).success;
      if (!isValid) {
        form.setError('registrationValue', { message: 'Introduzca una URL válida (https://...).' });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: fromDatetimeLocal(values.startDate),
        endDate: values.endDate ? fromDatetimeLocal(values.endDate) : '',
      };
      if (type === 'Create') {
        const result = await createEvent(organizerType, organizerId, userId, isAdmin, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Evento Publicado", description: "El evento ya es visible públicamente." });
      } else if (initialData) {
        const result = await updateEvent(initialData.id, userId, isAdmin, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Evento Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el evento.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!fixedOrganizer && organizerOptions && (
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
            <FormItem>
              <FormLabel>Tipo de Organizador</FormLabel>
              <Select
                value={organizerType}
                onValueChange={(v) => { setOrganizerType(v as EventOrganizerType); setOrganizerId(''); }}
              >
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="company">Empresa</SelectItem>
                  <SelectItem value="institution">Institución</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
            <FormItem>
              <FormLabel>Organizador</FormLabel>
              <Select value={organizerId} onValueChange={setOrganizerId}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione uno" /></SelectTrigger></FormControl>
                <SelectContent>
                  {organizerList?.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {organizerError && <p className="text-sm font-medium text-destructive">{organizerError}</p>}
            </FormItem>
          </div>
        )}

        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem><FormLabel>Título del Evento</FormLabel><FormControl><Input {...field} placeholder="Ej: Feria de Emprendimiento 2026" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <Input {...field} list="event-category-options" placeholder="Ej: Conferencia" />
              </FormControl>
              <datalist id="event-category-options">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
              <FormDescription>Puede ser una existente o nueva.</FormDescription>
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

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem><FormLabel>Dirección (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ej: Centro de Convenciones, Malabo" /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="startDate" render={({ field }) => (
            <FormItem><FormLabel>Fecha y Hora de Inicio</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem><FormLabel>Fecha y Hora de Fin (Opcional)</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="registrationMethod" render={({ field }) => (
            <FormItem>
              <FormLabel>Método de Registro</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="none">Sin registro</SelectItem>
                  <SelectItem value="email">Correo Electrónico</SelectItem>
                  <SelectItem value="link">Enlace Externo</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          {registrationMethod !== 'none' && (
            <FormField control={form.control} name="registrationValue" render={({ field }) => (
              <FormItem>
                <FormLabel>{registrationMethod === 'email' ? 'Email de Registro' : 'Enlace de Registro'}</FormLabel>
                <FormControl><Input {...field} placeholder={registrationMethod === 'email' ? 'eventos@empresa.com' : 'https://...'} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          )}
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Publicar Evento' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
