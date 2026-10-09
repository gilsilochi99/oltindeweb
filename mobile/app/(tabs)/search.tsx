import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { router, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  Bot,
  Briefcase,
  Building2,
  CalendarDays,
  FileText,
  History,
  Map as MapIcon,
  Route as RouteIcon,
  Sparkles,
  TicketPercent,
  User,
  UtensilsCrossed,
  X,
} from 'lucide-react-native';
import { useSearchData } from '../../src/hooks/use-queries';
import { useRecentSearches } from '../../src/hooks/use-recent-searches';
import {
  parseQuery,
  executeSearch,
  summarize,
  deriveCategories,
  countResults,
  mergeFollowUpIntent,
  type RankedResults,
  type ParsedIntent,
} from '../../src/lib/search-engine';
import { ListCard } from '../../src/components/ui/ListCard';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

// Mobile port of the web app's "Búsqueda Inteligente" (SearchExperience +
// search-engine.ts): free-text queries are parsed into a structured intent
// (entity types, city, category, keywords) and ranked across every entity
// type in the app, presented as a chat rather than a filtered list — same
// engine, same conversational UX, native chat-bubble UI instead of web's.

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: ParsedIntent;
  results?: RankedResults;
  totalCount?: number;
}

interface GroupItem {
  id: string;
  title: string;
  subtitle?: string;
  image?: string;
  onPress?: () => void;
}

const EXAMPLE_QUERIES: { text: string; icon: typeof Building2 }[] = [
  { text: 'empresas de construcción en Bata', icon: Building2 },
  { text: 'trámites para abrir un negocio', icon: FileText },
  { text: 'ofertas de restaurantes', icon: TicketPercent },
  { text: 'empleos en Malabo', icon: Briefcase },
  { text: 'eventos en Bata', icon: CalendarDays },
  { text: 'comida en Malabo', icon: UtensilsCrossed },
  { text: 'farmacias de guardia en Malabo', icon: MapIcon },
  { text: 'itinerarios de aventura', icon: RouteIcon },
];

const RESULT_CAP = 5;

function buildGroups(results: RankedResults): { key: string; title: string; items: GroupItem[] }[] {
  return [
    { key: 'companies', title: 'Empresas', items: results.companies.map((c) => ({ id: c.id, title: c.name, subtitle: c.category, image: c.logo, onPress: () => router.push(`/companies/${c.id}` as any) })) },
    { key: 'institutions', title: 'Instituciones', items: results.institutions.map((i) => ({ id: i.id, title: i.name, subtitle: i.category, image: i.logo, onPress: () => router.push(`/institutions/${i.id}` as any) })) },
    { key: 'procedures', title: 'Trámites', items: results.procedures.map((p) => ({ id: p.id, title: p.name, subtitle: p.category, onPress: () => router.push(`/procedures/${p.id}` as any) })) },
    { key: 'services', title: 'Servicios', items: results.services.map((s) => ({ id: s.id, title: s.name, subtitle: s.category })) },
    { key: 'offers', title: 'Ofertas', items: results.offers.map((o) => ({ id: o.id, title: o.title, subtitle: o.companyName, image: o.image || o.companyLogo, onPress: () => router.push(`/offers/${o.id}` as any) })) },
    { key: 'posts', title: 'Publicaciones', items: results.posts.map((p) => ({ id: p.id, title: p.title, subtitle: p.authorName, image: p.featuredImage, onPress: () => router.push(`/contribuciones/${p.id}` as any) })) },
    { key: 'jobs', title: 'Empleos', items: results.jobs.map((j) => ({ id: j.id, title: j.title, subtitle: j.companyName, image: j.companyLogo, onPress: () => router.push(`/jobs/${j.id}` as any) })) },
    { key: 'events', title: 'Eventos', items: results.events.map((e) => ({ id: e.id, title: e.title, subtitle: e.city, image: e.organizerLogo, onPress: () => router.push(`/events/${e.id}` as any) })) },
    { key: 'food', title: 'Comida', items: results.foodItems.map((m) => ({ id: m.id, title: m.name, subtitle: m.companyName, image: m.image || m.companyLogo, onPress: () => router.push(`/companies/${m.companyId}` as any) })) },
    { key: 'professionals', title: 'Profesionales', items: results.professionals.map((p) => ({ id: p.id, title: p.displayName, subtitle: p.title, image: p.photo, onPress: () => router.push(`/professionals/${p.id}` as any) })) },
    { key: 'itineraries', title: 'Itinerarios', items: results.itineraries.map((it) => ({ id: it.id, title: it.title, subtitle: it.city, image: it.coverImage, onPress: () => router.push(`/itineraries/${it.id}` as any) })) },
    { key: 'places', title: 'Lugares Turísticos', items: results.places.map((p) => ({ id: p.id, title: p.name, subtitle: p.category, image: p.image, onPress: () => router.push(`/places/${p.id}` as any) })) },
    { key: 'pharmacies', title: 'Farmacias', items: results.pharmacies.map((f) => ({ id: f.id, title: f.name, subtitle: f.description, image: f.image, onPress: () => router.push(`/health/${f.id}` as any) })) },
    { key: 'clinics', title: 'Clínicas', items: results.clinics.map((f) => ({ id: f.id, title: f.name, subtitle: f.description, image: f.image, onPress: () => router.push(`/health/${f.id}` as any) })) },
    { key: 'hospitals', title: 'Hospitales', items: results.hospitals.map((f) => ({ id: f.id, title: f.name, subtitle: f.description, image: f.image, onPress: () => router.push(`/health/${f.id}` as any) })) },
  ];
}

function ResultGroup({ title, items }: { title: string; items: GroupItem[] }) {
  if (items.length === 0) return null;
  const shown = items.slice(0, RESULT_CAP);
  const extra = items.length - shown.length;
  return (
    <View className="gap-2">
      <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</Text>
      <View className="gap-2">
        {shown.map((item) =>
          item.onPress ? (
            <ListCard key={item.id} image={item.image} title={item.title} subtitle={item.subtitle} onPress={item.onPress} />
          ) : (
            <View key={item.id} className="rounded-lg border border-border bg-card p-3" style={{ elevation: 1 }}>
              <Text className="text-sm font-bold text-foreground">{item.title}</Text>
              {item.subtitle ? <Text className="text-xs text-muted-foreground">{item.subtitle}</Text> : null}
            </View>
          ),
        )}
      </View>
      {extra > 0 ? <Text className="text-xs text-muted-foreground">+{extra} más — refine su búsqueda para verlos</Text> : null}
    </View>
  );
}

interface MessageTurnProps {
  message: ChatMessage;
  onRefine: (intent: ParsedIntent, field: 'city' | 'category') => void;
}

function MessageTurn({ message, onRefine }: MessageTurnProps) {
  if (message.role === 'user') {
    return (
      <View className="flex-row items-end justify-end gap-2">
        <View className="max-w-[85%] rounded-lg bg-primary p-3">
          <Text className="text-sm text-primary-foreground">{message.content}</Text>
        </View>
        <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
          <User size={14} color="#000" />
        </View>
      </View>
    );
  }

  const groups = message.results ? buildGroups(message.results) : [];

  return (
    <View className="gap-2">
      <View className="flex-row items-start gap-2">
        <View className="mt-0.5 h-7 w-7 items-center justify-center rounded-full bg-muted">
          <Bot size={14} color="#1A1C1C" />
        </View>
        <View className="max-w-[85%] rounded-lg bg-muted p-3">
          <Text className="text-sm text-foreground">{message.content}</Text>
        </View>
      </View>

      {message.intent && (message.intent.city || message.intent.category) ? (
        <View className="flex-row flex-wrap items-center gap-2 pl-9">
          {message.intent.category ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Text className="text-xs text-foreground">Categoría: {message.intent.category}</Text>
              <Pressable onPress={() => onRefine(message.intent!, 'category')} hitSlop={6}>
                <X size={12} color="#8A8A8A" />
              </Pressable>
            </View>
          ) : null}
          {message.intent.city ? (
            <View className="flex-row items-center gap-1.5 rounded-full bg-muted px-3 py-1.5">
              <Text className="text-xs text-foreground">Ciudad: {message.intent.city}</Text>
              <Pressable onPress={() => onRefine(message.intent!, 'city')} hitSlop={6}>
                <X size={12} color="#8A8A8A" />
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {message.totalCount ? (
        <View className="gap-4 pl-9">
          {groups.map((group) => (
            <ResultGroup key={group.key} title={group.title} items={group.items} />
          ))}
        </View>
      ) : message.results ? (
        <Text className="pl-9 text-sm text-muted-foreground">
          Intente con otros términos, o sea más específico sobre la ciudad o categoría.
        </Text>
      ) : null}
    </View>
  );
}

export default function SearchScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const { data: searchData, isLoading, error, refetch } = useSearchData();
  const { recent, addSearch, clearSearches } = useRecentSearches();

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, isThinking]);

  function runWithIntent(intent: ParsedIntent, userLabel: string) {
    if (isThinking || !searchData) return;
    setMessages((prev) => [...prev, { role: 'user', content: userLabel }]);
    setIsThinking(true);
    setTimeout(() => {
      const results = executeSearch(intent, searchData);
      const summaryText = summarize(intent, results);
      const totalCount = countResults(results);
      setMessages((prev) => [...prev, { role: 'assistant', content: summaryText, intent, results, totalCount }]);
      setIsThinking(false);
    }, 550);
  }

  function runQuery(raw: string) {
    if (!raw.trim() || isLoading || isThinking || !searchData) return;
    const previousIntent = [...messages].reverse().find((m) => m.role === 'assistant')?.intent;
    const categories = deriveCategories(searchData);
    const parsed = parseQuery(raw, { cities: searchData.cities, categories, services: searchData.services });
    const merged = mergeFollowUpIntent(parsed, previousIntent);
    addSearch(raw);
    runWithIntent(merged, raw);
    setInput('');
  }

  // A search started elsewhere (home screen box or popular searches):
  // /search?q=... runs it once the data is ready.
  const { q, t } = useLocalSearchParams<{ q?: string; t?: string }>();
  const lastParam = useRef<string | null>(null);
  useEffect(() => {
    const key = `${q ?? ''}|${t ?? ''}`;
    if (!q || !searchData || lastParam.current === key) return;
    lastParam.current = key;
    runQuery(q);
  }, [q, t, searchData]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleRefine(baseIntent: ParsedIntent, field: 'city' | 'category') {
    const removedValue = baseIntent[field];
    const next: ParsedIntent = { ...baseIntent, [field]: undefined };
    const label = field === 'city' ? `Quitar el filtro de ciudad: ${removedValue}` : `Quitar el filtro de categoría: ${removedValue}`;
    runWithIntent(next, label);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader hide={['search']} />
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-4">
        <Sparkles size={20} color="#1A1C1C" />
        <Text className="text-xl font-extrabold uppercase tracking-wide text-foreground">Búsqueda Inteligente</Text>
      </View>

      <KeyboardAware className="flex-1">
        {error ? (
          <View className="flex-1 items-center justify-center gap-3 px-8">
            <AlertCircle size={32} color="#DC2626" />
            <Text className="text-center text-sm text-muted-foreground">
              No se pudieron cargar los datos. Compruebe su conexión e intente de nuevo.
            </Text>
            <Button variant="outline" onPress={() => refetch()}>
              Reintentar
            </Button>
          </View>
        ) : (
          <>
            <ScrollView ref={scrollRef} contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
              {messages.length === 0 ? (
                <View className="gap-6">
                  <View className="items-center gap-2 px-4 py-6">
                    <Sparkles size={28} color="#8A8A8A" />
                    <Text className="text-center text-xl font-bold text-foreground">¿Qué buscas hoy en Oltinde?</Text>
                    <Text className="text-center text-sm text-muted-foreground">
                      Escriba en lenguaje natural — entiendo ciudades, categorías y tipos de resultado.
                    </Text>
                  </View>

                  {recent.length > 0 ? (
                    <View className="gap-2">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5">
                          <History size={13} color="#8A8A8A" />
                          <Text className="text-xs text-muted-foreground">Búsquedas recientes</Text>
                        </View>
                        <Pressable onPress={clearSearches} hitSlop={8}>
                          <Text className="text-xs font-medium text-secondary">Borrar</Text>
                        </Pressable>
                      </View>
                      <View className="flex-row flex-wrap gap-2">
                        {recent.map((q) => (
                          <Pressable
                            key={q}
                            onPress={() => runQuery(q)}
                            className="rounded-lg border border-border bg-card px-3.5 py-2"
                          >
                            <Text className="text-sm text-foreground">{q}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </View>
                  ) : null}

                  <View className="gap-2">
                    <Text className="text-xs text-muted-foreground">Pruebe con</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {EXAMPLE_QUERIES.map(({ text, icon: Icon }) => (
                        <Pressable
                          key={text}
                          onPress={() => runQuery(text)}
                          className="flex-row items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2"
                        >
                          <Icon size={14} color="#1A1C1C" />
                          <Text className="text-sm text-foreground">{text}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                </View>
              ) : null}

              {messages.map((message, i) => (
                <MessageTurn key={i} message={message} onRefine={handleRefine} />
              ))}

              {isThinking ? (
                <View className="flex-row items-center gap-2">
                  <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                    <Bot size={14} color="#1A1C1C" />
                  </View>
                  <ActivityIndicator />
                </View>
              ) : null}
            </ScrollView>

            <View className="flex-row items-center gap-2 border-t border-border p-3">
              <View className="flex-1">
                <TextField
                  placeholder={isLoading ? 'Cargando datos…' : 'Escriba en lenguaje natural…'}
                  value={input}
                  onChangeText={setInput}
                  editable={!isLoading && !isThinking}
                  onSubmitEditing={() => runQuery(input)}
                  returnKeyType="search"
                  autoCapitalize="none"
                />
              </View>
              <Button onPress={() => runQuery(input)} loading={isThinking} disabled={isLoading || !input.trim()} className="w-24">
                Buscar
              </Button>
            </View>
          </>
        )}
      </KeyboardAware>
    </SafeAreaView>
  );
}
