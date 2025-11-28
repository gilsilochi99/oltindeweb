
'use client';

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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
import type { Post } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"
import { createPost, updatePost } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Image from "next/image"
import { UploadCloud, X } from "lucide-react"
import { Editor } from "@/components/shared/Editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


const contributionFormSchema = z.object({
  title: z.string().min(5, { message: "El título debe tener al menos 5 caracteres." }),
  excerpt: z.string().min(10, { message: "El extracto debe tener al menos 10 caracteres." }).max(200, { message: "El extracto no puede superar los 200 caracteres." }),
  content: z.string().min(50, { message: "El contenido debe tener al menos 50 caracteres." }),
  category: z.string({ required_error: "Por favor, seleccione una categoría."}),
  featuredImage: z.string().optional().or(z.literal('')),
  status: z.enum(['published', 'draft']),
});

type ContributionFormValues = z.infer<typeof contributionFormSchema>;

interface ContributionFormProps {
  type: 'Create' | 'Update';
  userId?: string;
  initialData?: Post;
  categories: string[];
  onFormSubmit?: () => void;
}

export function ContributionForm({ type, userId, initialData, categories, onFormSubmit }: ContributionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.featuredImage || null);

  const form = useForm<ContributionFormValues>({
    resolver: zodResolver(contributionFormSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: undefined,
      featuredImage: '',
      status: 'draft',
    }
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        ...initialData,
        featuredImage: initialData.featuredImage || '',
      });
      setImagePreview(initialData.featuredImage || null);
    }
  }, [initialData, form]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('featuredImage', result, { shouldDirty: true });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    form.setValue('featuredImage', '', { shouldDirty: true });
  }

  async function onSubmit(values: ContributionFormValues) {
    setIsSubmitting(true);
    
    try {
      if (type === 'Create') {
        if (!userId) throw new Error("User ID is required to create a post.");
        await createPost({ authorId: userId, postData: values });
        toast({
          title: "Contribución Creada",
          description: "Su contribución ha sido guardada como borrador.",
        });
        if (onFormSubmit) onFormSubmit();
        else router.push('/dashboard/contribuciones');
      } else if (type === 'Update' && initialData) {
        await updatePost({
          postId: initialData.id,
          postData: values,
        });
        toast({
          title: "Contribución Actualizada",
          description: "Los cambios han sido guardados.",
        });
        if (onFormSubmit) onFormSubmit();
        else router.push('/dashboard/contribuciones');
      }
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: `No se pudo guardar la contribución. Por favor, inténtelo de nuevo.`,
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
                <CardTitle>Contenido Principal</CardTitle>
                <CardDescription>Escriba aquí el cuerpo de su artículo o contribución.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título</FormLabel>
                      <FormControl>
                        <Input placeholder="Un título atractivo para su publicación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="excerpt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Extracto</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Un resumen corto que invite a leer más. (Máx. 200 caracteres)"
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contenido Completo</FormLabel>
                      <FormControl>
                         <Editor value={field.value} onChange={field.onChange} />
                      </FormControl>
                      <FormDescription>
                        Utilice el editor para formatear su texto, añadir enlaces, listas e imágenes.
                      </FormDescription>
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
                <CardTitle>Publicación</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Estado</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccione un estado" />
                            </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="draft">Borrador</SelectItem>
                                <SelectItem value="published">Publicado</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormDescription>
                            Los borradores no son visibles públicamente.
                        </FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" disabled={isSubmitting} className="w-full">
                  {isSubmitting ? 'Guardando...' : (type === 'Create' ? 'Crear Contribución' : 'Guardar Cambios')}
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Detalles</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoría</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccione una categoría" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="featuredImage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Imagen Destacada</FormLabel>
                      <FormControl>
                        <div>
                          <Input
                            id="image-upload"
                            type="file"
                            className="hidden"
                            accept="image/png, image/jpeg, image/gif"
                            onChange={handleImageChange}
                            disabled={isSubmitting}
                          />
                          {imagePreview ? (
                            <div className="relative w-full h-48 rounded-lg border-2 border-dashed flex justify-center items-center">
                              <Image src={imagePreview} alt="Vista previa" fill style={{ objectFit: 'cover' }} className="rounded-lg" />
                              <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <label
                              htmlFor="image-upload"
                              className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full h-48 rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                            >
                              <UploadCloud className="w-8 h-8 mb-2" />
                              <span>Subir Imagen</span>
                              <span className="text-xs mt-1">PNG, JPG, GIF</span>
                            </label>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription>Esta imagen aparecerá al principio de su artículo.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
