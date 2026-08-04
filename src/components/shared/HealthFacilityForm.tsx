'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, PlusCircle, Trash2, UploadCloud, X } from "lucide-react";
import { isImageTooLarge, compressImageToDataUrl } from "@/lib/image-upload";
import { useToast } from "@/hooks/use-toast";
import { createHealthFacility, updateHealthFacility } from "@/lib/actions";
import type { HealthFacility, HealthFacilityType, Service } from "@/lib/types";
import { DynamicLocationPicker } from "@/components/shared/DynamicLocationPicker";
import { cn } from "@/lib/utils";

const workingHoursSchema = z.object({
  day: z.string(),
  hours: z.string(),
});

const branchSchema = z.object({
  name: z.string().min(2, "El nombre de la sucursal es obligatorio."),
  location: z.object({
    address: z.string().min(3, "La dirección es obligatoria."),
    city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
  }),
  contact: z.object({
    phone: z.string().min(6, "El teléfono parece demasiado corto."),
    email: z.string().email("Correo electrónico no válido.").optional().or(z.literal('')),
  }),
  workingHours: z.array(workingHoursSchema).optional(),
});

const healthFacilityFormSchema = z.object({
  type: z.enum(['hospital', 'clinic', 'pharmacy']),
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  ownership: z.enum(['public', 'private']),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  services: z.array(z.string()).optional(),
  specialties: z.string().optional(),
  emergencyServices: z.boolean().optional(),
  whatsapp: z.string().optional().or(z.literal('')),
  image: z.string().optional().or(z.literal('')),
  branches: z.array(branchSchema).min(1, "Debe haber al menos una sucursal."),
});

type HealthFacilityFormValues = z.infer<typeof healthFacilityFormSchema>;

const defaultOpeningHours = [
  { day: 'Lunes - Viernes', hours: '08:00 - 18:00' },
  { day: 'Sábado', hours: '08:00 - 13:00' },
  { day: 'Domingo', hours: 'Cerrado' },
];

const defaultBranch = { name: 'Sucursal Principal', location: { address: '', city: '' }, contact: { phone: '', email: '' }, workingHours: defaultOpeningHours };

const FACILITY_TYPE_LABELS: Record<HealthFacilityType, string> = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  pharmacy: 'Farmacia',
};

// The services picker filters the shared services catalog to whichever
// category matches the facility type, so admins tag catalog entries with
// these exact category labels for them to show up here.
export const HEALTH_SERVICE_CATEGORY: Record<HealthFacilityType, string> = {
  hospital: 'Hospital',
  clinic: 'Clínica',
  pharmacy: 'Farmacia',
};

interface HealthFacilityFormProps {
  type: 'Create' | 'Update';
  initialData?: HealthFacility;
  cities: string[];
  services: Service[];
  defaultFacilityType?: HealthFacilityType;
  lockType?: HealthFacilityType;
  onFormSubmit: () => void;
}

export function HealthFacilityForm({ type, initialData, cities, services, defaultFacilityType, lockType, onFormSubmit }: HealthFacilityFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);

  const defaultValues: HealthFacilityFormValues = initialData ? {
    type: initialData.type,
    name: initialData.name,
    ownership: initialData.ownership,
    description: initialData.description,
    services: initialData.services || [],
    specialties: initialData.specialties?.join(', ') || '',
    emergencyServices: initialData.emergencyServices || false,
    whatsapp: initialData.contact?.whatsapp || '',
    image: initialData.image || '',
    branches: (initialData.branches || []).map(b => ({
      name: b.name,
      location: b.location,
      contact: { phone: b.contact.phone, email: b.contact.email || '' },
      workingHours: b.workingHours?.length ? b.workingHours : defaultOpeningHours,
    })),
  } : {
    type: lockType || defaultFacilityType || 'hospital',
    name: '',
    ownership: 'public',
    description: '',
    services: [],
    specialties: '',
    emergencyServices: false,
    whatsapp: '',
    image: '',
    branches: [defaultBranch],
  };

  const form = useForm<HealthFacilityFormValues>({
    resolver: zodResolver(healthFacilityFormSchema),
    defaultValues,
  });

  const facilityType = form.watch('type');

  const { fields: branchFields, append: appendBranch, remove: removeBranch } = useFieldArray({
    control: form.control,
    name: "branches",
  });

  const filteredServices = useMemo(() => {
    const category = HEALTH_SERVICE_CATEGORY[facilityType];
    return services.filter(s => s.category === category);
  }, [facilityType, services]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isImageTooLarge(file)) {
      toast({ title: "Imagen Demasiado Grande", description: "Elija un archivo de imagen más pequeño.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    try {
      const result = await compressImageToDataUrl(file);
      setImagePreview(result);
      form.setValue('image', result, { shouldDirty: true });
    } catch {
      toast({ title: "Error", description: "No se pudo procesar la imagen. Intente con otro archivo.", variant: "destructive" });
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', '', { shouldDirty: true });
  };

  async function onSubmit(values: HealthFacilityFormValues) {
    setIsSubmitting(true);
    try {
      const payload = {
        type: lockType || values.type,
        name: values.name,
        ownership: values.ownership,
        description: values.description,
        services: values.services || [],
        specialties: values.type === 'pharmacy'
          ? []
          : (values.specialties ? values.specialties.split(',').map(s => s.trim()).filter(Boolean) : []),
        emergencyServices: values.type === 'pharmacy' ? false : !!values.emergencyServices,
        contact: { whatsapp: values.whatsapp || '' },
        branches: values.branches,
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
              <Select onValueChange={field.onChange} value={field.value} disabled={!!lockType}>
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

        <FormField
          control={form.control}
          name="services"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Servicios</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between font-normal h-auto min-h-10"
                    >
                      <div className="flex flex-wrap gap-1">
                        {field.value && field.value.length > 0 ? (
                          field.value.map(serviceId => (
                            <Badge variant="secondary" key={serviceId}>
                              {services.find(s => s.id === serviceId)?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-muted-foreground">Seleccione servicios</span>
                        )}
                      </div>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Buscar servicio..." />
                    <CommandEmpty>No hay servicios en la categoría "{HEALTH_SERVICE_CATEGORY[facilityType]}". Añádalos desde Admin &gt; Servicios.</CommandEmpty>
                    <CommandGroup>
                      <ScrollArea className="h-48">
                        {filteredServices.map((service) => (
                          <CommandItem
                            value={service.name}
                            key={service.id}
                            onSelect={() => {
                              const currentValue = field.value || [];
                              const isSelected = currentValue.includes(service.id);
                              form.setValue(
                                'services',
                                isSelected
                                  ? currentValue.filter(id => id !== service.id)
                                  : [...currentValue, service.id]
                              );
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", field.value?.includes(service.id) ? "opacity-100" : "opacity-0")} />
                            {service.name}
                          </CommandItem>
                        ))}
                      </ScrollArea>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Solo se muestran servicios de la categoría "{HEALTH_SERVICE_CATEGORY[facilityType]}".</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

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

        <FormField control={form.control} name="whatsapp" render={({ field }) => (
          <FormItem><FormLabel>WhatsApp (Opcional)</FormLabel><FormControl><Input placeholder="Número o link wa.me" {...field} /></FormControl><FormMessage /></FormItem>
        )} />

        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Imagen</FormLabel>
              <FormControl>
                <div className="w-full">
                  <Input
                    id="facility-image-upload"
                    type="file"
                    className="hidden"
                    accept="image/png, image/jpeg, image/gif"
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                  {imagePreview ? (
                    <div className="relative w-32 h-32 rounded-lg border-2 border-dashed flex justify-center items-center">
                      <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                      <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="facility-image-upload"
                      className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full h-32 rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                    >
                      <UploadCloud className="w-8 h-8 mb-2" />
                      <span>Subir imagen</span>
                    </label>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Sucursales</FormLabel>
          <div className="space-y-4 mt-2">
            {branchFields.map((field, index) => (
              <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Sucursal {index + 1}</h4>
                  {branchFields.length > 1 && (
                    <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => removeBranch(index)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <FormField control={form.control} name={`branches.${index}.name`} render={({ field }) => (
                  <FormItem><FormLabel>Nombre Sucursal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`branches.${index}.location.address`} render={({ field }) => (
                  <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField
                  control={form.control}
                  name={`branches.${index}.location.city`}
                  render={({ field }) => (
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
                  )}
                />
                <div className="space-y-2">
                  <FormLabel>Ubicación en el Mapa</FormLabel>
                  <DynamicLocationPicker
                    lat={form.watch(`branches.${index}.location.lat`)}
                    lng={form.watch(`branches.${index}.location.lng`)}
                    onChange={(coords) => {
                      form.setValue(`branches.${index}.location.lat`, coords.lat, { shouldDirty: true });
                      form.setValue(`branches.${index}.location.lng`, coords.lng, { shouldDirty: true });
                    }}
                  />
                </div>
                <FormField control={form.control} name={`branches.${index}.contact.phone`} render={({ field }) => (
                  <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name={`branches.${index}.contact.email`} render={({ field }) => (
                  <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="space-y-2">
                  <FormLabel>Horario de Apertura</FormLabel>
                  {form.getValues(`branches.${index}.workingHours`)?.map((wh, whIndex) => (
                    <div key={whIndex} className="flex items-center gap-2">
                      <span className="w-32 shrink-0 text-sm font-medium">{wh.day}</span>
                      <FormField control={form.control} name={`branches.${index}.workingHours.${whIndex}.hours`} render={({ field }) => (
                        <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl></FormItem>
                      )} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendBranch(defaultBranch)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir otra sucursal
            </Button>
          </div>
          <FormMessage>{form.formState.errors.branches?.root?.message || form.formState.errors.branches?.message}</FormMessage>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Centro' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
