
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
import { useStorage } from '@/hooks/use-storage'; // Import useStorage

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
  const { uploadFile, isUploading } = useStorage(); // Use storage hook

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isUserSubmission, setIsUserSubmission] = useState(false);
  const [serviceCategories, setServiceCategories] = useState<string[]>([]);
  
  useEffect(() => {
    setIsUserSubmission(pathname.startsWith('/dashboard'));
  }, [pathname]);

  const form = useForm<PostFormValues>({
    resolver: zodResolver(postFormSchema),
    defaultValues: { title: '', excerpt: '', content: '', category: '', featuredImage: '', imageDescription: '', status: 'draft' },
  });

  useEffect(() => {
    async function fetchInitialData() {
        // ... (fetch logic remains the same)
    }
    fetchInitialData();
  }, [id, form, isAdmin, user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
    }
  };
  
  const removeImage = () => {
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    setImageFile(null);
    form.setValue('featuredImage', '', { shouldDirty: true });
  };

  const onSubmit = async (values: PostFormValues) => {
    setIsSubmitting(true);
    if (!user) { /* ... */ return; }

    try {
      let imageUrl = post?.featuredImage || '';
      if (imageFile) {
        const path = `posts/${user.uid}/${Date.now()}-${imageFile.name}`;
        const downloadURL = await uploadFile(imageFile, path);
        if (!downloadURL) {
          toast({ title: "Error al subir la imagen", variant: "destructive" });
          setIsSubmitting(false);
          return;
        }
        imageUrl = downloadURL;
      } else if (!imagePreview) {
          // Image was removed
          imageUrl = '';
      }
      
      const submissionValues = { ...values, featuredImage: imageUrl };
      const redirectPath = isAdmin ? `/admin/contribuciones` : `/dashboard`;

      if (id === 'new') {
          // Create logic
      } else if (typeof id === 'string') {
          // Update logic
      }

    } catch (error: any) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const isProcessing = isSubmitting || isUploading;

  // ... (rest of the component JSX, using isProcessing to disable inputs)

  return (
      <div className="space-y-6">
          {/* ... */}
          <Button type="submit" disabled={isProcessing} className="w-full">
              {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin"/>}
              {id === 'new' ? 'Crear Publicación' : 'Guardar Cambios'}
          </Button>
          {/* ... */}
      </div>
  );
}
