
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
import { useStorage } from "@/hooks/use-storage";

const workingHoursSchema = z.object({
  day: z.string(),
  hours: z.string(),
});

const branchSchema = z.object({
  id: z.string().optional(),
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
  description: z.string().min(10, { message: "La descripción debe tener al menos 10 caracteres." }).optional().or(z.literal('')), 
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
  yearEstablished: z.coerce.number().int().min(1900).max(new Date().getFullYear()).optional(),
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

const defaultWorkingHours = [
    { day: 'Lunes', hours: '09:00 - 17:00' },
    { day: 'Martes', hours: '09:00 - 17:00' },
    { day: 'Miércoles', hours: '09:00 - 17:00' },
    { day: 'Jueves', hours: '09:00 - 17:00' },
    { day 'Viernes', hours: '09:00 - 17:00' },
    { day: 'Sábado', hours: 'Cerrado' },
    { day: 'Domingo', hours: 'Cerrado' },
];

const getDefaultValues = (initialData?: Company): CompanyFormValues => ({
    name: initialData?.name || '',
    logo: initialData?.logo || '',
    category: initialData?.category || '',
    description: initialData?.description || '',
    products: initialData?.products || [],
    gallery: initialData?.gallery || [],
    contact: {
        email: initialData?.contact?.email || '',
        website: initialData?.contact?.website || '',
        socialMedia: {
            linkedin: initialData?.contact?.socialMedia?.linkedin || '',
            facebook: initialData?.contact?.socialMedia?.facebook || '',
            twitter: initialData?.contact?.socialMedia?.twitter || '',
            instagram: initialData?.contact?.socialMedia?.instagram || '',
            tiktok: initialData?.contact?.socialMedia?.tiktok || '',
            whatsapp: initialData?.contact?.socialMedia?.whatsapp || '',
        },
    },
    yearEstablished: initialData?.yearEstablished || new Date().getFullYear(),
    branches: initialData?.branches && initialData.branches.length > 0 ? initialData.branches.map(b => ({...b, id: b.id || uuidv4()})) : [{
        id: uuidv4(),
        name: 'Sucursal Principal',
        location: { address: '', city: '' },
        contact: { phone: '', email: '' },
        servicesOffered: [],
        workingHours: defaultWorkingHours
    }],
    legalForm: initialData?.legalForm,
    cif: initialData?.cif || '',
    companySize: initialData?.companySize,
    capitalOwnership: initialData?.capitalOwnership,
    geographicScope: initialData?.geographicScope,
    purpose: initialData?.purpose,
    fiscalRegime: initialData?.fiscalRegime,
});


export function CompanyForm({ type, userId, initialData, categories, services, cities, onFormSubmit }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productImageFiles, setProductImageFiles] = useState<Record<string, File | null>>({});
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productImagePreviews, setProductImagePreviews] = useState<Record<string, string | null>>({});
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: useMemo(() => getDefaultValues(initialData), [initialData]),
    mode: 'onTouched',
  });

  const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "branches" });
  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({ control: form.control, name: "products" });

  useEffect(() => {
    const defaultValues = getDefaultValues(initialData);
    form.reset(defaultValues);

    setLogoPreview(initialData?.logo || null);
    setGalleryPreviews(initialData?.gallery || []);
    const productPreviews: Record<string, string> = {};
    (initialData?.products || []).forEach(p => {
        if (p.image) productPreviews[p.id] = p.image;
    });
    setProductImagePreviews(productPreviews);

  }, [initialData, form.reset]);

  const handleImageChange = (file: File | undefined, setter: (file: File | null) => void, previewSetter: (url: string | null) => void, currentPreview: string | null) => {
    if (currentPreview && currentPreview.startsWith('blob:')) {
      URL.revokeObjectURL(currentPreview);
    }
    if (file) {
      setter(file);
      previewSetter(URL.createObjectURL(file));
    } else {
      setter(null);
      previewSetter(null);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e.target.files?.[0], setLogoFile, setLogoPreview, logoPreview);

  const removeLogo = () => {
      if (logoPreview && logoPreview.startsWith('blob:')) URL.revokeObjectURL(logoPreview);
      setLogoFile(null);
      setLogoPreview(null);
      form.setValue('logo', '', { shouldDirty: true });
  };

  const handleGalleryImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (galleryPreviews.length + files.length > 5) {
          toast({ title: "Límite de 5 imágenes alcanzado", variant: "destructive" });
          return;
      }
      setGalleryImageFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeGalleryImage = (index: number) => {
      const previewToRemove = galleryPreviews[index];
      if (previewToRemove.startsWith('blob:')) {
          const fileIndex = galleryPreviews.filter(p => p.startsWith('blob:')).indexOf(previewToRemove);
          setGalleryImageFiles(files => files.filter((_, i) => i !== fileIndex));
          URL.revokeObjectURL(previewToRemove);
      }
      const updatedGallery = (form.getValues('gallery') || []).filter(url => url !== previewToRemove);
      form.setValue('gallery', updatedGallery, { shouldDirty: true });
      setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };

  const handleProductImageChange = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const currentPreview = productImagePreviews[productId];
          if (currentPreview && currentPreview.startsWith('blob:')) {
              URL.revokeObjectURL(currentPreview);
          }
          setProductImageFiles(prev => ({ ...prev, [productId]: file }));
          setProductImagePreviews(prev => ({ ...prev, [productId]: URL.createObjectURL(file) }));
      }
  };

  const removeProductImage = (productId: string) => {
      const currentPreview = productImagePreviews[productId];
      if (currentPreview && currentPreview.startsWith('blob:')) {
          URL.revokeObjectURL(currentPreview);
      }
      setProductImageFiles(prev => { const newState = { ...prev }; delete newState[productId]; return newState; });
      setProductImagePreviews(prev => { const newState = { ...prev }; delete newState[productId]; return newState; });
      const productIndex = form.getValues('products')?.findIndex(p => p.id === productId);
      if (productIndex !== -1 && productIndex !== undefined) {
        form.setValue(`products.${productIndex}.image`, '', { shouldDirty: true });
      }
  };

  async function onSubmit(values: CompanyFormValues) {
    setIsSubmitting(true);
    const companyId = initialData?.id || uuidv4();

    try {
      if (logoFile) {
        const path = `logos/${companyId}/${logoFile.name}`;
        const url = await uploadFile(logoFile, path);
        values.logo = url;
      }

      const newGalleryUrls = await Promise.all(
          galleryImageFiles.map(file => {
              const path = `galleries/${companyId}/${Date.now()}-${file.name}`;
              return uploadFile(file, path);
          })
      );
      const existingGalleryUrls = galleryPreviews.filter(p => p.startsWith('http'));
      values.gallery = [...existingGalleryUrls, ...newGalleryUrls.filter(Boolean) as string[]];

      const productUploadPromises = (values.products || []).map(async (product) => {
          const file = productImageFiles[product.id];
          if (file) {
              const path = `products/${companyId}/${product.id}-${file.name}`;
              const url = await uploadFile(file, path);
              return { ...product, image: url };
          }
          return product;
      });

      const updatedProducts = await Promise.all(productUploadPromises);
      values.products = updatedProducts;
      
      const finalValues = { ...values, id: companyId };

      if (type === 'Create') {
        if (!userId) throw new Error("User ID is missing for creating a company.");
        await createCompany({ userId, companyData: finalValues });
        toast({ title: "Empresa Creada", description: "Tu empresa ha sido enviada para verificación." });
      } else if (type === 'Update' && initialData) {
        await updateCompany({ companyId: initialData.id, companyData: finalValues });
        toast({ title: "Empresa Actualizada" });
      }
      
      router.push('/dashboard');
      router.refresh();
      if (onFormSubmit) onFormSubmit();

    } catch (error) {
      console.error("Form submission error:", error);
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar la empresa.", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        
        <Card>
          <CardHeader>
            <CardTitle>Información Básica y Logo</CardTitle>
            <CardDescription>Los detalles esenciales de tu empresa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             {/* ... Form fields will be added here ... */}
          </CardContent>
        </Card>

        {/* All other cards go here... */}

        <Button type="submit" disabled={isSubmitting || isUploading} className="w-full">
            {isSubmitting || isUploading ? 'Guardando...' : (type === 'Create' ? 'Crear Empresa y Enviar para Revisión' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
