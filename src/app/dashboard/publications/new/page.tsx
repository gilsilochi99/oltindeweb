
'use client';

import { useRouter } from 'next/navigation';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { PublicationForm } from '@/components/shared/PublicationForm';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';

export default function NewPublicationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async (data: any) => {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to create a post.", variant: "destructive" });
        return;
    }

    try {
      await addDoc(collection(db, 'posts'), {
        ...data,
        authorId: user.uid,
        createdAt: new Date(),
      });
      toast({ title: "Success", description: "Post created successfully." });
      router.push('/dashboard/contribuciones');
    } catch (error) {
      console.error("Error creating post: ", error);
      toast({ title: "Error", description: "Failed to create post.", variant: "destructive" });
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
            <div className="flex justify-between items-start mb-6">
                <div>
                <h1 className="text-3xl font-bold font-headline">Crear Nueva Publicación</h1>
                <p className="text-muted-foreground">Comparta su conocimiento y experiencia con la comunidad.</p>
                </div>
            </div>
            <PublicationForm type="Create" onFormSubmit={handleSubmit} />
        </div>
    </div>
  );
}
