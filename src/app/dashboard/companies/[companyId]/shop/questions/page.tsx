'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, MessageCircleQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { SellerGate } from '@/components/shop/SellerGate';
import { answerProductQuestion, getSellerQuestions, hideProductQuestion, type SellerQuestion } from '@/lib/shop/engagement';
import type { Company } from '@/lib/types';

function QuestionItem({ q, onDone }: { q: SellerQuestion; onDone: () => void }) {
  const { toast } = useToast();
  const [answer, setAnswer] = useState(q.answer ?? '');
  const [editing, setEditing] = useState(!q.answer);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const result = await answerProductQuestion(q.id, answer);
    setBusy(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Respuesta publicada', description: 'El cliente ha recibido un aviso.' });
    onDone();
  };

  const hide = async () => {
    const result = await hideProductQuestion(q.id);
    if (result.success) {
      toast({ title: 'Pregunta ocultada' });
      onDone();
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex justify-between gap-2 text-sm">
          <Link href={`/tienda/p/${q.productSlug}#preguntas`} target="_blank" className="font-medium hover:underline line-clamp-1">{q.productTitle}</Link>
          <span className="text-muted-foreground whitespace-nowrap">{new Date(q.createdAt).toLocaleDateString('es-ES')}</span>
        </div>
        <p><span className="font-semibold">{q.authorName}:</span> {q.question}</p>
        {editing ? (
          <div className="space-y-2">
            <Textarea rows={2} value={answer} onChange={e => setAnswer(e.target.value)} maxLength={2000} placeholder="Escriba su respuesta (será pública)" />
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={save} disabled={busy || answer.trim().length < 2}>{busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Publicar respuesta</Button>
              {q.answer && <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancelar</Button>}
              <Button size="sm" variant="ghost" className="text-destructive ml-auto" onClick={hide}>Ocultar pregunta</Button>
            </div>
          </div>
        ) : (
          <div className="rounded-md bg-muted p-3 text-sm flex justify-between gap-2">
            <p className="whitespace-pre-line"><span className="font-semibold">Su respuesta:</span> {q.answer}</p>
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Editar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SellerQuestions({ company }: { company: Company }) {
  const [unansweredOnly, setUnansweredOnly] = useState(true);
  const [questions, setQuestions] = useState<SellerQuestion[] | null>(null);

  const load = useCallback(async () => {
    setQuestions(await getSellerQuestions(company.id, unansweredOnly));
  }, [company.id, unansweredOnly]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold font-headline">Preguntas de clientes</h1>
        <p className="text-muted-foreground">Responder rápido ayuda a vender: las respuestas se muestran en la ficha del producto.</p>
      </div>
      <Tabs value={unansweredOnly ? 'pending' : 'all'} onValueChange={v => { setQuestions(null); setUnansweredOnly(v === 'pending'); }}>
        <TabsList>
          <TabsTrigger value="pending">Sin responder</TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>
      </Tabs>
      {!questions ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : questions.length === 0 ? (
        <Card><CardContent className="py-16 text-center space-y-2">
          <MessageCircleQuestion className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">{unansweredOnly ? 'No hay preguntas pendientes' : 'Todavía no hay preguntas'}</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-3">{questions.map(q => <QuestionItem key={q.id} q={q} onDone={load} />)}</div>
      )}
    </div>
  );
}

export default function SellerQuestionsPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId}>{company => <SellerQuestions company={company} />}</SellerGate>;
}
