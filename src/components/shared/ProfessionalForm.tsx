
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Professional, ProfessionalAvailability } from "@/lib/types"
import { UploadCloud, X, PlusCircle, Trash2, Linkedin } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { createProfessionalProfile, updateProfessionalProfile } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { v4 as uuidv4 } from "uuid";
import { isImageTooLarge, compressImageToDataUrl } from "@/lib/image-upload"

const professionalServiceSchema = z.object({
  id: z.string(),
  name: z.string().min(2, "El nombre del servicio es obligatorio."),
  description: z.string().optional(),
  price: z.string().optional(),
});

const availabilityOptions: [ProfessionalAvailability, ...ProfessionalAvailability[]] = ['Disponible', 'Ocupado', 'A demanda'];

const professionalFormSchema = z.object({
  displayName: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  title: z.string().min(2, "El título profesional es obligatorio."),
  photo: z.string().optional().or(z.literal('')),
  bio: z.string().min(10, "La biografía debe tener al menos 10 caracteres."),
  category: z.string({ required_error: "Por favor, seleccione una categoría." }),
  city: z.string({ required_error: "Por favor, seleccione una ciudad." }),
  availability: z.enum(availabilityOptions).optional(),
  skills: z.array(z.string()).min(1, "Debe añadir al menos una habilidad."),
  services: z.array(professionalServiceSchema).optional(),
  portfolio: z.array(z.string()).max(5, "Puede subir un máximo de 5 imágenes.").optional(),
  contact: z.object({
    phone: z.string().optional().or(z.literal('')),
    whatsapp: z.string().optional().or(z.literal('')),
    email: z.string().email("Correo electrónico no válido.").optional().or(z.literal('')),
    linkedin: z.string().url("URL de LinkedIn no válida.").optional().or(z.literal('')),
  }),
});

type ProfessionalFormValues = z.infer<typeof professionalFormSchema>;

interface ProfessionalFormProps {
  type: 'Create' | 'Update';
  userId: string;
  initialData?: Professional;
  categories: string[];
  cities: string[];
  onFormSubmit?: () => void;
}

export function ProfessionalForm({ type, userId, initialData, categories, cities, onFormSubmit }: ProfessionalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(initialData?.photo || null);

  const form = useForm<ProfessionalFormValues>({
    resolver: zodResolver(professionalFormSchema),
    defaultValues: {
      displayName: '',
      title: '',
      photo: '',
      bio: '',
      skills: [''],
      services: [],
      portfolio: [],
      availability: 'Disponible',
      contact: { phone: '', whatsapp: '', email: '', linkedin: '' },
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        displayName: initialData.displayName,
        title: initialData.title,
        photo: initialData.photo || '',
        bio: initialData.bio,
        category: initialData.category,
        city: initialData.city,
        availability: initialData.availability || 'Disponible',
        skills: initialData.skills.length ? initialData.skills : [''],
        services: initialData.services || [],
        portfolio: initialData.portfolio || [],
        contact: {
          phone: initialData.contact.phone || '',
          whatsapp: initialData.contact.whatsapp || '',
          email: initialData.contact.email || '',
          linkedin: initialData.contact.linkedin || '',
        },
      });
      setPhotoPreview(initialData.photo || null);
    }
  }, [initialData, form]);

  const { fields: skillFields, append: appendSkill, remove: removeSkill } = useFieldArray({
    control: form.control as any,
    name: "skills",
  }) as { fields: { id: string }[]; append: (v: string) => void; remove: (i: number) => void };

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services",
  });

  // useFieldArray's initial `fields` can come back empty for a primitive-string
  // array even though defaultValues carries one entry (RHF only spreads object
  // items when building the id-keyed field list) — guarantee at least one row.
  useEffect(() => {
    if (skillFields.length === 0) {
      appendSkill('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const portfolioImages = form.watch("portfolio") || [];

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isImageTooLarge(file)) {
      toast({ title: "Imagen Demasiado Grande", description: "Elija un archivo de imagen más pequeño.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    try {
      const result = await compressImageToDataUrl(file);
      setPhotoPreview(result);
      form.setValue('photo', result, { shouldDirty: true });
    } catch {
      toast({ title: "Error", description: "No se pudo procesar la imagen. Intente con otro archivo.", variant: "destructive" });
    }
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    form.setValue('photo', '', { shouldDirty: true });
  };

  const handlePortfolioImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (portfolioImages.length >= 5) {
      toast({ title: "Límite Alcanzado", description: "No puede subir más de 5 imágenes.", variant: "destructive" });
      return;
    }
    if (isImageTooLarge(file)) {
      toast({ title: "Imagen Demasiado Grande", description: "Elija un archivo de imagen más pequeño.", variant: "destructive" });
      e.target.value = '';
      return;
    }
    try {
      const result = await compressImageToDataUrl(file);
      form.setValue('portfolio', [...portfolioImages, result], { shouldDirty: true });
    } catch {
      toast({ title: "Error", description: "No se pudo procesar la imagen. Intente con otro archivo.", variant: "destructive" });
    }
  };

  const removePortfolioImage = (index: number) => {
    form.setValue('portfolio', portfolioImages.filter((_, i) => i !== index), { shouldDirty: true });
  };

  async function onSubmit(values: ProfessionalFormValues) {
    setIsSubmitting(true);
    const payload = { ...values, services: values.services || [] };
    try {
      if (type === 'Create') {
        const result = await createProfessionalProfile({ userId, data: payload });
        if (!result.success) throw new Error(result.message);
        toast({
          title: "Perfil Creado",
          description: "Su perfil profesional ya es visible en el directorio.",
        });
        if (onFormSubmit) onFormSubmit();
      } else if (type === 'Update' && initialData) {
        const result = await updateProfessionalProfile({ professionalId: initialData.id, data: payload });
        if (!result.success) throw new Error(result.message);
        toast({
          title: "Perfil Actualizado",
          description: "Los cambios en su perfil han sido guardados.",
        });
        if (onFormSubmit) {
          onFormSubmit();
        } else {
          router.push('/dashboard/professional');
          router.refresh();
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo guardar el perfil. Por favor, inténtelo de nuevo.",
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
                <CardDescription>Cómo le verán sus clientes potenciales.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="displayName" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl><Input placeholder="ej. Juan Nsue" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="title" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título Profesional</FormLabel>
                    <FormControl><Input placeholder="ej. Electricista, Diseñador Gráfico" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="bio" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl><Textarea rows={5} placeholder="Cuente su experiencia y lo que le hace destacar." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="city" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ciudad</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una ciudad" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="availability" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disponibilidad</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {availabilityOptions.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Habilidades</CardTitle>
                <CardDescription>Lo que sabe hacer.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {skillFields.map((field, index) => (
                    <FormField key={field.id} control={form.control} name={`skills.${index}`} render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl><Input {...field} placeholder="Ej: Instalaciones eléctricas residenciales" /></FormControl>
                        {skillFields.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeSkill(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                      </FormItem>
                    )} />
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendSkill('')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Habilidad</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servicios</CardTitle>
                <CardDescription>Lo que ofrece, con precio orientativo.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {serviceFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_1fr_auto] gap-2 items-start border rounded-md p-3">
                      <FormField control={form.control} name={`services.${index}.name`} render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Nombre del servicio" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`services.${index}.description`} render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Descripción breve" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name={`services.${index}.price`} render={({ field }) => (
                        <FormItem><FormControl><Input placeholder="Precio" {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeService(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={() => appendService({ id: uuidv4(), name: '', description: '', price: '' })}><PlusCircle className="mr-2 h-4 w-4" />Añadir Servicio</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Portafolio</CardTitle>
                <CardDescription>Ejemplos de trabajos realizados (máx. 5 imágenes).</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="portfolio" render={() => (
                  <FormItem>
                    <FormControl>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {portfolioImages.map((imageSrc, index) => (
                          <div key={index} className="relative aspect-square rounded-lg border-2 border-dashed flex justify-center items-center">
                            <Image src={imageSrc} alt={`Vista previa ${index + 1}`} fill objectFit="cover" className="rounded-lg" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={() => removePortfolioImage(index)}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {portfolioImages.length < 5 && (
                          <label
                            htmlFor="portfolio-upload"
                            className={cn("cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-square rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground", (isSubmitting || portfolioImages.length >= 5) && "cursor-not-allowed opacity-50")}
                          >
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span>Añadir Imagen</span>
                            <span className="text-xs mt-1">{portfolioImages.length}/5</span>
                          </label>
                        )}
                        <input id="portfolio-upload" type="file" accept="image/*" className="hidden" onChange={handlePortfolioImageChange} disabled={isSubmitting || portfolioImages.length >= 5} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contacto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField control={form.control} name="contact.phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact.whatsapp" render={({ field }) => (
                  <FormItem>
                    <FormLabel>WhatsApp</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact.email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="contact.linkedin" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1.5"><Linkedin className="w-4 h-4" />LinkedIn</FormLabel>
                    <FormControl><Input placeholder="https://linkedin.com/in/su-perfil" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foto de Perfil</CardTitle>
              </CardHeader>
              <CardContent>
                <FormField control={form.control} name="photo" render={() => (
                  <FormItem>
                    <FormControl>
                      <div>
                        {photoPreview ? (
                          <div className="relative w-32 h-32 rounded-lg border-2 border-dashed flex justify-center items-center">
                            <Image src={photoPreview} alt="Vista previa de la foto" fill objectFit="cover" className="rounded-lg" />
                            <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removePhoto}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <label
                            htmlFor="photo-upload"
                            className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full h-32 rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                          >
                            <UploadCloud className="w-8 h-8 mb-2" />
                            <span>Subir foto</span>
                            <span className="text-xs mt-1">PNG, JPG, GIF</span>
                          </label>
                        )}
                        <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} disabled={isSubmitting} />
                      </div>
                    </FormControl>
                    <FormDescription>Recomendado: foto cuadrada, 200x200px.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </CardContent>
            </Card>
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Perfil' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
