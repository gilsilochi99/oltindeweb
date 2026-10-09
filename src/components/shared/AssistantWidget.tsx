'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, Loader2, MessageCircleQuestion, RotateCcw, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { askAssistant, getAssistantPublicState, type AssistantTurn } from '@/lib/assistant';

const SUGGESTIONS = ['¿Cómo compro en la Tienda?', '¿Qué farmacias están de guardia?', '¿Cómo publico mi empresa?', '¿Qué necesito para el pasaporte?'];

// Tiny, safe Markdown: links to our own pages, **bold**, lists, paragraphs.
// Built as React elements (no HTML injection).
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1]) {
      const href = m[2];
      const internal = href.startsWith('/') && !href.startsWith('//');
      out.push(internal
        ? <Link key={`${key}-${i++}`} href={href} className="underline text-secondary font-medium">{m[1]}</Link>
        : href.startsWith('https://')
          ? <a key={`${key}-${i++}`} href={href} target="_blank" rel="noopener noreferrer nofollow" className="underline text-secondary">{m[1]}</a>
          : m[1]);
    } else {
      out.push(<strong key={`${key}-${i++}`}>{m[3]}</strong>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function AssistantMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, b) => {
        const lines = block.split('\n').filter((l) => l.trim());
        const isList = lines.length > 0 && lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l));
        if (isList) {
          const ordered = /^\s*\d/.test(lines[0]);
          const Tag = ordered ? 'ol' : 'ul';
          return (
            <Tag key={b} className={cn('pl-5 space-y-1', ordered ? 'list-decimal' : 'list-disc')}>
              {lines.map((l, j) => <li key={j}>{inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''), `${b}-${j}`)}</li>)}
            </Tag>
          );
        }
        return (
          <p key={b}>
            {lines.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l.replace(/^#+\s*/, ''), `${b}-${j}`)}</Fragment>)}
          </p>
        );
      })}
    </div>
  );
}

// Floating "¿Necesita ayuda?" button + chat panel, on every public page.
export function AssistantWidget() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let cancelled = false;
    getAssistantPublicState().then((s) => !cancelled && setEnabled(s.enabled)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, busy]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!enabled || pathname?.startsWith('/admin')) return null;

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    setError(null);
    setInput('');
    const history = turns;
    setTurns([...history, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const reply = await askAssistant(q, history);
      if (reply.success) setTurns((prev) => [...prev, { role: 'assistant', content: reply.answer }]);
      else setError(reply.message);
    } catch {
      setError('No se pudo conectar con el asistente. Inténtelo de nuevo.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-50 flex items-center gap-2 rounded-full bg-black text-white pl-3.5 pr-4 h-12 shadow-lg hover:bg-black/85 transition-colors"
          aria-label="Abrir el asistente de Oltinde"
        >
          <MessageCircleQuestion className="w-5 h-5 text-primary" />
          <span className="text-sm font-semibold hidden sm:inline">¿Necesita ayuda?</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Asistente de Oltinde"
          className="fixed z-50 inset-x-0 bottom-0 top-16 sm:inset-auto sm:right-4 sm:bottom-6 sm:w-[400px] sm:h-[600px] sm:max-h-[calc(100vh-6rem)] flex flex-col bg-background border border-border sm:rounded-lg shadow-2xl animate-in fade-in-0 slide-in-from-bottom-4"
        >
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-primary">
            <Bot className="w-5 h-5" />
            <div className="flex-1">
              <p className="font-semibold leading-tight">Asistente Oltinde</p>
              <p className="text-xs text-black/70">Respuestas sobre Oltinde y el directorio</p>
            </div>
            {turns.length > 0 && (
              <Button variant="ghost" size="icon" onClick={() => { setTurns([]); setError(null); }} aria-label="Nueva conversación" className="hover:bg-black/10">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Cerrar" className="hover:bg-black/10">
              <X className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm">
            {turns.length === 0 && (
              <div className="space-y-3">
                <p className="text-muted-foreground">Hola. Pregúnteme cómo usar Oltinde o qué busca: empresas, trámites, farmacias, la Tienda, alquileres…</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} type="button" onClick={() => ask(s)} className="text-left text-xs rounded-full border border-border px-3 py-1.5 hover:bg-muted">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {turns.map((t, i) => (
              <div key={i} className={cn('flex', t.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div className={cn('max-w-[88%] rounded-lg px-3 py-2', t.role === 'user' ? 'bg-primary text-black' : 'bg-muted')}>
                  {t.role === 'user' ? t.content : <AssistantMarkdown text={t.content} />}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Pensando…</div>
            )}
            {error && <p className="text-destructive text-xs">{error}</p>}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="border-t border-border p-3 flex items-end gap-2 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3"
          >
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ask(input); } }}
              rows={1}
              maxLength={600}
              placeholder="Escriba su pregunta…"
              className="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40 max-h-32"
            />
            <Button type="submit" size="icon" disabled={busy || !input.trim()} aria-label="Enviar">
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="px-3 pb-2 text-[11px] text-muted-foreground text-center">
            El asistente puede equivocarse. Para casos concretos, <Link href="/contact" className="underline">contacte con soporte</Link>.
          </p>
        </div>
      )}
    </>
  );
}
