
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Post } from '@/lib/types';
import { PublicationForm } from '@/components/shared/PublicationForm';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function EditPublicationPage() {
  const { id } = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        setLoading(true);
        const postDocRef = doc(db, 'posts', id as string);
        const postDocSnap = await getDoc(postDocRef);
        if (postDocSnap.exists()) {
          setPost({ id: postDocSnap.id, ...postDocSnap.data() } as Post);
        } else {
          toast({ title: "Error", description: "Post not found.", variant: "destructive" });
          router.push('/dashboard');
        }
        setLoading(false);
      };
      fetchPost();
    }
  }, [id, router, toast]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    try {
      const postDocRef = doc(db, 'posts', id as string);
      await updateDoc(postDocRef, data);
      toast({ title: "Success", description: "Post updated successfully." });
      router.push('/dashboard/contribuciones');
    } catch (error) {
      console.error("Error updating post: ", error);
      toast({ title: "Error", description: "Failed to update post.", variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin h-10 w-10" /></div>;
  }

  if (!post) {
    return <div className="container mx-auto p-4 md:p-8"><h1 className="text-3xl font-bold">Post not found</h1></div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline">Editar Publicación</h1>
            <p className="text-muted-foreground">Actualice los detalles de su publicación aquí.</p>
          </div>
        </div>
        <PublicationForm type="Update" initialData={post} onFormSubmit={handleSubmit} />
      </div>
    </div>
  );
}
