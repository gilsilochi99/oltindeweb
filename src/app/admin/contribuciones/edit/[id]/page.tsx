'use client';

import { useEffect, useState } from 'react';
import { useRouter, notFound, usePathname, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getPostById, getServices } from '@/lib/data';
import { createPost, updatePost } from '@/lib/actions';
import type { Post } from '@/lib/types';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UploadCloud, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { Editor } from '@/components/shared/Editor';

const postFormSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres.'),
  excerpt: z.string().min(10, 'El extracto debe tener al menos 10 caracteres.').max(200, 'El extracto no puede superar los 200 caracteres.'),
  content: z.string().min(50, 'El contenido debe tener al menos 50 caracteres.'),
  category: z.string().optional(),
  featuredImage: z.string().optional(),
  imageDescription: z.string().optional(),
  status: z.enum(['draft', 'pending', 'published']),
});

type PostFormValues = z.infer<typeof postFormSchema>;

export default function EditPostPage() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { id } = params;

  const { user, loading: authLoading, isAdmin } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUserSubmission, setIsUserSubmission] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  
  useEffect(() => {
    setIsUserSubmission(pathname.startsWith('/dashboard'));
  }, [pathname]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: '',
      excerpt: '',
      content: '',
      category: '',
      featuredImage: '',
      imageDescription: '',
      status: 'draft',
    },
  });

  useEffect(() => {
    async function fetchInitialData() {
        if (typeof id === 'string' && id !== 'new') {
            const postData = await getPostById(id);
             if (!postData) {
                return notFound();
            }
            // Security check: regular users can only edit their own posts
            if (!isAdmin && user && postData.authorId !== user.uid) {
                notFound();
            }
            setPost(postData);
            form.reset({
                title: postData.title,
                excerpt: postData.excerpt,
                content: postData.content,
                category: postData.category || '',
                featuredImage: postData.featuredImage,
                imageDescription: postData.imageDescription || '',
                status: postData.status,
            });
            if(postData.featuredImage) setImagePreview(postData.featuredImage);
        }
        
        const services = await getServices();
        const uniqueCategories = [...new Set(services.map(s => s.category))];
        setServiceCategories(uniqueCategories);

        setIsLoading(false);
    }
    
    fetchInitialData();
  }, [id, form, isAdmin, user]);

  useEffect(() => {
    // If a non-admin is creating a new post, default status to 'pending'
    if (id === 'new' && !isAdmin) {
        form.setValue('status', 'pending');
    }
     // If an admin is creating a new post, default status to 'draft'
    if (id === 'new' && isAdmin) {
        form.setValue('status', 'draft');
    }
  }, [isAdmin, id, form]);
  
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

  const onSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    if (!user) {
        toast({ title: "No autenticado", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }

    const redirectPath = isAdmin ? `/admin/contribuciones` : `/dashboard`;
    
    // For non-admins, force status to 'pending' on new posts
    const finalStatus = (id === 'new' && !isAdmin) ? 'pending' : values.status;
    
    const submissionValues = {
        ...values,
        category: values.category === 'general' ? '' : values.category,
    };

    try {
        if (id === 'new') {
            const result = await createPost({ 
                ...submissionValues, 
                status: finalStatus,
                authorId: user.uid 
            });
            if (result.success) {
                toast({ title: "Publicación Creada", description: "Su publicación ha sido enviada para revisión." });
                router.push(redirectPath);
            } else {
                throw new Error(result.message);
            }
        } else if (typeof id === 'string') {
            const result = await updatePost(id, submissionValues, post?.featuredImage || '');
            if (result.success) {
                toast({ title: "Publicación actualizada" });
                router.push(redirectPath);
                router.refresh();
            } else {
                 throw new Error(result.message);
            }
        }
    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };

  if (isLoading || authLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }
  
  if (!user) {
    // Should be handled by layout, but as a fallback
    router.push('/signin');
    return null;
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-3xl font-bold font-headline">{id === 'new' ? 'Crear Nueva Publicación' : 'Editar Publicación'}</h1>
        </div>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                         <Card>
                            <CardHeader><CardTitle>Contenido Principal</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField name="title" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Título</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                 <FormField name="excerpt" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Extracto</FormLabel>
                                        <FormControl><Textarea {...field} rows={3} /></FormControl>
                                        <FormDescription>Un resumen corto para la vista previa de la publicación.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="content" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Contenido Principal</FormLabel>
                                        <FormControl>
                                            <Editor value={field.value} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </CardContent>
                         </Card>
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Publicación</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                {isAdmin && (
                                    <FormField name="status" control={form.control} render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Estado</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="draft">Borrador</SelectItem>
                                                    <SelectItem value="pending">Pendiente de Revisión</SelectItem>
                                                    <SelectItem value="published">Publicado</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}/>
                                )}
                                {!isAdmin && (
                                    <div className="text-sm p-3 bg-secondary rounded-md border">
                                        <p>Su publicación se guardará como <span className="font-semibold">'Pendiente de Revisión'</span> y un administrador la aprobará antes de que sea visible públicamente.</p>
                                    </div>
                                )}
                                <Button type="submit" disabled={isSubmitting} className="w-full">
                                    {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
                                    {id === 'new' ? 'Crear Publicación' : 'Guardar Cambios'}
                                </Button>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardHeader><CardTitle>Imagen y Categoría</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                 <FormField
                                    control={form.control}
                                    name="featuredImage"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Imagen Destacada</FormLabel>
                                        <FormControl>
                                            <div className="w-full">
                                                <Input 
                                                    id="image-upload"
                                                    type="file" 
                                                    className="hidden"
                                                    accept="image/png, image/jpeg, image/gif"
                                                    onChange={handleImageChange}
                                                    disabled={isSubmitting}
                                                />
                                                {imagePreview ? (
                                                    <div className="relative aspect-video rounded-lg border-2 border-dashed flex justify-center items-center">
                                                        <Image src={imagePreview} alt="Vista previa" fill objectFit="cover" className="rounded-lg" />
                                                        <Button type="button" variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full z-10" onClick={removeImage}>
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <label 
                                                        htmlFor="image-upload"
                                                        className="cursor-pointer bg-muted hover:bg-muted/80 transition-colors w-full aspect-video rounded-lg border-2 border-dashed flex flex-col justify-center items-center text-center p-4 text-muted-foreground"
                                                    >
                                                        <UploadCloud className="w-8 h-8 mb-2"/>
                                                        <span>Subir imagen</span>
                                                        <span className="text-xs mt-1">PNG, JPG, GIF</span>
                                                    </label>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField name="imageDescription" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción de la Imagen (Opcional)</FormLabel>
                                        <FormControl><Input {...field} placeholder="Ej: Foto por Fulanito de Tal" /></FormControl>
                                        <FormDescription>Aparecerá debajo de la imagen.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField name="category" control={form.control} render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Categoría</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value || 'general'}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seleccione una categoría"/></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="general">Sin categoría</SelectItem>
                                                {serviceCategories.map(cat => (
                                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                            </CardContent>
                         </Card>
                    </div>
                </div>
            </form>
        </Form>
    </div>
  );
}
