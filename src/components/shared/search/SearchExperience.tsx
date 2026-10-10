'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, X, Building, FileText, TicketPercent, History, Briefcase, CalendarDays, UtensilsCrossed, Map as MapIcon, Route, ShoppingBag, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import { askAssistant, type AssistantReply, type AssistantTurn } from '@/lib/assistant';
import { AssistantMarkdown } from '@/components/shared/AssistantMarkdown';
import { SearchResultCard } from '@/components/shared/SearchResultCard';
import { OfferCard } from '@/components/shared/OfferCard';
import { PostCard } from '@/components/shared/PostCard';
import { JobCard } from '@/components/shared/JobCard';
import { EventCard } from '@/components/shared/EventCard';
import { FoodResultCard } from '@/components/shared/FoodResultCard';
import { ProfessionalCard } from '@/components/shared/ProfessionalCard';
import { ItineraryCard } from '@/components/shared/ItineraryCard';
import { PlaceCard } from '@/components/shared/PlaceCard';
import { HealthFacilityCard } from '@/components/shared/HealthFacilityCard';
import { ProductCard } from '@/components/shop/ProductCard';
import { RentalCard } from '@/components/rentals/RentalCard';
import type { Company, Institution, Procedure, Service } from '@/lib/types';

// The Oltinde assistant — the one place to ask or search (it replaced the old
// Búsqueda Inteligente and the business advisor). Answers come from
// askAssistant (src/lib/assistant.ts): a stored help text and/or real
// directory results, shown here as the same cards the directory uses, with the
// AI's short intro and closing question around them when the AI is on.

type SearchableItem = (Company | Institution | Procedure | Service) & { entityType: 'company' | 'institution' | 'procedure' | 'service' };
type Answer = Extract<AssistantReply, { success: true }>;
type Turn = { role: 'user'; content: string } | { role: 'assistant'; reply: Answer } | { role: 'error'; content: string };

const EXAMPLE_QUERIES: { text: string; icon: React.ElementType }[] = [
  { text: 'empresas de construcción en Bata', icon: Building },
  { text: '¿qué necesito para el pasaporte?', icon: FileText },
  { text: 'ofertas de restaurantes', icon: TicketPercent },
  { text: 'empleos en Malabo', icon: Briefcase },
  { text: 'eventos en Bata', icon: CalendarDays },
  { text: 'móviles Samsung', icon: ShoppingBag },
  { text: 'comida en Malabo', icon: UtensilsCrossed },
  { text: 'farmacias de guardia en Malabo', icon: MapIcon },
  { text: '¿cómo pago en la Tienda?', icon: HelpCircle },
  { text: 'itinerarios de aventura', icon: Route },
];

const TURN_CAP = 4;

const tag = (type: SearchableItem['entityType']) => (item: Company | Institution | Procedure | Service): SearchableItem => ({ ...item, entityType: type });

function useAutoResizeTextarea(ref: React.RefObject<HTMLTextAreaElement>, value: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  }, [ref, value]);
}

function SparklesGlow({ small }: { small?: boolean }) {
  const size = small ? 'w-4 h-4' : 'w-5 h-5';
  return (
    <span className="relative inline-flex items-center justify-center">
      <Sparkles className={cn(size, 'absolute text-black/40 blur-sm animate-pulse')} />
      <Sparkles className={cn(size, 'relative text-black')} />
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
      </Avatar>
      <div className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl bg-muted">
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.3s]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:-0.15s]" />
        <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" />
      </div>
    </div>
  );
}

function ResultGroup<T extends { id: string }>({ title, items, render }: { title: string; items: T[]; render: (item: T) => React.ReactNode }) {
  if (items.length === 0) return null;
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => <div key={item.id}>{render(item)}</div>)}
      </div>
    </div>
  );
}

function AssistantTurnView({ reply }: { reply: Answer }) {
  const r = reply.results;
  const hasCards = !!r || reply.products.length > 0 || reply.rentals.length > 0;
  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-4 min-w-0 text-sm">
        {reply.intro && <p>{reply.intro}</p>}
        {reply.body && <AssistantMarkdown text={reply.body} />}

        {hasCards && (
          <div className="space-y-5">
            {reply.body && <p className="text-muted-foreground">También he encontrado en Oltinde:</p>}
            {r && (
              <>
                <ResultGroup title="Empresas" items={r.companies.slice(0, TURN_CAP).map(tag('company'))} render={(item) => <SearchResultCard item={item} />} />
                <ResultGroup title="Instituciones" items={r.institutions.slice(0, TURN_CAP).map(tag('institution'))} render={(item) => <SearchResultCard item={item} />} />
                <ResultGroup title="Trámites" items={r.procedures.slice(0, TURN_CAP).map(tag('procedure'))} render={(item) => <SearchResultCard item={item} />} />
                <ResultGroup title="Servicios" items={r.services.slice(0, TURN_CAP).map(tag('service'))} render={(item) => <SearchResultCard item={item} />} />
                <ResultGroup title="Ofertas" items={r.offers.slice(0, TURN_CAP)} render={(offer) => <OfferCard offer={offer} />} />
                <ResultGroup title="Publicaciones" items={r.posts.slice(0, TURN_CAP)} render={(post) => <PostCard post={post} />} />
                <ResultGroup title="Empleos" items={r.jobs.slice(0, TURN_CAP)} render={(job) => <JobCard job={job} />} />
                <ResultGroup title="Eventos" items={r.events.slice(0, TURN_CAP)} render={(event) => <EventCard event={event} />} />
                <ResultGroup title="Comida" items={r.foodItems.slice(0, TURN_CAP)} render={(item) => <FoodResultCard item={item} />} />
                <ResultGroup title="Profesionales" items={r.professionals.slice(0, TURN_CAP)} render={(pro) => <ProfessionalCard professional={pro} />} />
                <ResultGroup title="Itinerarios" items={r.itineraries.slice(0, TURN_CAP)} render={(it) => <ItineraryCard itinerary={it} />} />
                <ResultGroup title="Lugares turísticos" items={r.places.slice(0, TURN_CAP)} render={(place) => <PlaceCard place={place} />} />
                <ResultGroup title="Farmacias" items={r.pharmacies.slice(0, TURN_CAP)} render={(f) => <HealthFacilityCard facility={f} />} />
                <ResultGroup title="Clínicas" items={r.clinics.slice(0, TURN_CAP)} render={(f) => <HealthFacilityCard facility={f} />} />
                <ResultGroup title="Hospitales" items={r.hospitals.slice(0, TURN_CAP)} render={(f) => <HealthFacilityCard facility={f} />} />
              </>
            )}
            <ResultGroup title="Productos en la Tienda" items={reply.products.slice(0, TURN_CAP)} render={(p) => <ProductCard product={p} />} />
            <ResultGroup title="Alquileres" items={reply.rentals.slice(0, TURN_CAP)} render={(l) => <RentalCard item={l} />} />
          </div>
        )}

        {reply.cierre && <p>{reply.cierre}</p>}
      </div>
    </div>
  );
}

interface SearchExperienceProps {
  variant: 'overlay' | 'page';
  initialQuery?: string;
  onClose?: () => void;
}

export function SearchExperience({ variant, initialQuery, onClose }: SearchExperienceProps) {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);
  const { recent, addSearch } = useRecentSearches();

  useAutoResizeTextarea(textareaRef, input);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [turns, isThinking]);

  // The conversation as the assistant needs it: the user's words and the
  // text of its own answers (for follow-ups like "¿y en Bata?").
  const history = (): AssistantTurn[] =>
    turns.flatMap((t): AssistantTurn[] =>
      t.role === 'user' ? [{ role: 'user', content: t.content }] : t.role === 'assistant' ? [{ role: 'assistant', content: t.reply.answer }] : []);

  async function ask(raw: string) {
    const q = raw.trim();
    if (!q || isThinking) return;
    addSearch(q);
    setInput('');
    const past = history();
    setTurns((prev) => [...prev, { role: 'user', content: q }]);
    setIsThinking(true);
    try {
      const reply = await askAssistant(q, past);
      setTurns((prev) => [...prev, reply.success ? { role: 'assistant', reply } : { role: 'error', content: reply.message }]);
    } catch {
      setTurns((prev) => [...prev, { role: 'error', content: 'No se pudo conectar. Compruebe su conexión e inténtelo de nuevo.' }]);
    } finally {
      setIsThinking(false);
    }
  }

  // Back to the empty start screen: clears the conversation and its results.
  function newSearch() {
    setTurns([]);
    setInput('');
    setIsThinking(false);
    textareaRef.current?.focus();
  }

  useEffect(() => {
    if (initialQuery && !hasSentInitial.current) {
      hasSentInitial.current = true;
      ask(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(input);
    }
  }

  const hasTurns = turns.length > 0;

  const composer = (
    <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="w-full">
      <div className="flex items-end gap-2 rounded-md border-2 border-outline-variant bg-background shadow-lg p-1 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
        <textarea
          ref={textareaRef}
          rows={1}
          autoFocus={variant === 'overlay'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={600}
          placeholder="Pregunte o busque lo que necesite…"
          disabled={isThinking}
          className="flex-1 resize-none bg-transparent border-0 outline-none text-base p-2 max-h-[200px] overflow-y-auto transition-[height] duration-150 placeholder:text-muted-foreground disabled:opacity-60"
        />
        {input && (
          <Button type="button" variant="ghost" size="icon" className="shrink-0 rounded-xl" onClick={() => { setInput(''); textareaRef.current?.focus(); }} aria-label="Borrar texto">
            <X className="w-4 h-4" />
          </Button>
        )}
        <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={isThinking || !input.trim()} aria-label="Enviar">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );

  return (
    <div className={cn('flex flex-col', variant === 'overlay' ? 'h-[100dvh]' : 'min-h-[70vh]')}>
      {variant === 'overlay' && (
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <SparklesGlow />
            Asistente Oltinde
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="gap-2 rounded-full">
              <X className="w-4 h-4" />
              Cerrar
            </Button>
          )}
        </div>
      )}

      {!hasTurns ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-12 text-center animate-in fade-in-0 overflow-y-auto">
          {variant === 'page' && (
            <div className="flex items-center gap-2 text-sm font-semibold text-black">
              <SparklesGlow small /> Asistente Oltinde
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">¿En qué le puedo ayudar?</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Busque empresas, trámites, farmacias, productos o alquileres, o pregunte cómo usar Oltinde. Escriba como hablaría.
            </p>
          </div>
          <div className="w-full max-w-2xl">{composer}</div>

          {recent.length > 0 && (
            <div className="space-y-2 w-full max-w-2xl">
              <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <History className="w-3.5 h-3.5" /> Búsquedas recientes
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {recent.map((q) => (
                  <button key={q} type="button" onClick={() => ask(q)} className="text-sm px-4 py-2 rounded-xl border bg-background hover:bg-muted transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2 w-full max-w-2xl">
            {recent.length > 0 && <p className="text-xs text-muted-foreground">Pruebe con</p>}
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_QUERIES.map(({ text, icon: Icon }) => (
                <button key={text} type="button" onClick={() => ask(text)} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border bg-background hover:bg-muted transition-colors">
                  <Icon className="w-4 h-4 text-black" />
                  {text}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1">
            <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4">
              {turns.map((t, i) =>
                t.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-lg">
                      <p className="text-sm whitespace-pre-wrap">{t.content}</p>
                    </div>
                  </div>
                ) : t.role === 'assistant' ? (
                  <AssistantTurnView key={i} reply={t.reply} />
                ) : (
                  <p key={i} className="text-sm text-destructive pl-11">{t.content}</p>
                ),
              )}
              {isThinking && <TypingIndicator />}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
          <div className="border-t p-4 shrink-0">
            <div className="max-w-4xl mx-auto space-y-2">
              <div className="flex justify-end">
                <Button type="button" variant="outline" size="sm" onClick={newSearch} className="gap-1.5 rounded-full">
                  <X className="w-3.5 h-3.5" /> Borrar búsqueda
                </Button>
              </div>
              {composer}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
