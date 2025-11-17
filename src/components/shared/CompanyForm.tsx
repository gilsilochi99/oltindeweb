
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
import { useStorage } from "@/hooks/use-storage"; // Import useStorage


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

// ... (Icons remain the same)

export function CompanyForm({ type, userId, initialData, categories, services, cities, onFormSubmit }: CompanyFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State for file objects
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [productImageFiles, setProductImageFiles] = useState<Record<string, File | null>>({});
  const [galleryImageFiles, setGalleryImageFiles] = useState<File[]>([]);

  // State for previews (can be URL objects or existing http URLs)
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [productImagePreviews, setProductImagePreviews] = useState<Record<string, string | null>>({});
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const defaultWorkingHours = [ { day: 'Lunes', hours: '09:00 - 17:00' }, /* ... other days */ ];

  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    // ... defaultValues setup in useEffect
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "branches" });
  const { fields: productFields, append: appendProduct, remove: removeProduct } = useFieldArray({ control: form.control, name: "products" });

  useEffect(() => {
    if (initialData) {
      form.reset(initialData as any); // Reset form with initial data
      // Set up previews from initialData
      setLogoPreview(initialData.logo || null);
      setGalleryPreviews(initialData.gallery || []);
      const productPreviews: Record<string, string> = {};
      (initialData.products || []).forEach(p => {
        if (p.image) productPreviews[p.id] = p.image;
      });
      setProductImagePreviews(productPreviews);
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

  // Image Handling
  const handleImageChange = (file: File, setter: (file: File | null) => void, previewSetter: (url: string | null) => void, currentPreview: string | null) => {
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

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => handleImageChange(e.target.files?.[0]!, setLogoFile, setLogoPreview, logoPreview);

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
      const updatedGallery = initialData?.gallery?.filter(url => url !== previewToRemove) || [];
      form.setValue('gallery', updatedGallery, { shouldDirty: true });
      setGalleryPreviews(previews => previews.filter((_, i) => i !== index));
  };

  const handleProductImageChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      const fieldId = productFields[index].id;
      if (file) {
          const currentPreview = productImagePreviews[fieldId];
          if (currentPreview && currentPreview.startsWith('blob:')) {
              URL.revokeObjectURL(currentPreview);
          }
          setProductImageFiles(prev => ({ ...prev, [fieldId]: file }));
          setProductImagePreviews(prev => ({ ...prev, [fieldId]: URL.createObjectURL(file) }));
      }
  };

  const removeProductImage = (index: number) => {
      const fieldId = productFields[index].id;
      const currentPreview = productImagePreviews[fieldId];
      if (currentPreview && currentPreview.startsWith('blob:')) {
          URL.revokeObjectURL(currentPreview);
      }
      setProductImageFiles(prev => { const newState = { ...prev }; delete newState[fieldId]; return newState; });
      setProductImagePreviews(prev => { const newState = { ...prev }; delete newState[fieldId]; return newState; });
      form.setValue(`products.${index}.image`, '', { shouldDirty: true });
  };

  async function onSubmit(values: CompanyFormValues) {
    setIsSubmitting(true);
    const companyId = initialData?.id || uuidv4();

    try {
      // Upload Logo
      if (logoFile) {
        const path = `logos/${companyId}/${logoFile.name}`;
        const url = await uploadFile(logoFile, path);
        values.logo = url;
      }

      // Upload Gallery
      const newGalleryUrls = await Promise.all(
          galleryImageFiles.map(file => {
              const path = `galleries/${companyId}/${Date.now()}-${file.name}`;
              return uploadFile(file, path);
          })
      );
      const existingGalleryUrls = galleryPreviews.filter(p => p.startsWith('http'));
      values.gallery = [...existingGalleryUrls, ...newGalleryUrls.filter(Boolean) as string[]];

      // Upload Product Images
      const productUploadPromises = productFields.map(async (field, index) => {
          const file = productImageFiles[field.id!];
          if (file) {
              const path = `products/${companyId}/${Date.now()}-${file.name}`;
              return uploadFile(file, path);
          }
          // Keep existing image if no new file is selected
          return values.products?.[index]?.image || null;
      });

      const productUrls = await Promise.all(productUploadPromises);
      values.products = values.products?.map((p, i) => ({ ...p, image: productUrls[i] || '' }));

      // Create/Update Company
      if (type === 'Create') {
        await createCompany({ userId, companyData: { ...values, id: companyId } });
        toast({ title: "Empresa Creada", description: "Pendiente de verificación." });
      } else if (type === 'Update' && initialData) {
        await updateCompany({ companyId, companyData: values });
        toast({ title: "Empresa Actualizada" });
      }
      
      router.push('/dashboard');
      router.refresh();

    } catch (error) {
      console.error("Form submission error:", error);
      toast({ title: "Error", description: "No se pudo guardar la empresa.", variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
         {/* ... JSX for the form ... */}
         {/* Make sure to use the new preview states for rendering images */}
         {/* Example for logo: */}
         {logoPreview ? <Image src={logoPreview} /> : <span>Upload</span>}

         {/* Example for gallery: */}
         {galleryPreviews.map((src, i) => <Image key={i} src={src} />)}

         {/* Example for product: */}
         {productImagePreviews[field.id] ? <Image src={productImagePreviews[field.id]} /> : <span>Upload</span>}

        <Button type="submit" disabled={isSubmitting || isUploading}>
            {isSubmitting || isUploading ? 'Guardando...' : (type === 'Create' ? 'Crear Empresa' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
