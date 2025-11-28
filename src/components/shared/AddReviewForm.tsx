
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import Link from 'next/link';
import { addReview } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface AddReviewFormProps {
  entityId: string;
  entityType: 'companies' | 'institutions' | 'procedures';
}

export function AddReviewForm({ entityId, entityType }: AddReviewFormProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Por favor, inicie sesión para dejar una reseña.", variant: "destructive" });
      return;
    }
    if (rating === 0) {
      toast({ title: "Por favor, seleccione una calificación.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addReview({
        entityId,
        entityType,
        reviewData: { rating, comment },
        userId: user.uid,
        authorName: user.displayName || 'Anónimo',
      });

      if (result.success) {
        toast({
          title: "Reseña Enviada",
          description: "Gracias por su opinión. Su reseña ha sido enviada.",
        });
        setRating(0);
        setComment('');
        router.refresh(); // Refresh the page to show the new review
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({
        title: "Error al enviar la reseña",
        description: error.message || "Por favor, inténtelo de nuevo más tarde.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
        <Card className="text-center">
            <CardHeader>
                <CardTitle>Únase a la Conversación</CardTitle>
                <CardDescription>
                    <Link href="/signin" className="text-primary font-bold hover:underline">Inicie sesión</Link> para dejar su reseña.
                </CardDescription>
            </CardHeader>
        </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Deje su Reseña</CardTitle>
        <CardDescription>Comparta su experiencia con la comunidad.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Calificación</Label>
            <div className="flex items-center" onMouseLeave={() => setHoverRating(0)}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'h-8 w-8 cursor-pointer text-gray-300 transition-colors',
                    (hoverRating >= star || rating >= star) && 'text-accent fill-accent'
                  )}
                  onMouseEnter={() => setHoverRating(star)}
                  onClick={() => setRating(star)}
                />
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentario</Label>
            <Textarea
              id="comment"
              name="comment"
              placeholder="Describa su experiencia..."
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando...' : 'Enviar Reseña'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
