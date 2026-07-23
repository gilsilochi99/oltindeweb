'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { createHealthFacility, updateHealthFacility } from "@/lib/actions";
import type { HealthFacility, HealthFacilityType } from "@/lib/types";
import { DynamicLocationPicker } from "@/components/shared/DynamicLocationPicker";

const healthFacilityFormSchema = z.object({
  type: z.enum(['hospital', 'clinic', 'pharmacy']),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  ownership: z.enum(['public', 'private']),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  services: z.string().optional(),
  specialties: z.string().optional(),
  emergencyServices: z.boolean().optional(),
  address: z.string().min(3, "La dirección es obligatoria."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  phone: z.string().min(6, "El teléfono parece demasiado corto."),
  email: z.string().email("Correo electrónico no válido.").optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
});

type HealthFacilityFormValues = z.infer<typeof healthFacilityFormSchema>;

const defaultOpeningHours = [
  { day: 'Lunes - Viernes', hours: '08:00 - 18:00' },
  { day: 'Sábado', hours: '08:00 - 13:00' },
  { day: 'Domingo', hours: 'Cerrado' },
];

const FACILITY_TYPE_LABELS: Record<HealthFacilityType, string> = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  pharmacy: 'Farmacia',
};

interface HealthFacilityFormProps {
  type: 'Create' | 'Update';
  initialData?: HealthFacility;
  cities: string[];
  defaultFacilityType?: HealthFacilityType;
  onFormSubmit: () => void;
}

export function HealthFacilityForm({ type, initialData, cities, defaultFacilityType, onFormSubmit }: HealthFacilityFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: initialData?.location.lat,
    lng: initialData?.location.lng,
  });
  const [openingHours, setOpeningHours] = useState(
    initialData?.openingHours?.length ? initialData.openingHours : defaultOpeningHours
  );

  const defaultValues: HealthFacilityFormValues = initialData ? {
    type: initialData.type,
    name: initialData.name,
    ownership: initialData.ownership,
    description: initialData.description,
    services: initialData.services?.join(', ') || '',
    specialties: initialData.specialties?.join(', ') || '',
    emergencyServices: initialData.emergencyServices || false,
    address: initialData.location.address,
    city: initialData.location.city,
    phone: initialData.contact.phone,
    email: initialData.contact.email || '',
    whatsapp: initialData.contact.whatsapp || '',
    image: initialData.image || '',
  } : {
    type: defaultFacilityType || 'hospital',
    name: '',
    ownership: 'public',
    description: '',
    services: '',
    specialties: '',
    emergencyServices: false,
    address: '',
    city: '',
    phone: '',
    email: '',
    whatsapp: '',
    image: '',
  };

  const form = useForm<HealthFacilityFormValues>({
    resolver: zodResolver(healthFacilityFormSchema),
    defaultValues,
  });

  const facilityType = form.watch('type');

  const updateHour = (index: number, hours: string) => {
    setOpeningHours(prev => prev.map((h, i) => i === index ? { ...h, hours } : h));
  };

  async function onSubmit(values: HealthFacilityFormValues) {
    if (!coords.lat || !coords.lng) {
      toast({ title: "Ubicación requerida", description: "Marque la ubicación en el mapa.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        type: values.type,
        name: values.name,
        ownership: values.ownership,
        description: values.description,
        services: values.services ? values.services.split(',').map(s => s.trim()).filter(Boolean) : [],
        specialties: values.type === 'pharmacy'
          ? []
          : (values.specialties ? values.specialties.split(',').map(s => s.trim()).filter(Boolean) : []),
        emergencyServices: values.type === 'pharmacy' ? false : !!values.emergencyServices,
        location: { address: values.address, city: values.city, lat: coords.lat, lng: coords.lng },
        contact: { phone: values.phone, email: values.email || '', whatsapp: values.whatsapp || '' },
        openingHours,
        image: values.image || '',
      };

      if (type === 'Create') {
        const result = await createHealthFacility(payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Centro Creado", description: "El centro de salud ha sido añadido." });
      } else if (initialData) {
        const result = await updateHealthFacility(initialData.id, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Centro Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el centro.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="type" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Centro</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {(Object.keys(FACILITY_TYPE_LABELS) as HealthFacilityType[]).map(t => (
                    <SelectItem key={t} value={t}>{FACILITY_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="ownership" render={({ field }) => (
            <FormItem>
              <FormLabel>Titularidad</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="public">Pública</SelectItem>
                  <SelectItem value="private">Privada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} placeholder="Ej: Hospital Regional de Bata" /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField control={form.control} name="services" render={({ field }) => (
          <FormItem>
            <FormLabel>Servicios</FormLabel>
            <FormControl><Input {...field} placeholder="Ej: Urgencias, Laboratorio, Pediatría" /></FormControl>
            <FormDescription>Separados por comas.</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        {facilityType !== 'pharmacy' && (
          <>
            <FormField control={form.control} name="specialties" render={({ field }) => (
              <FormItem>
                <FormLabel>Especialidades</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: Cardiología, Ginecología, Pediatría" /></FormControl>
                <FormDescription>Separadas por comas.</FormDescription>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="emergencyServices" render={({ field }) => (
              <FormItem className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <FormLabel>Urgencias 24h</FormLabel>
                  <FormDescription>Este centro ofrece atención de urgencias las 24 horas.</FormDescription>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="address" render={({ field }) => (
            <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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

        <div className="space-y-2">
          <FormLabel>Ubicación en el Mapa</FormLabel>
          <DynamicLocationPicker lat={coords.lat} lng={coords.lng} onChange={setCoords} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>

        <FormField control={form.control} name="whatsapp" render={({ field }) => (
          <FormItem><FormLabel>WhatsApp (Opcional)</FormLabel><FormControl><Input placeholder="Número o link wa.me" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <div className="space-y-2">
          <FormLabel>Horario de Apertura</FormLabel>
          {openingHours.map((h, i) => (
            <div key={h.day} className="flex items-center gap-2">
              <span className="w-32 shrink-0 text-sm font-medium">{h.day}</span>
              <Input value={h.hours} onChange={(e) => updateHour(i, e.target.value)} className="flex-1" />
            </div>
          ))}
        </div>

        <FormField control={form.control} name="image" render={({ field }) => (
          <FormItem><FormLabel>URL de Imagen (Opcional)</FormLabel><FormControl><Input {...field} placeholder="https://..." /></FormControl><FormMessage /></FormItem>
        )} />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Centro' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
