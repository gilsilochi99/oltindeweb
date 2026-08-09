
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { addReviewReply } from '@/lib/actions';
import { useRouter } from 'next/navigation';

interface ReviewReplyFormProps {
  entityId: string;
  entityType: 'companies' | 'professionals';
  ownerId?: string | null;
  reviewId: string;
  existingReply?: string;
}

// Owner-only reply box shown under a review — collapsed to a single button
// until clicked, matching the "Responder"/"Editar respuesta" affordance
// popular directories (Google Business, Yelp) use for owner responses.
//
// Ownership is checked client-side (like ClaimButton/FavoriteButton on the
// same detail pages) rather than passed down from the server component:
// these company/professional pages are statically rendered/ISR-cached, and
// computing this server-side would require calling cookies() unconditionally
// on every request, forcing the whole page back to fully dynamic rendering.
export function ReviewReplyForm({ entityId, entityType, ownerId, reviewId, existingReply }: ReviewReplyFormProps) {
  const { user, isAdmin, isManager } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [comment, setComment] = useState(existingReply || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canReply = !!user && (user.uid === ownerId || isAdmin || isManager);
  if (!canReply) return null;

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast({ title: 'Escriba una respuesta antes de enviar.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await addReviewReply({ entityId, entityType, reviewId, replyComment: comment.trim() });
      if (result.success) {
        toast({ title: existingReply ? 'Respuesta actualizada' : 'Respuesta enviada' });
        setIsOpen(false);
        router.refresh();
      } else {
        throw new Error(result.message);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'No se pudo enviar la respuesta.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return (
      <Button variant="link" size="sm" className="mt-2 p-0 h-auto text-xs" onClick={() => setIsOpen(true)}>
        {existingReply ? 'Editar respuesta' : 'Responder'}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Escriba su respuesta pública..."
        rows={3}
        disabled={isSubmitting}
      />
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Enviando...' : 'Enviar respuesta'}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => { setIsOpen(false); setComment(existingReply || ''); }} disabled={isSubmitting}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}
