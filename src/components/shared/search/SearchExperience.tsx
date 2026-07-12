
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bot, Send, Sparkles, ArrowRight, X, Building, FileText, TicketPercent, History, AlertCircle, RotateCcw, Briefcase, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSearchData } from '@/hooks/use-search-data';
import { useCityPreference } from '@/hooks/use-city-preference';
import { useRecentSearches } from '@/hooks/use-recent-searches';
import {
  parseQuery, executeSearch, summarize, deriveCategories, countResults, mergeFollowUpIntent, intentToQueryString,
  type RankedResults, type ParsedIntent,
} from '@/lib/search-engine';
import { SearchResultCard } from '@/components/shared/SearchResultCard';
import { OfferCard } from '@/components/shared/OfferCard';
import { PostCard } from '@/components/shared/PostCard';
import { JobCard } from '@/components/shared/JobCard';
import { EventCard } from '@/components/shared/EventCard';
import type { Company, Institution, Procedure, Service } from '@/lib/types';

type SearchableItem = (Company | Institution | Procedure | Service) & { entityType: 'company' | 'institution' | 'procedure' | 'service' };

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: ParsedIntent;
  results?: RankedResults;
  totalCount?: number;
}

const EXAMPLE_QUERIES: { text: string; icon: React.ElementType }[] = [
  { text: 'empresas de construcción en Bata', icon: Building },
  { text: 'trámites para abrir un negocio', icon: FileText },
  { text: 'ofertas de restaurantes', icon: TicketPercent },
  { text: 'empleos en Malabo', icon: Briefcase },
  { text: 'eventos en Bata', icon: CalendarDays },
];

const TURN_CAP = 4;
const THINKING_DELAY_MS = 550;

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
      <Sparkles className={cn(size, 'absolute text-primary/40 blur-sm animate-pulse')} />
      <Sparkles className={cn(size, 'relative text-primary')} />
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
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => <div key={item.id}>{render(item)}</div>)}
      </div>
    </div>
  );
}

interface MessageTurnProps {
  message: ChatMessage;
  onNavigate?: () => void;
  onRefine: (intent: ParsedIntent, field: 'city' | 'category') => void;
}

function MessageTurn({ message, onNavigate, onRefine }: MessageTurnProps) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground rounded-2xl px-4 py-2.5 max-w-lg">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const results = message.results;
  const totalCount = message.totalCount ?? 0;
  const intent = message.intent;

  const shownCount = results
    ? Math.min(results.companies.length, TURN_CAP)
      + Math.min(results.institutions.length, TURN_CAP)
      + Math.min(results.procedures.length, TURN_CAP)
      + Math.min(results.services.length, TURN_CAP)
      + Math.min(results.offers.length, TURN_CAP)
      + Math.min(results.posts.length, TURN_CAP)
      + Math.min(results.jobs.length, TURN_CAP)
      + Math.min(results.events.length, TURN_CAP)
    : 0;

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-8 w-8 shrink-0 mt-0.5">
        <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-3 min-w-0">
        <p className="text-sm">{message.content}</p>

        {intent && (intent.city || intent.category) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Entendí que busca:</span>
            {intent.category && (
              <Badge variant="secondary" className="gap-1.5 pl-3">
                Categoría: {intent.category}
                <button type="button" onClick={() => onRefine(intent, 'category')} className="hover:text-destructive" aria-label="Quitar filtro de categoría">
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            )}
            {intent.city && (
              <Badge variant="secondary" className="gap-1.5 pl-3">
                Ciudad: {intent.city}
                <button type="button" onClick={() => onRefine(intent, 'city')} className="hover:text-destructive" aria-label="Quitar filtro de ciudad">
                  <X className="w-3.5 h-3.5" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {results && totalCount > 0 && (
          <div className="space-y-5">
            <ResultGroup title="Empresas" items={results.companies.slice(0, TURN_CAP).map(tag('company'))} render={(item) => <SearchResultCard item={item} />} />
            <ResultGroup title="Instituciones" items={results.institutions.slice(0, TURN_CAP).map(tag('institution'))} render={(item) => <SearchResultCard item={item} />} />
            <ResultGroup title="Trámites" items={results.procedures.slice(0, TURN_CAP).map(tag('procedure'))} render={(item) => <SearchResultCard item={item} />} />
            <ResultGroup title="Servicios" items={results.services.slice(0, TURN_CAP).map(tag('service'))} render={(item) => <SearchResultCard item={item} />} />
            <ResultGroup title="Ofertas" items={results.offers.slice(0, TURN_CAP)} render={(offer) => <OfferCard offer={offer} />} />
            <ResultGroup title="Publicaciones" items={results.posts.slice(0, TURN_CAP)} render={(post) => <PostCard post={post} />} />
            <ResultGroup title="Empleos" items={results.jobs.slice(0, TURN_CAP)} render={(job) => <JobCard job={job} />} />
            <ResultGroup title="Eventos" items={results.events.slice(0, TURN_CAP)} render={(event) => <EventCard event={event} />} />

            {totalCount > shownCount && intent && (
              <Link
                href={`/search?q=${encodeURIComponent(intentToQueryString(intent))}`}
                onClick={onNavigate}
                className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                Ver todos los resultados ({totalCount}) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        )}

        {results && totalCount === 0 && (
          <p className="text-sm text-muted-foreground">Intente con otros términos, o sea más específico sobre la ciudad o categoría.</p>
        )}
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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const hasSentInitial = useRef(false);

  const { isLoading, error, retry, ...data } = useSearchData();
  const { city: preferredCity } = useCityPreference();
  const { recent, addSearch } = useRecentSearches();

  useAutoResizeTextarea(textareaRef, input);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isThinking]);

  function runWithIntent(intent: ParsedIntent, userLabel: string) {
    if (isThinking) return;
    setMessages((prev) => [...prev, { role: 'user', content: userLabel }]);
    setIsThinking(true);
    window.setTimeout(() => {
      const results = executeSearch(intent, data);
      const summaryText = summarize(intent, results);
      const totalCount = countResults(results);
      setMessages((prev) => [...prev, { role: 'assistant', content: summaryText, intent, results, totalCount }]);
      setIsThinking(false);
    }, THINKING_DELAY_MS);
  }

  function runQuery(raw: string) {
    if (!raw.trim() || isLoading || isThinking) return;
    const previousIntent = [...messages].reverse().find((m) => m.role === 'assistant')?.intent;
    const categories = deriveCategories(data);
    const parsed = parseQuery(raw, { cities: data.cities, categories, services: data.services });
    const merged = mergeFollowUpIntent(parsed, previousIntent);
    const city = merged.city ?? (preferredCity !== 'all' ? preferredCity : undefined);
    const intent: ParsedIntent = { ...merged, city };
    addSearch(raw);
    runWithIntent(intent, raw);
    setInput('');
  }

  function handleRefine(baseIntent: ParsedIntent, field: 'city' | 'category') {
    const removedValue = baseIntent[field];
    const next: ParsedIntent = { ...baseIntent, [field]: undefined };
    const label = field === 'city' ? `Quitar el filtro de ciudad: ${removedValue}` : `Quitar el filtro de categoría: ${removedValue}`;
    runWithIntent(next, label);
  }

  useEffect(() => {
    if (initialQuery && !hasSentInitial.current && !isLoading) {
      hasSentInitial.current = true;
      runQuery(initialQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, isLoading]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    runQuery(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runQuery(input);
    }
  }

  const hasMessages = messages.length > 0;
  const isBusy = isLoading || isThinking;

  const composer = (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex items-end gap-2 rounded-2xl border-2 border-primary bg-background shadow-lg p-2 focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
        <textarea
          ref={textareaRef}
          rows={1}
          autoFocus={variant === 'overlay'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isLoading ? 'Cargando datos...' : 'Escriba en lenguaje natural...'}
          disabled={isBusy}
          className="flex-1 resize-none bg-transparent border-0 outline-none text-base p-2 max-h-[200px] overflow-y-auto transition-[height] duration-150 placeholder:text-muted-foreground disabled:opacity-60"
        />
        <Button type="submit" size="icon" className="shrink-0 rounded-xl" disabled={isBusy || !input.trim()}>
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-4 text-center px-4', variant === 'overlay' ? 'h-full' : 'min-h-[70vh]')}>
        <AlertCircle className="w-10 h-10 text-destructive" />
        <p className="text-muted-foreground max-w-sm">{error}</p>
        <Button onClick={retry} variant="outline" className="gap-2">
          <RotateCcw className="w-4 h-4" /> Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', variant === 'overlay' ? 'h-[100dvh]' : 'min-h-[70vh]')}>
      {variant === 'overlay' && (
        <div className="flex items-center justify-between p-4 border-b shrink-0">
          <div className="flex items-center gap-2 font-semibold">
            <SparklesGlow />
            Búsqueda Inteligente
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose} aria-label="Cerrar">
              <X className="w-5 h-5" />
            </Button>
          )}
        </div>
      )}

      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-4 py-12 text-center animate-in fade-in-0 overflow-y-auto">
          {variant === 'page' && (
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <SparklesGlow small /> Búsqueda Inteligente
            </div>
          )}
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold font-headline">¿Qué está buscando hoy?</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Escriba en lenguaje natural — entiendo ciudades, categorías y tipos de resultado.
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
                  <button
                    key={q}
                    type="button"
                    onClick={() => runQuery(q)}
                    className="text-sm px-4 py-2 rounded-xl border bg-background hover:bg-muted transition-colors"
                  >
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
                <button
                  key={text}
                  type="button"
                  onClick={() => runQuery(text)}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border bg-background hover:bg-muted transition-colors"
                >
                  <Icon className="w-4 h-4 text-primary" />
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
              {messages.map((m, i) => (
                <MessageTurn key={i} message={m} onNavigate={onClose} onRefine={handleRefine} />
              ))}
              {isThinking && <TypingIndicator />}
              <div ref={scrollAnchorRef} />
            </div>
          </ScrollArea>
          <div className="border-t p-4 shrink-0">
            <div className="max-w-4xl mx-auto">{composer}</div>
          </div>
        </>
      )}
    </div>
  );
}
