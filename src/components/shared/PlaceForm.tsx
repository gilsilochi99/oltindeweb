'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, X } from "lucide-react";
import { isImageTooLarge } from "@/lib/image-upload";
import { useToast } from "@/hooks/use-toast";
import { submitTouristLocation, updateTouristLocation, createTouristLocationAsAdmin } from "@/lib/actions";
import type { TouristLocation } from "@/lib/types";
import { DynamicLocationPicker } from "@/components/shared/DynamicLocationPicker";

const placeFormSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres."),
  category: z.string().min(2, "La categoría es obligatoria."),
  address: z.string().min(3, "La dirección es obligatoria."),
  city: z.string({ required_error: "Debe seleccionar una ciudad." }).min(1, "Debe seleccionar una ciudad."),
  priceRange: z.enum(['free', '$', '$$', '$$$']).optional(),
  image: z.string().optional().or(z.literal('')),
});

type PlaceFormValues = z.infer<typeof placeFormSchema>;

interface PlaceFormProps {
  type: 'Create' | 'Update';
  userId: string;
  isAdmin?: boolean;
  initialData?: TouristLocation;
  cities: string[];
  categories: string[];
  onFormSubmit: () => void;
}

export function PlaceForm({ type, userId, isAdmin = false, initialData, cities, categories, onFormSubmit }: PlaceFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({
    lat: initialData?.location.lat,
    lng: initialData?.location.lng,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);

  const defaultValues: PlaceFormValues = initialData ? {
    name: initialData.name,
    description: initialData.description,
    category: initialData.category,
    address: initialData.location.address,
    city: initialData.location.city,
    priceRange: initialData.priceRange,
    image: initialData.image || '',
  } : {
    name: '',
    description: '',
    category: '',
    address: '',
    city: '',
    priceRange: undefined,
    image: '',
  };

  const form = useForm<PlaceFormValues>({
    resolver: zodResolver(placeFormSchema),
    defaultValues,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (isImageTooLarge(file)) {
        toast({ title: "Imagen Demasiado Grande", description: "La imagen no puede superar 600 KB. Intente con una imagen más pequeña o comprimida.", variant: "destructive" });
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('image', '', { shouldDirty: true });
  };

  async function onSubmit(values: PlaceFormValues) {
    if (!coords.lat || !coords.lng) {
      toast({ title: "Ubicación requerida", description: "Marque la ubicación del lugar en el mapa.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        location: { address: values.address, city: values.city, lat: coords.lat, lng: coords.lng },
        priceRange: values.priceRange,
        image: values.image,
      };
      if (type === 'Create') {
        if (isAdmin) {
          const result = await createTouristLocationAsAdmin(userId, isAdmin, payload);
          if (!result.success) throw new Error(result.message);
          toast({ title: "Lugar Publicado", description: "El lugar ha sido publicado directamente." });
        } else {
          const result = await submitTouristLocation(userId, payload);
          if (!result.success) throw new Error(result.message);
          toast({ title: "Lugar Enviado", description: "Su sugerencia será revisada por un administrador antes de publicarse." });
        }
      } else if (initialData) {
        const result = await updateTouristLocation(initialData.id, userId, isAdmin, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Lugar Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el lugar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nombre del Lugar</FormLabel><FormControl><Input {...field} placeholder="Ej: Playa de Arena Blanca" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel>Categoría</FormLabel>
              <FormControl>
                <Input {...field} list="place-category-options" placeholder="Ej: Playa" />
              </FormControl>
              <datalist id="place-category-options">
                {categories.map(c => <option key={c} value={c} />)}
              </datalist>
              <FormDescription>Puede ser una existente o nueva.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="priceRange" render={({ field }) => (
            <FormItem>
              <FormLabel>Rango de Precio (Opcional)</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger><SelectValue placeholder="Seleccione" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="free">Gratis</SelectItem>
                  <SelectItem value="$">$</SelectItem>
                  <SelectItem value="$$">$$</SelectItem>
                  <SelectItem value="$$$">$$$</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>
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
        <FormField
          control={form.control}
          name="image"
          render={() => (
            <FormItem>
              <FormLabel>Imagen (Opcional)</FormLabel>
              <FormControl>
                <div className="w-full">
                  <Input
                    id="place-image-upload"
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
                      htmlFor="place-image-upload"
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
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : (type === 'Create' ? (isAdmin ? 'Publicar Lugar' : 'Enviar Sugerencia') : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
