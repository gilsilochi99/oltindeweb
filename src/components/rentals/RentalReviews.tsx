'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, MessageSquareReply, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { canReplyToRentalReviews, getRentalReviewEligibility, replyToRentalReview, submitRentalReview } from '@/lib/rentals/engagement';
import type { RentalReviewEligibility, RentalReviewsData } from '@/lib/rentals/types';

// Reviews on a rental listing. Only customers whose booking has ended can
// write one; the advertiser can reply. Mirrors the shop's ProductReviews.

function Stars({ value, size = 'w-4 h-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value.toFixed(1)} de 5`}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />)}
    </span>
  );
}

function ReviewForm({ listingId }: { listingId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<RentalReviewEligibility | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getRentalReviewEligibility(listingId).then(e => {
      setEligibility(e);
      if (e.existing) {
        setRating(e.existing.rating);
        setComment(e.existing.comment);
      }
    });
  }, [listingId, user]);

  if (!eligibility) return null;
  if (!eligibility.canReview) {
    return (
      <p className="text-sm text-muted-foreground">
        {eligibility.reason === 'signin'
          ? <><Link href="/signin" className="underline">Inicie sesión</Link> para valorar. Solo pueden valorar los clientes que han reservado en Oltinde.</>
          : 'Podrá valorar este alquiler cuando termine una reserva suya hecha en Oltinde.'}
      </p>
    );
  }
  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>{eligibility.existing ? 'Editar mi valoración' : 'Escribir una valoración'}</Button>;
  }

  const submit = async () => {
    setBusy(true);
    const result = await submitRentalReview(listingId, { rating, comment });
    setBusy(false);
    if (!result.success) {
      toast({ title: 'No se pudo guardar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: '¡Gracias por su valoración!' });
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} type="button" onClick={() => setRating(i)} onMouseEnter={() => setHover(i)} aria-label={`${i} estrellas`}>
            <Star className={cn('w-7 h-7', i <= (hover || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />
          </button>
        ))}
      </div>
      <Textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} maxLength={3000} placeholder="¿Cómo fue su experiencia? ¿Lo recomendaría?" />
      <div className="flex gap-2">
        <Button onClick={submit} disabled={busy || rating === 0 || comment.trim().length < 10}>
          {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Publicar
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </div>
  );
}

function ReplyForm({ reviewId, initial, onDone }: { reviewId: string; initial?: string; onDone: () => void }) {
  const { toast } = useToast();
  const [text, setText] = useState(initial ?? '');
  const [busy, setBusy] = useState(false);
  const send = async () => {
    setBusy(true);
    const result = await replyToRentalReview(reviewId, text);
    setBusy(false);
    if (!result.success) {
      toast({ title: 'No se pudo responder', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Respuesta publicada' });
    onDone();
  };
  return (
    <div className="ml-4 mt-2 space-y-2">
      <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder="Respuesta pública de la empresa" />
      <Button size="sm" onClick={send} disabled={busy || text.trim().length < 2}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Publicar respuesta</Button>
    </div>
  );
}

export function RentalReviews({ listingId, data }: { listingId: string; data: RentalReviewsData }) {
  const router = useRouter();
  const [showAll, setShowAll] = useState(false);
  const [canReply, setCanReply] = useState(false);
  const [replying, setReplying] = useState<string | null>(null);
  useEffect(() => { canReplyToRentalReviews(listingId).then(setCanReply); }, [listingId]);
  const visible = showAll ? data.reviews : data.reviews.slice(0, 5);

  return (
    <section id="valoraciones" className="space-y-4 scroll-mt-24">
      <h2 className="text-xl font-bold">Valoraciones</h2>
      {data.count > 0 ? (
        <div className="grid sm:grid-cols-[200px_1fr] gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2"><Stars value={data.average} size="w-5 h-5" /><span className="font-bold text-lg">{data.average.toFixed(1)}</span></div>
            <p className="text-sm text-muted-foreground">{data.count} {data.count === 1 ? 'valoración' : 'valoraciones'}</p>
            {[5, 4, 3, 2, 1].map(star => {
              const n = data.distribution[star - 1];
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-12">{star} estr.</span>
                  <div className="flex-1 h-2.5 rounded bg-muted overflow-hidden"><div className="h-full bg-yellow-400" style={{ width: `${(n / data.count) * 100}%` }} /></div>
                  <span className="w-8 text-right text-muted-foreground">{n}</span>
                </div>
              );
            })}
          </div>
          <div className="space-y-4">
            <ReviewForm listingId={listingId} />
            <ul className="space-y-4">
              {visible.map(r => (
                <li key={r.id} className="border-b pb-4 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-medium text-sm">{r.author}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                  <p className="text-sm whitespace-pre-line">{r.comment}</p>
                  {r.replyText && (
                    <div className="ml-4 mt-2 rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium flex items-center gap-1.5"><MessageSquareReply className="w-4 h-4" />Respuesta de la empresa</p>
                      <p className="whitespace-pre-line">{r.replyText}</p>
                    </div>
                  )}
                  {canReply && replying !== r.id && (
                    <Button variant="link" size="sm" className="px-0" onClick={() => setReplying(r.id)}>{r.replyText ? 'Editar respuesta' : 'Responder'}</Button>
                  )}
                  {canReply && replying === r.id && <ReplyForm reviewId={r.id} initial={r.replyText} onDone={() => { setReplying(null); router.refresh(); }} />}
                </li>
              ))}
            </ul>
            {data.reviews.length > 5 && !showAll && <Button variant="link" className="px-0" onClick={() => setShowAll(true)}>Ver las {data.reviews.length} valoraciones</Button>}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Este alquiler todavía no tiene valoraciones.</p>
          <ReviewForm listingId={listingId} />
        </div>
      )}
    </section>
  );
}
