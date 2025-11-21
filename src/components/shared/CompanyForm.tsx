
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
import type { Company, Service, CategoryUsage, Product, LegalForm, CompanySize, CapitalOwnership, GeographicScope, CompanyPurpose, FiscalRegime } from "@/lib/types"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Check, ChevronsUpDown, UploadCloud, X, PlusCircle, Trash2, Linkedin, Facebook, Twitter, Instagram, Smartphone } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "../ui/command"
import { cn } from "@/lib/utils"
import { Badge } from "../ui/badge"
import { ScrollArea } from "../ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import { createCompany, updateCompany } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import { Separator } from "../ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { v4 as uuidv4 } from "uuid";


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

const productSchema = z.object({
    id: z.string(),
    name: z.string().min(2, { message: "El nombre del producto debe tener al menos 2 caracteres." }),
    description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
    image: z.string().optional(),
});

const legalFormOptions: [LegalForm, ...LegalForm[]] = ['Sociedad Anónima (S.A.)', 'Sociedad de Responsabilidad Limitada (S.R.L.)', 'Sociedad Colectiva', 'Empresa Individual'];
const companySizeOptions: [CompanySize, ...CompanySize[]] = ['Microempresa', 'Pequeña empresa', 'Mediana empresa', 'Gran empresa'];
const capitalOwnershipOptions: [CapitalOwnership, ...CapitalOwnership[]] = ['Privada', 'Pública', 'Mixta', 'Cooperativa'];
const geographicScopeOptions: [GeographicScope, ...GeographicScope[]] = ['Local', 'Nacional', 'Multinacional'];
const companyPurposeOptions: [CompanyPurpose, ...CompanyPurpose[]] = ['Con ánimo de lucro', 'Sin ánimo de lucro'];
const fiscalRegimeOptions: [FiscalRegime, ...FiscalRegime[]] = ['Ordinaria', 'Especial'];


const companyFormSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  logo: z.string().optional().or(z.literal('')),
  category: z.string({ required_error: "Por favor, seleccione una categoría."}),
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }),
  products: z.array(productSchema).optional(),
  gallery: z.array(z.string()).max(5, "Puede subir un máximo de 5 imágenes.").optional(),
  contact: z.object({
    email: z.string().email({ message: "Correo electrónico no válido." }),
    website: z.string().url({ message: "Por favor, introduzca una URL válida." }).optional().or(z.literal('')),
    socialMedia: z.object({
        linkedin: z.string().url("URL de LinkedIn no válida").optional().or(z.literal('')),
        facebook: z.string().url("URL de Facebook no válida").optional().or(z.literal('')),
        twitter: z.string().url("URL de Twitter no válida").optional().or(z.literal('')),
        instagram: z.string().url("URL de Instagram no válida").optional().or(z.literal('')),
        tiktok: z.string().url("URL de TikTok no válida").optional().or(z.literal('')),
        whatsapp: z.string().optional().or(z.literal('')),
    }).optional(),
  }),
  yearEstablished: z.coerce.number().int().min(1900).max(new Date().getFullYear()),
  branches: z.array(branchSchema).min(1, "Debe añadir al menos una sucursal."),
  legalForm: z.enum(legalFormOptions, { required_error: "La forma jurídica es obligatoria."}),
  cif: z.string().min(2, "El CIF es obligatorio."),
  companySize: z.enum(companySizeOptions).optional(),
  capitalOwnership: z.enum(capitalOwnershipOptions).optional(),
  geographicScope: z.enum(geographicScopeOptions).optional(),
  purpose: z.enum(companyPurposeOptions).optional(),
  fiscalRegime: z.enum(fiscalRegimeOptions).optional(),
});

type CompanyFormValues = z.infer<typeof companyFormSchema>;

interface CompanyFormProps {
  type: 'Create' | 'Update';
  userId?: string;
  initialData?: Company;
  categories: CategoryUsage[];
  services: Service[];
  cities: string[];
  onFormSubmit?: () => void;
}

const TikTokIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2859 3333" shapeRendering="geometricPrecision" textRendering="geometricPrecision" imageRendering="optimizeQuality" fillRule="evenodd" clipRule="evenodd" {...props}><path d="M2081 0c55 473 319 755 778 785v532c-266 26-499-61-770-225v995c0 1264-1378 1659-1736 755-319-792 245-1827 1736-1827v471c-428 0-835 396-835 896s399 888 835 888 842-396 842-888V0z"/></svg>
);

const WhatsAppIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    role="img"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <path d="M12.06 0C5.4 0 0 5.4 0 12.06c0 3.48 1.5 6.6 3.96 8.76L0 24l3.3-3.84c2.04 1.44 4.5 2.28 7.08 2.28h.06c6.66 0 12.06-5.4 12.06-12.06C24.18 5.4 18.72 0 12.06 0zm0 0" />
    <path
      d="M12.06 22.92c-5.94 0-10.8-4.86-10.8-10.8 0-2.94 1.2-5.58 3.12-7.5l-2.1-2.46 2.58-2.22 2.22 2.58c1.92-1.2 4.14-1.92 6.54-1.92h.06c5.94 0 10.8 4.86 10.8 10.8-.06 5.94-4.86 10.8-10.8 10.8zm0 0"
      fill="#fff"
    />
    <path
      d="M18.9 15.3c-.42-.24-2.52-1.2-2.88-1.38-.42-.18-.72-.24-.96.24-.3.42-.96 1.38-1.2 1.62-.24.24-.48.3-.9.06-.42-.24-1.8-1.14-3.42-2.94-1.26-1.44-2.1-3.24-2.4-3.78-.3-.54-.06-.84.18-1.08.18-.18.42-.48.6-.72s.24-.42.36-.72c.12-.24.06-.48 0-.72-.12-.24-.96-2.4-.96-2.4s-.3-.24-.6-.24h-.36c-.3 0-.66.06-1.02.42-.36.36-1.38 1.38-1.38 3.3 0 1.92 1.44 3.84 1.62 4.08.18.24 2.76 4.44 6.72 5.88 1.02.36 1.8.42 2.4.36.66-.06 2.52-1.02 2.52-1.02s.42-.48.18-.9zm0 0"
      fill="#fff"
    />
  </svg>
);


export function CompanyForm({ type, userId, initialData, categories, services, cities, onFormSubmit }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo || null);
  const [productImagePreviews, setProductImagePreviews] = useState<Record<string, string | null>>({});

  
  const defaultWorkingHours = [
      { day: 'Lunes', hours: '09:00 - 17:00' },
      { day: 'Martes', hours: '09:00 - 17:00' },
      { day: 'Miércoles', hours: '09:00 - 17:00' },
      { day: 'Jueves', hours: '09:00 - 17:00' },
      { day: 'Viernes', hours: '09:00 - 17:00' },
      { day: 'Sábado', hours: 'Cerrado' },
      { day: 'Domingo', hours: 'Cerrado' },
  ];

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
  });

  const selectedCategory = form.watch("category");
  const galleryImages = form.watch("gallery") || [];

  const filteredServices = useMemo(() => {
    if (!selectedCategory) {
      return [];
    }
    return services.filter(service => service.category === selectedCategory);
  }, [selectedCategory, services]);

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        logo: initialData.logo || '',
        gallery: initialData.gallery || [],
        products: initialData.products || [],
        contact: {
          email: initialData.contact.email || '',
          website: initialData.contact.website || '',
          socialMedia: {
            linkedin: initialData.contact.socialMedia?.linkedin || '',
            facebook: initialData.contact.socialMedia?.facebook || '',
            twitter: initialData.contact.socialMedia?.twitter || '',
            instagram: initialData.contact.socialMedia?.instagram || '',
            tiktok: initialData.contact.socialMedia?.tiktok || '',
            whatsapp: initialData.contact.socialMedia?.whatsapp || '',
          },
        },
        branches:
          initialData.branches && initialData.branches.length > 0
            ? initialData.branches.map((b) => ({
                ...b,
                contact: {
                  phone: b.contact?.phone || '',
                  email: b.contact?.email || '',
                },
                workingHours:
                  b.workingHours && b.workingHours.length > 0
                    ? b.workingHours
                    : defaultWorkingHours,
                servicesOffered: b.servicesOffered || [],
              }))
            : [
                {
                  name: 'Sucursal Principal',
                  location: { address: '', city: '' },
                  contact: { phone: '', email: '' },
                  servicesOffered: [],
                  workingHours: defaultWorkingHours,
                },
              ],
        yearEstablished: initialData.yearEstablished || new Date().getFullYear(),
        cif: initialData.cif || '',
        legalForm: initialData.legalForm,
        companySize: initialData.companySize || undefined,
        capitalOwnership: initialData.capitalOwnership || undefined,
        geographicScope: initialData.geographicScope || undefined,
        purpose: initialData.purpose || undefined,
        fiscalRegime: initialData.fiscalRegime || undefined,
      });

      setLogoPreview(initialData.logo || null);
      const previews: Record<string, string> = {};
      (initialData.products || []).forEach((p) => {
        if (p.image) previews[p.id] = p.image;
      });
      setProductImagePreviews(previews);
    } else {
        form.reset({
            name: '',
            logo: '',
            description: '',
            products: [],
            gallery: [],
            contact: { email: '', website: '', socialMedia: { linkedin: '', facebook: '', twitter: '', instagram: '', tiktok: '', whatsapp: '' } },
            yearEstablished: new Date().getFullYear(),
            branches: [{ name: 'Sucursal Principal', location: { address: '', city: '' }, contact: { phone: '', email: '' }, servicesOffered: [], workingHours: defaultWorkingHours }],
            legalForm: undefined,
            cif: '',
        });
    }
  }, [initialData, form]);


  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "branches"
  });

  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({
      control: form.control,
      name: "products"
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

    const handleProductImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const fieldId = productFields[index].id;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setProductImagePreviews(prev => ({...prev, [fieldId]: result}));
                form.setValue(`products.${index}.image`, result, { shouldDirty: true });
            };
            reader.readAsDataURL(file);
        }
    }
    
    const removeProductImage = (index: number) => {
        const fieldId = productFields[index].id;
        setProductImagePreviews(prev => {
            const newPreviews = {...prev};
            delete newPreviews[fieldId];
            return newPreviews;
        });
        form.setValue(`products.${index}.image`, '', { shouldDirty: true });
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


  async function onSubmit(values: CompanyFormValues) {
    setIsSubmitting(true);
    
    try {
        if (type === 'Create') {
            await createCompany({userId, companyData: values });
            toast({
                title: "Empresa Creada",
                description: "Su empresa ha sido añadida al directorio y está pendiente de verificación.",
            });
            if (onFormSubmit) onFormSubmit();
        } else if (type === 'Update' && initialData) {
            await updateCompany({
                companyId: initialData.id,
                companyData: values,
            });
            toast({
                title: "Empresa Actualizada",
                description: "Los cambios en su empresa han sido guardados.",
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
            description: `No se pudo guardar la empresa. Por favor, inténtelo de nuevo.`,
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
                        <CardTitle>Información Principal</CardTitle>
                        <CardDescription>Detalles generales de su empresa.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Nombre de la Empresa</FormLabel>
                                <FormControl>
                                    <Input placeholder="ej. Mi Empresa S.L." {...field} />
                                </FormControl>
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
                                        placeholder="Describa brevemente su empresa, qué hace y qué la hace especial."
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
                                <FormLabel>Email General</FormLabel>
                                <FormControl><Input type="email" placeholder="info@empresa.com" {...field} /></FormControl>
                                <FormDescription>Correo principal para consultas generales.</FormDescription>
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
                                <FormControl><Input placeholder="https://www.su-empresa.com" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="space-y-2">
                           <FormLabel>Redes Sociales (Opcional)</FormLabel>
                            <div className="flex items-center gap-2">
                                <Linkedin className="w-5 h-5 text-muted-foreground" />
                                <FormField control={form.control} name="contact.socialMedia.linkedin" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="URL de LinkedIn" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                           <div className="flex items-center gap-2">
                                <Facebook className="w-5 h-5 text-muted-foreground" />
                                <FormField control={form.control} name="contact.socialMedia.facebook" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="URL de Facebook" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                            <div className="flex items-center gap-2">
                                <Twitter className="w-5 h-5 text-muted-foreground" />
                                <FormField control={form.control} name="contact.socialMedia.twitter" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="URL de Twitter" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                            <div className="flex items-center gap-2">
                                <Instagram className="w-5 h-5 text-muted-foreground" />
                                <FormField control={form.control} name="contact.socialMedia.instagram" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="URL de Instagram" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                           <div className="flex items-center gap-2">
                                <TikTokIcon className="w-4 h-4 text-muted-foreground ml-0.5" fill="currentColor"/>
                                <FormField control={form.control} name="contact.socialMedia.tiktok" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="URL de TikTok" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                           <div className="flex items-center gap-2">
                                <WhatsAppIcon className="w-5 h-5 text-muted-foreground fill-current" />
                                <FormField control={form.control} name="contact.socialMedia.whatsapp" render={({ field }) => (
                                    <FormItem className="flex-1"><FormControl><Input placeholder="Número de WhatsApp o link wa.me" {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                           </div>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Categoría y Servicios</CardTitle>
                        <CardDescription>Ayude a los clientes a encontrarle clasificando su negocio.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
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
                                        className={cn(
                                            "w-full justify-between",
                                            !field.value && "text-muted-foreground"
                                        )}
                                        >
                                        {field.value
                                            ? categories.find(
                                                (cat) => cat.name === field.value
                                            )?.name
                                            : "Seleccione una categoría"}
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
                                                        onSelect={() => {
                                                            form.setValue("category", cat.name)
                                                        }}
                                                        >
                                                        <Check
                                                            className={cn(
                                                            "mr-2 h-4 w-4",
                                                            cat.name === field.value
                                                                ? "opacity-100"
                                                                : "opacity-0"
                                                            )}
                                                        />
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
                    </CardContent>
                 </Card>
                 
                 <Card>
                    <CardHeader>
                        <CardTitle>Sucursales y Servicios</CardTitle>
                        <CardDescription>Añada las ubicaciones de su empresa y los servicios que ofrece en cada una.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {fields.map((field, index) => (
                           <div key={field.id} className="p-4 border rounded-lg space-y-4 relative">
                                <div className="flex justify-between items-center">
                                    <h4 className="font-semibold text-lg">Sucursal #{index + 1}</h4>
                                    {fields.length > 1 && (
                                        <Button type="button" variant="destructive" size="icon" className="h-7 w-7" onClick={() => remove(index)}>
                                            <Trash2 className="w-4 h-4" />
                                            <span className="sr-only">Eliminar Sucursal</span>
                                        </Button>
                                    )}
                                </div>
                                <FormField control={form.control} name={`branches.${index}.name`} render={({ field }) => (
                                    <FormItem><FormLabel>Nombre de la Sucursal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
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
                                    <FormItem><FormLabel>Teléfono de la Sucursal</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                <FormField control={form.control} name={`branches.${index}.contact.email`} render={({ field }) => (
                                    <FormItem><FormLabel>Email de la Sucursal (Opcional)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                )}/>
                                 <div className="space-y-2">
                                    <FormLabel>Horario de Apertura</FormLabel>
                                    {form.getValues(`branches.${index}.workingHours`)?.map((wh, whIndex) => (
                                        <div key={whIndex} className="flex items-center gap-2">
                                            <span className="w-24 text-sm font-medium">{wh.day}</span>
                                            <FormField control={form.control} name={`branches.${index}.workingHours.${whIndex}.hours`} render={({ field }) => (
                                                <FormItem className="flex-1"><FormControl><Input {...field} /></FormControl></FormItem>
                                            )}/>
                                        </div>
                                    ))}
                                </div>
                                <FormField
                                    control={form.control}
                                    name={`branches.${index}.servicesOffered`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Servicios en esta sucursal</FormLabel>
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
                                                                            className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            field.value?.includes(service.id)
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                            )}
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
                            Añadir otra sucursal
                        </Button>
                        <FormMessage>{form.formState.errors.branches?.root?.message}</FormMessage>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Galería de Imágenes</CardTitle>
                        <CardDescription>Suba hasta 5 imágenes para mostrar su negocio, productos o servicios.</CardDescription>
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
                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                                                        <UploadCloud className="w-8 h-8 mb-2" />
                                                        <span>Añadir Imagen</span>
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
            <div className="lg:col-span-1 space-y-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Identidad y Clasificación</CardTitle>
                        <CardDescription>Información legal y de clasificación.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="yearEstablished"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Año de Fundación</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                          control={form.control}
                          name="legalForm"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Forma Jurídica</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Seleccione una forma jurídica" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {legalFormOptions.map(option => <SelectItem key={option} value={option}>{option}</SelectItem>)}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                            control={form.control}
                            name="cif"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>CIF</FormLabel>
                                <FormControl><Input placeholder="Número de Identificación Fiscal" {...field} /></FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Separator />
                        <FormField control={form.control} name="companySize" render={({ field }) => (<FormItem><FormLabel>Tamaño de Empresa</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar tamaño..." /></SelectTrigger></FormControl><SelectContent>{companySizeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="capitalOwnership" render={({ field }) => (<FormItem><FormLabel>Propiedad del Capital</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar propiedad..." /></SelectTrigger></FormControl><SelectContent>{capitalOwnershipOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="geographicScope" render={({ field }) => (<FormItem><FormLabel>Ámbito Geográfico</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar ámbito..." /></SelectTrigger></FormControl><SelectContent>{geographicScopeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="purpose" render={({ field }) => (<FormItem><FormLabel>Finalidad</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar finalidad..." /></SelectTrigger></FormControl><SelectContent>{companyPurposeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="fiscalRegime" render={({ field }) => (<FormItem><FormLabel>Régimen Fiscal</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Seleccionar régimen..." /></SelectTrigger></FormControl><SelectContent>{fiscalRegimeOptions.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} />

                         <Separator />
                         <FormField
                            control={form.control}
                            name="logo"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Logo de la Empresa</FormLabel>
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
                                <FormDescription>Suba una imagen para su logo. Recomendado: 200x200px.</FormDescription>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
        </div>
         <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Empresa' : 'Guardar Cambios')}
        </Button>
      </form>
     </Form>
  )
}