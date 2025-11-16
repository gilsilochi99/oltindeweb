
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { createInstitution, updateInstitution } from "@/lib/actions";
import { Institution } from "@/lib/types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown, PlusCircle, Trash2, UploadCloud, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const workingHoursSchema = z.object({
  day: z.string(),
  hours: z.string(),
});

const branchSchema = z.object({
  name: z.string().min(2, "El nombre de la sucursal es obligatorio."),
  location: z.object({
    address: z.string().min(5, "La dirección parece demasiado corta."),
    city: z.string({required_error: "Por favor, introduzca una ciudad."}),
  }),
  contact: z.object({
    phone: z.string().min(6, "El número de teléfono parece demasiado corto."),
    email: z.string().email("Correo electrónico no válido.").optional().or(z.literal('')),
  }),
  workingHours: z.array(workingHoursSchema).optional(),
});

const institutionFormSchema = z.object({
  name: z.string().min(3, "El nombre es obligatorio."),
  logo: z.string().optional(),
  description: z.string().min(10, "La descripción es obligatoria."),
  category: z.string().min(3, "La categoría es obligatoria."),
  responsiblePerson: z.object({
      name: z.string().optional(),
      title: z.string().optional(),
  }).optional(),
  contact: z.object({
      email: z.string().email("Correo electrónico no válido."),
      website: z.string().url("URL no válida.").optional().or(z.literal('')),
  }),
  branches: z.array(branchSchema).min(1, "Debe haber al menos una sucursal."),
});

type InstitutionFormValues = z.infer<typeof institutionFormSchema>;

interface InstitutionFormProps {
  type: 'Create' | 'Update';
  initialData?: Institution;
  categories: string[];
  cities: string[];
  onFormSubmit: () => void;
}

export function InstitutionForm({ type, initialData, categories, cities, onFormSubmit }: InstitutionFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

  const defaultWorkingHours = [
      { day: 'Lunes - Viernes', hours: '08:00 - 15:30' },
      { day: 'Sábado', hours: 'Cerrado' },
      { day: 'Domingo', hours: 'Cerrado' },
  ];

  const form = useForm<InstitutionFormValues>({
    resolver: zodResolver(institutionFormSchema),
  });

  useEffect(() => {
    if (initialData) {
        form.reset({
            ...initialData,
            logo: initialData.logo || '',
            responsiblePerson: {
                name: initialData.responsiblePerson?.name || '',
                title: initialData.responsiblePerson?.title || '',
            },
            branches: (initialData.branches || []).map(b => ({
                name: b.name,
                location: b.location,
                contact: {
                    phone: b.contact.phone,
                    email: b.contact.email || ''
                },
                workingHours: b.workingHours || defaultWorkingHours,
            }))
        });
        setLogoPreview(initialData.logo || null);
    } else {
        form.reset({
          name: '',
          logo: '',
          description: '',
          category: '',
          responsiblePerson: { name: '', title: '' },
          contact: { email: '', website: '' },
          branches: [{ name: 'Sede Principal', location: { address: '', city: '' }, contact: { phone: '', email: '' }, workingHours: defaultWorkingHours }],
        });
        setLogoPreview(null);
    }
  }, [initialData, form.reset]);


  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "branches",
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setLogoPreview(result);
        form.setValue('logo', result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    form.setValue('logo', '', { shouldDirty: true });
  };


  async function onSubmit(values: InstitutionFormValues) {
    setIsSubmitting(true);

    let finalValues = { ...values };
    
    if (values.responsiblePerson && !values.responsiblePerson.name && !values.responsiblePerson.title) {
        finalValues.responsiblePerson = undefined;
    }


    try {
      if (type === 'Create') {
        await createInstitution(finalValues);
        toast({ title: "Institución Creada", description: "La nueva institución ha sido añadida." });
      } else if (initialData) {
        await updateInstitution(initialData.id, finalValues);
        toast({ title: "Institución Actualizada", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "No se pudo guardar la institución.", variant: "destructive" });
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
              <FormLabel>Nombre de la Institución</FormLabel>
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
         <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría</FormLabel>
                <FormControl><Input {...field} placeholder="Ej: Gobierno" /></FormControl>
                <FormDescription>Puede ser una existente o nueva.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
            control={form.control}
            name="contact.email"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Email de Contacto</FormLabel>
                <FormControl><Input type="email" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
         <FormField
            control={form.control}
            name="contact.website"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Sitio Web (Opcional)</FormLabel>
                <FormControl><Input type="url" {...field} /></FormControl>
                <FormMessage />
                </FormItem>
            )}
        />
        <div className="grid grid-cols-2 gap-4">
            <FormField
                control={form.control}
                name="responsiblePerson.name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Nombre del Responsable</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Juan Pérez" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="responsiblePerson.title"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Cargo del Responsable</FormLabel>
                    <FormControl><Input {...field} placeholder="Ej: Director General" /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
        </div>
        <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Logo</FormLabel>
                 <FormControl>
                    <div className="w-full">
                        <Input 
                            id="logo-upload"
                            type="file" 
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleLogoChange}
                            disabled={isSubmitting}
                        />
                         {logoPreview ? (
                            <div className="relative w-32 h-32 rounded-lg border-2 border-dashed flex justify-center items-center">
                                <Image src={logoPreview} alt="Vista previa del logo" fill objectFit="cover" className="rounded-lg" />
                                <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeLogo}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                         ) : (
                            <label 
                                htmlFor="logo-upload"
                                className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full h-32 rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                            >
                                <UploadCloud className="w-8 h-8 mb-2"/>
                                <span>Subir logo</span>
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
                {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border rounded-lg space-y-3 relative">
                        <div className="flex justify-between items-center">
                            <h4 className="font-semibold">Sucursal {index + 1}</h4>
                            {fields.length > 1 && <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}><Trash2 className="w-4 h-4" /></Button>}
                        </div>
                        <FormField control={form.control} name={`branches.${index}.name`} render={({ field }) => (
                            <FormItem><FormLabel>Nombre Sucursal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField control={form.control} name={`branches.${index}.location.address`} render={({ field }) => (
                            <FormItem><FormLabel>Dirección</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <FormField
                            control={form.control}
                            name={`branches.${index}.location.city`}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ciudad</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccione una ciudad" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {cities.map(city => (
                                                <SelectItem key={city} value={city}>{city}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField control={form.control} name={`branches.${index}.contact.phone`} render={({ field }) => (
                            <FormItem><FormLabel>Teléfono</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                         <FormField control={form.control} name={`branches.${index}.contact.email`} render={({ field }) => (
                            <FormItem><FormLabel>Email (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="space-y-2">
                            <FormLabel>Horario de Apertura</FormLabel>
                            {form.getValues(`branches.${index}.workingHours`)?.map((wh, whIndex) => (
                                <div key={whIndex} className="flex items-center gap-2">
                                    <span className="w-28 text-sm font-medium">{wh.day}</span>
                                    <FormField control={form.control} name={`branches.${index}.workingHours.${whIndex}.hours`} render={({ field }) => (
                                        <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl></FormItem>
                                    )}/>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', location: { address: '', city: ''}, contact: { phone: '', email: ''}, workingHours: defaultWorkingHours })}><PlusCircle className="mr-2 h-4 w-4" />Añadir Sucursal</Button>
            </div>
             <FormMessage>{form.formState.errors.branches?.message}</FormMessage>
        </div>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Institución' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  )
}

    