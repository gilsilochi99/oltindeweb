'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray, type Control } from "react-hook-form";
import * as z from "zod";
import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { UploadCloud, X, Loader2, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useStorage } from "@/hooks/use-storage";
import { createMenuItem, updateMenuItem } from "@/lib/actions";
import type { MenuItem } from "@/lib/types";
import { v4 as uuidv4 } from "uuid";

const optionSchema = z.object({
  name: z.string().min(1, "El nombre de la opción es obligatorio."),
  priceDelta: z.coerce.number(),
});

const optionGroupSchema = z.object({
  name: z.string().min(1, "El nombre del grupo es obligatorio."),
  required: z.boolean(),
  options: z.array(optionSchema).min(1, "Añada al menos una opción."),
});

const menuItemFormSchema = z.object({
  name: z.string().min(2, "El nombre es obligatorio."),
  description: z.string().min(5, "La descripción debe tener al menos 5 caracteres."),
  price: z.coerce.number().min(0, "El precio no puede ser negativo."),
  foodType: z.string().min(2, "El tipo de comida es obligatorio."),
  isMenuDelDia: z.boolean().optional(),
  available: z.boolean().optional(),
  optionGroups: z.array(optionGroupSchema).optional(),
});

type MenuItemFormValues = z.infer<typeof menuItemFormSchema>;

// Nested field array (options within a group) needs its own component: React
// Hook Form's useFieldArray can't be called with a dynamic index-based name
// inside a .map() over the parent array.
function OptionGroupFields({ control, groupIndex, onRemoveGroup }: { control: Control<MenuItemFormValues>; groupIndex: number; onRemoveGroup: () => void }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `optionGroups.${groupIndex}.options`,
  });

  return (
    <div className="p-3 border rounded-lg space-y-3">
      <div className="flex items-center gap-3">
        <FormField control={control} name={`optionGroups.${groupIndex}.name`} render={({ field }) => (
          <FormItem className="flex-1"><FormControl><Input {...field} placeholder="Ej: Tamaño" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={control} name={`optionGroups.${groupIndex}.required`} render={({ field }) => (
          <FormItem className="flex items-center gap-2">
            <FormLabel className="text-xs font-normal whitespace-nowrap">Obligatorio</FormLabel>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <Button type="button" variant="destructive" size="icon" className="h-8 w-8 shrink-0" onClick={onRemoveGroup}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
      <div className="space-y-2 pl-2 border-l-2">
        {fields.map((field, optionIndex) => (
          <div key={field.id} className="flex items-center gap-2">
            <FormField control={control} name={`optionGroups.${groupIndex}.options.${optionIndex}.name`} render={({ field }) => (
              <FormItem className="flex-1"><FormControl><Input {...field} placeholder="Ej: Grande" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={control} name={`optionGroups.${groupIndex}.options.${optionIndex}.priceDelta`} render={({ field }) => (
              <FormItem className="w-28"><FormControl><Input type="number" {...field} placeholder="+0 XAF" /></FormControl><FormMessage /></FormItem>
            )} />
            <Button type="button" variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-destructive" onClick={() => remove(optionIndex)} disabled={fields.length <= 1}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', priceDelta: 0 })}>
          <PlusCircle className="mr-2 h-3.5 w-3.5" /> Añadir Opción
        </Button>
      </div>
    </div>
  );
}

interface MenuItemFormProps {
  type: 'Create' | 'Update';
  companyId: string;
  userId: string;
  initialData?: MenuItem;
  foodTypes: string[];
  onFormSubmit: () => void;
}

export function MenuItemForm({ type, companyId, userId, initialData, foodTypes, onFormSubmit }: MenuItemFormProps) {
  const { toast } = useToast();
  const { uploadFile, isUploading } = useStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.image || null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const defaultValues: MenuItemFormValues = initialData ? {
    name: initialData.name,
    description: initialData.description,
    price: initialData.price,
    foodType: initialData.foodType,
    isMenuDelDia: initialData.isMenuDelDia || false,
    available: initialData.available ?? true,
    optionGroups: (initialData.optionGroups || []).map(g => ({
      name: g.name,
      required: g.required,
      options: g.options.map(o => ({ name: o.name, priceDelta: o.priceDelta })),
    })),
  } : {
    name: '',
    description: '',
    price: 0,
    foodType: '',
    isMenuDelDia: false,
    available: true,
    optionGroups: [],
  };

  const form = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues,
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control: form.control,
    name: "optionGroups",
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imageFile) URL.revokeObjectURL(imagePreview);
      setImagePreview(URL.createObjectURL(file));
      setImageFile(file);
    }
  };

  const removeImage = () => {
    if (imagePreview && imageFile) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setImageFile(null);
  };

  const isProcessing = isSubmitting || isUploading;

  async function onSubmit(values: MenuItemFormValues) {
    setIsSubmitting(true);
    try {
      let image = initialData?.image || '';
      if (imageFile) {
        const path = `menu-items/${companyId}/${Date.now()}-${imageFile.name}`;
        image = await uploadFile(imageFile, path);
      } else if (imagePreview === null) {
        image = '';
      }

      const payload = {
        ...values,
        image,
        optionGroups: (values.optionGroups || []).map(g => ({
          id: uuidv4(),
          name: g.name,
          required: g.required,
          options: g.options.map(o => ({ id: uuidv4(), name: o.name, priceDelta: o.priceDelta })),
        })),
      };

      if (type === 'Create') {
        const result = await createMenuItem(companyId, userId, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Producto Creado", description: "El producto ha sido añadido al menú." });
      } else if (initialData) {
        const result = await updateMenuItem(initialData.id, userId, payload);
        if (!result.success) throw new Error(result.message);
        toast({ title: "Producto Actualizado", description: "Los cambios han sido guardados." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: error instanceof Error ? error.message : "No se pudo guardar el producto.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem><FormLabel>Nombre del Producto</FormLabel><FormControl><Input {...field} placeholder="Ej: Pollo a la Plancha" /></FormControl><FormMessage /></FormItem>
        )} />
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="price" render={({ field }) => (
            <FormItem><FormLabel>Precio (XAF)</FormLabel><FormControl><Input type="number" min={0} {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="foodType" render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Comida</FormLabel>
              <FormControl>
                <Input {...field} list="food-type-options" placeholder="Ej: Pescado, Pizza..." />
              </FormControl>
              <datalist id="food-type-options">
                {foodTypes.map(t => <option key={t} value={t} />)}
              </datalist>
              <FormDescription>Puede ser uno existente o nuevo.</FormDescription>
              <FormMessage />
            </FormItem>
          )} />
        </div>
        <FormField control={form.control} name="isMenuDelDia" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Menú del Día</FormLabel>
              <FormDescription>Se destaca en la parte superior del menú público.</FormDescription>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />
        <FormField control={form.control} name="available" render={({ field }) => (
          <FormItem className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <FormLabel>Disponible</FormLabel>
              <FormDescription>Desactive si el producto está agotado, sin eliminarlo del menú.</FormDescription>
            </div>
            <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
          </FormItem>
        )} />

        <div>
          <FormLabel>Grupos de Opciones (Opcional)</FormLabel>
          <FormDescription>Ej: "Tamaño" con Pequeño/Mediano/Grande, o "Nivel de Picante". El cliente elige una opción por grupo.</FormDescription>
          <div className="space-y-3 mt-3">
            {groupFields.map((field, groupIndex) => (
              <OptionGroupFields key={field.id} control={form.control} groupIndex={groupIndex} onRemoveGroup={() => removeGroup(groupIndex)} />
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => appendGroup({ name: '', required: false, options: [{ name: '', priceDelta: 0 }] })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Grupo de Opciones
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <FormLabel>Imagen (Opcional)</FormLabel>
          <Input
            id="menu-item-image-upload"
            type="file"
            className="hidden"
            accept="image/png, image/jpeg, image/gif"
            onChange={handleImageChange}
            disabled={isProcessing}
          />
          {imagePreview ? (
            <div className="relative aspect-video max-w-xs rounded-lg border-2 border-dashed flex justify-center items-center overflow-hidden">
              <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage} disabled={isProcessing}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <label
              htmlFor="menu-item-image-upload"
              className={`cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full max-w-xs aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground ${isProcessing ? 'cursor-not-allowed' : ''}`}
            >
              <UploadCloud className="w-8 h-8 mb-2" />
              <span>Subir imagen</span>
            </label>
          )}
        </div>

        <Button type="submit" disabled={isProcessing}>
          {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isUploading ? 'Subiendo imagen...' : isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Producto' : 'Guardar Cambios')}
        </Button>
      </form>
    </Form>
  );
}
