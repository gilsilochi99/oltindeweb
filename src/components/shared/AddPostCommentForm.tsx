'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { addPostComment } from '@/lib/actions';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface AddPostCommentFormProps {
  postId: string;
}

export function AddPostCommentForm({ postId }: AddPostCommentFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Por favor, inicie sesión para comentar.", variant: "destructive" });
      return;
    }
    if (!comment.trim()) {
      toast({ title: "El comentario no puede estar vacío.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addPostComment({
        postId,
        comment,
        userId: user.uid,
        authorName: user.displayName || 'Anónimo',
      });

      if (result.success) {
        toast({ title: "Comentario Enviado" });
        setComment('');
        router.refresh(); 
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error al enviar el comentario",
        description: error.message || "Por favor, inténtelo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center p-4 border-2 border-dashed rounded-lg">
        <p className="text-muted-foreground">
          <Link href="/signin" className="text-primary font-bold hover:underline">Inicie sesión</Link> o <Link href="/signup" className="text-primary font-bold hover:underline">regístrese</Link> para dejar un comentario.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Dejar un Comentario</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="comment" className="sr-only">Comentario</Label>
          <Textarea
            id="comment"
            name="comment"
            placeholder={`Comentando como ${user.displayName}...`}
            rows={4}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isSubmitting ? 'Enviando...' : 'Enviar Comentario'}
        </Button>
      </form>
    </div>
  );
}
