
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { LocalBusiness, Service, CategoryUsage } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Check, ChevronsUpDown, UploadCloud, X, PlusCircle, Trash2 } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { createLocalBusiness, updateLocalBusiness } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"

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
  servicesOffered: z.array(z.string()).optional(),
});

const localBusinessFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  logo: z.string().optional().or(z.literal('')),
  category: z.string({ required_error: "Por favor, seleccione una categoría."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  gallery: z.array(z.string()).max(5, "Puede subir un máximo de 5 imágenes.").optional(),
  contact: z.object({
    email: z.string().email({ message: "Correo electrónico no válido." }),
    website: z.string().url({ message: "Por favor, introduzca una URL válida." }).optional().or(z.literal('')),
  }),
  branches: z.array(branchSchema).min(1, "Debe añadir al menos una ubicación."),
});

type LocalBusinessFormValues = z.infer<typeof localBusinessFormSchema>;

interface LocalBusinessFormProps {
  type: 'Create' | 'Update';
  userId?: string;
  initialData?: LocalBusiness;
  categories: CategoryUsage[];
  services: Service[];
  cities: string[];
  onFormSubmit?: () => void;
}


export function LocalBusinessForm({ type, userId, initialData, categories, services, cities, onFormSubmit }: LocalBusinessFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);

  const defaultWorkingHours = [
      { day: 'Lunes', hours: '09:00 - 17:00' },
      { day: 'Martes', hours: '09:00 - 17:00' },
      { day: 'Miércoles', hours: '09:00 - 17:00' },
      { day: 'Jueves', hours: '09:00 - 17:00' },
      { day: 'Viernes', hours: '09:00 - 17:00' },
      { day: 'Sábado', hours: 'Cerrado' },
      { day: 'Domingo', hours: 'Cerrado' },
  ];

  const form = useForm<LocalBusinessFormValues>({
    resolver: zodResolver(localBusinessFormSchema),
  });

  const selectedCategory = form.watch("category");
  const galleryImages = form.watch("gallery") || [];

  const filteredServices = useMemo(() => {
    if (!selectedCategory) return [];
    return services.filter(service => service.category === selectedCategory);
  }, [selectedCategory, services]);

  useEffect(() => {
    if (initialData) {
        form.reset({
            ...initialData,
            logo: initialData.logo || '',
            gallery: initialData.gallery || [],
            contact: {
                email: initialData.contact.email || '',
                website: initialData.contact.website || '',
            },
            branches: initialData.branches && initialData.branches.length > 0 ? initialData.branches.map(b => ({
                name: b.name,
                location: b.location,
                contact: { phone: b.contact.phone, email: b.contact.email || '' },
                workingHours: b.workingHours && b.workingHours.length > 0 ? b.workingHours : defaultWorkingHours,
                servicesOffered: b.servicesOffered || [],
            })) : [{ name: 'Ubicación Principal', location: { address: '', city: '' }, contact: { phone: '', email: '' }, servicesOffered: [], workingHours: defaultWorkingHours }]
        });
        setLogoPreview(initialData.logo || null);
    } else {
        form.reset({
            name: '',
            logo: '',
            gallery: [],
            description: '',
            contact: { email: '', website: ''},
            branches: [{ name: 'Ubicación Principal', location: { address: '', city: '' }, contact: { phone: '', email: '' }, servicesOffered: [], workingHours: defaultWorkingHours }],
        });
    }
  }, [initialData, form]);

  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "branches"
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
  }

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        if (galleryImages.length >= 5) {
            toast({ title: "Límite Alcanzado", description: "No puede subir más de 5 imágenes.", variant: "destructive" });
            return;
        }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            form.setValue('gallery', [...galleryImages, result], { shouldDirty: true });
        };
        reader.readAsDataURL(file);
    }
  };

  const removeGalleryImage = (index: number) => {
    const updatedGallery = galleryImages.filter((_, i) => i !== index);
    form.setValue('gallery', updatedGallery, { shouldDirty: true });
  };

  async function onSubmit(values: LocalBusinessFormValues) {
    setIsSubmitting(true);
    try {
        if (type === 'Create') {
            await createLocalBusiness({userId, businessData: values });
            toast({
                title: "Negocio Creado",
                description: "Su negocio ha sido añadido al directorio y está pendiente de verificación.",
            });
            if (onFormSubmit) onFormSubmit();
        } else if (type === 'Update' && initialData) {
            await updateLocalBusiness({
                businessId: initialData.id,
                businessData: values,
            });
            toast({
                title: "Negocio Actualizado",
                description: "Los cambios en su negocio han sido guardados.",
            });
            if (onFormSubmit) {
                onFormSubmit();
            } else {
                router.push('/dashboard');
                router.refresh();
            }
        }
    } catch (error) {
         toast({
            title: "Error",
            description: `No se pudo guardar el negocio. Por favor, inténtelo de nuevo.`,
            variant: 'destructive',
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Información del Negocio</CardTitle>
                        <CardDescription>Detalles principales de su negocio o emprendimiento.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre del Negocio</FormLabel>
                                <FormControl>
                                    <Input placeholder="ej. Restaurante El Buen Sabor" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Categoría Principal</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                                    >
                                      {field.value ? categories.find((cat) => cat.name === field.value)?.name : "Seleccione una categoría"}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                  <Command>
                                    <CommandInput placeholder="Buscar categoría..." />
                                    <CommandEmpty>No se encontró la categoría.</CommandEmpty>
                                    <CommandGroup>
                                      <ScrollArea className="h-48">
                                        {categories.map((cat) => (
                                          <CommandItem
                                            value={cat.name}
                                            key={cat.name}
                                            onSelect={() => form.setValue("category", cat.name)}
                                          >
                                            <Check className={cn("mr-2 h-4 w-4", cat.name === field.value ? "opacity-100" : "opacity-0")} />
                                            {cat.name}
                                          </CommandItem>
                                        ))}
                                      </ScrollArea>
                                    </CommandGroup>
                                  </Command>
                                </PopoverContent>
                              </Popover>
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
                                <FormControl>
                                    <Textarea
                                        placeholder="Describa brevemente su negocio, qué ofrece y qué lo hace especial."
                                        rows={5}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contact.email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email de Contacto</FormLabel>
                                <FormControl><Input type="email" placeholder="info@negocio.com" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="contact.website"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sitio Web o Red Social Principal (Opcional)</FormLabel>
                                <FormControl><Input placeholder="https://www.instagram.com/su-negocio" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                 
                 <Card>
                    <CardHeader>
                        <CardTitle>Ubicación y Servicios</CardTitle>
                        <CardDescription>Añada la ubicación de su negocio y los servicios que ofrece.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                           <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-lg">Ubicación #{index + 1}</h4>
                                    {fields.length > 1 && (
                                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                                            <Trash2 className="w-4 h-4" />
                                            <span className="sr-only">Eliminar Ubicación</span>
                                        </Button>
                                    )}
                                </div>
                                <FormField control={form.control} name={`branches.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Nombre de la Ubicación</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                                 <FormField
                                    control={form.control}
                                    name={`branches.${index}.servicesOffered`}
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
                                                        disabled={!selectedCategory}
                                                        >
                                                        <div className="flex flex-wrap gap-1">
                                                            {field.value && field.value.length > 0 ? (
                                                                field.value.map(serviceId => (
                                                                    <Badge variant="secondary" key={serviceId}>
                                                                        {services.find(s => s.id === serviceId)?.name}
                                                                    </Badge>
                                                                ))
                                                            ) : (
                                                                <span className="text-muted-foreground">
                                                                    {selectedCategory ? 'Seleccione servicios' : 'Seleccione una categoría primero'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Buscar servicio..." />
                                                        <CommandEmpty>No hay servicios para esta categoría.</CommandEmpty>
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
                                                                            `branches.${index}.servicesOffered`,
                                                                            isSelected
                                                                                ? currentValue.filter(id => id !== service.id)
                                                                                : [...currentValue, service.id]
                                                                        );
                                                                    }}
                                                                    >
                                                                        <Check
                                                                            className={cn("mr-2 h-4 w-4", field.value?.includes(service.id) ? "opacity-100" : "opacity-0")}
                                                                        />
                                                                        {service.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </ScrollArea>
                                                        </CommandGroup>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                           </div>
                        ))}
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', location: { address: '', city: '' }, contact: { phone: '', email: '' }, servicesOffered: [], workingHours: defaultWorkingHours })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir otra ubicación
                        </Button>
                        <FormMessage>{form.formState.errors.branches?.root?.message}</FormMessage>
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Logo e Imágenes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Logo del Negocio</FormLabel>
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
                                                <span className="text-xs mt-1">PNG, JPG, GIF</span>
                                            </label>
                                         )}
                                    </div>
                                 </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Galería de Imágenes</CardTitle>
                        <CardDescription>Suba hasta 5 imágenes de su local, productos o servicios.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <FormField
                            control={form.control}
                            name="gallery"
                            render={({ field }) => (
                                <FormItem>
                                    <FormControl>
                                        <div>
                                            <Input
                                                id="gallery-upload"
                                                type="file"
                                                className="hidden"
                                                accept="image/png, image/jpeg, image/gif"
                                                onChange={handleGalleryImageChange}
                                                disabled={isSubmitting || galleryImages.length >= 5}
                                            />
                                            <div className="grid grid-cols-3 gap-2">
                                                {galleryImages.map((imageSrc, index) => (
                                                    <div key={index} className="relative aspect-square rounded-lg border-2 border-dashed flex justify-center items-center">
                                                        <Image src={imageSrc} alt={`Vista previa ${index + 1}`} fill objectFit="cover" className="rounded-lg" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => removeGalleryImage(index)}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                {galleryImages.length < 5 && (
                                                    <label
                                                        htmlFor="gallery-upload"
                                                        className={cn("cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-square rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground", (isSubmitting || galleryImages.length >= 5) && "cursor-not-allowed opacity-50")}
                                                    >
                                                        <UploadCloud className="w-6 h-6 mb-1" />
                                                        <span className="text-xs">Añadir Imagen</span>
                                                        <span className="text-xs mt-1">{galleryImages.length}/5</span>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
         <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Negocio' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  )
}
