'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BadgeCheck, Heart, Loader2, MessageSquareReply, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  askProductQuestion, canReplyToReviews, getReviewEligibility, getWishlistIds, replyToProductReview, setWishlist, submitProductReview,
} from '@/lib/shop/engagement';
import type { ProductQuestion, ProductReviewsData } from '@/lib/shop/types';

// ---------------------------------------------------------------- wishlist

export function WishlistButton({ productId, className }: { productId: string; className?: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) getWishlistIds().then(ids => setSaved(ids.includes(productId)));
  }, [user, productId]);

  const toggle = async () => {
    if (!user) {
      router.push('/signin');
      return;
    }
    setBusy(true);
    const next = !saved;
    setSaved(next);
    const result = await setWishlist(productId, next);
    setBusy(false);
    if (!result.success) {
      setSaved(!next);
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: next ? 'Guardado en su lista de deseos' : 'Quitado de su lista de deseos' });
  };

  return (
    <Button type="button" variant="outline" size="icon" onClick={toggle} disabled={busy} aria-pressed={saved} aria-label={saved ? 'Quitar de la lista de deseos' : 'Guardar en la lista de deseos'} className={className}>
      <Heart className={cn('w-5 h-5', saved && 'fill-red-500 text-red-500')} />
    </Button>
  );
}

// ---------------------------------------------------------------- reviews

function Stars({ value, size = 'w-4 h-4' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex" aria-label={`${value} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map(i => <Star key={i} className={cn(size, i <= Math.round(value) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground/40')} />)}
    </span>
  );
}

function ReviewForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [eligibility, setEligibility] = useState<Awaited<ReturnType<typeof getReviewEligibility>> | null>(null);
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getReviewEligibility(productId).then(e => {
      setEligibility(e);
      if (e.existing) {
        setRating(e.existing.rating);
        setComment(e.existing.comment);
      }
    });
  }, [productId, user]);

  if (!eligibility) return null;
  if (!eligibility.canReview) {
    return (
      <p className="text-sm text-muted-foreground">
        {eligibility.reason === 'signin'
          ? <><Link href="/signin" className="underline">Inicie sesión</Link> para valorar. Solo pueden valorar los clientes que han recibido el producto.</>
          : 'Solo pueden valorar los clientes que han recibido este producto en Oltinde.'}
      </p>
    );
  }
  if (!open) {
    return <Button variant="outline" onClick={() => setOpen(true)}>{eligibility.existing ? 'Editar mi valoración' : 'Escribir una valoración'}</Button>;
  }

  const submit = async () => {
    setBusy(true);
    const result = await submitProductReview(productId, { rating, comment });
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
      <Textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} maxLength={3000} placeholder="¿Qué le pareció el producto? ¿Lo recomendaría?" />
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
    const result = await replyToProductReview(reviewId, text);
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
      <Textarea rows={2} value={text} onChange={e => setText(e.target.value)} maxLength={2000} placeholder="Respuesta pública del vendedor" />
      <Button size="sm" onClick={send} disabled={busy || text.trim().length < 2}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Publicar respuesta</Button>
    </div>
  );
}

export function ProductReviews({ productId, data }: { productId: string; data: ProductReviewsData }) {
  const [showAll, setShowAll] = useState(false);
  const router = useRouter();
  const [canReply, setCanReply] = useState(false);
  const [replying, setReplying] = useState<string | null>(null);
  useEffect(() => { canReplyToReviews(productId).then(setCanReply); }, [productId]);
  const visible = showAll ? data.reviews : data.reviews.slice(0, 5);
  return (
    <section id="valoraciones" className="space-y-4 scroll-mt-24">
      <h2 className="text-xl font-bold">Valoraciones de clientes</h2>
      {data.count > 0 ? (
        <div className="grid sm:grid-cols-[220px_1fr] gap-6">
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
            <ReviewForm productId={productId} />
            <ul className="space-y-4">
              {visible.map(r => (
                <li key={r.id} className="border-b pb-4 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Stars value={r.rating} />
                    <span className="font-medium text-sm">{r.author}</span>
                    {r.isVerifiedPurchase && <span className="text-xs text-green-700 flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5" />Compra verificada</span>}
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(r.date).toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
                  <p className="text-sm whitespace-pre-line">{r.comment}</p>
                  {r.replyText && (
                    <div className="ml-4 mt-2 rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium flex items-center gap-1.5"><MessageSquareReply className="w-4 h-4" />Respuesta del vendedor</p>
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
          <p className="text-sm text-muted-foreground">Este producto todavía no tiene valoraciones.</p>
          <ReviewForm productId={productId} />
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- questions

export function ProductQuestions({ productId, questions }: { productId: string; questions: ProductQuestion[] }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const answered = questions.filter(q => q.answer);
  const visible = showAll ? questions : questions.slice(0, 5);

  const ask = async () => {
    setBusy(true);
    const result = await askProductQuestion(productId, text);
    setBusy(false);
    if (!result.success) {
      toast({ title: 'No se pudo enviar', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Pregunta enviada', description: 'Le avisaremos cuando el vendedor responda.' });
    setText('');
    router.refresh();
  };

  return (
    <section id="preguntas" className="space-y-4 scroll-mt-24">
      <h2 className="text-xl font-bold">Preguntas y respuestas {answered.length > 0 && <span className="text-base font-normal text-muted-foreground">({answered.length})</span>}</h2>
      {user ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <Textarea rows={1} value={text} onChange={e => setText(e.target.value)} maxLength={1000} placeholder="Pregunte al vendedor: garantía, medidas, compatibilidad..." className="min-h-10" />
          <Button onClick={ask} disabled={busy || text.trim().length < 10} className="shrink-0">{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Preguntar</Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground"><Link href="/signin" className="underline">Inicie sesión</Link> para hacer una pregunta al vendedor.</p>
      )}
      {questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nadie ha preguntado todavía. ¡Sea el primero!</p>
      ) : (
        <ul className="space-y-4">
          {visible.map(q => (
            <li key={q.id} className="space-y-1 border-b pb-3 text-sm">
              <p><span className="font-semibold">P:</span> {q.question}</p>
              {q.answer
                ? <p><span className="font-semibold">R:</span> <span className="whitespace-pre-line">{q.answer}</span></p>
                : <p className="text-muted-foreground italic">Pendiente de respuesta del vendedor</p>}
              <p className="text-xs text-muted-foreground">{q.authorName} · {new Date(q.createdAt).toLocaleDateString('es-ES')}</p>
            </li>
          ))}
        </ul>
      )}
      {questions.length > 5 && !showAll && <Button variant="link" className="px-0" onClick={() => setShowAll(true)}>Ver las {questions.length} preguntas</Button>}
    </section>
  );
}
