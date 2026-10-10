import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import {
  Briefcase, Building2, CalendarDays, FileText, HelpCircle, History, Map as MapIcon, Route as RouteIcon, Sparkles, TicketPercent, User, UtensilsCrossed, X,
} from 'lucide-react-native';
import { AppHeader } from '../../src/components/ui/AppHeader';
import { useRecentSearches } from '../../src/hooks/use-recent-searches';
import { askAssistant, type AssistantAnswer, type AssistantTurn } from '../../src/lib/assistant';
import { AssistantAnswerView } from '../../src/components/assistant/AssistantAnswerView';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';
import { tick } from '../../src/components/ui/motion';

// The Asistente Oltinde — the app's single place to search or ask (it replaced
// Búsqueda Inteligente and the business advisor). Same server function as the
// website: answers are stored texts and real directory results, shown as the
// app's usual cards, with the AI's short sentences around them when it's on.

type Turn = { role: 'user'; content: string } | { role: 'assistant'; reply: AssistantAnswer } | { role: 'error'; content: string };

const EXAMPLE_QUERIES: { text: string; icon: typeof Building2 }[] = [
  { text: 'empresas de construcción en Bata', icon: Building2 },
  { text: '¿qué necesito para el pasaporte?', icon: FileText },
  { text: 'ofertas de restaurantes', icon: TicketPercent },
  { text: 'empleos en Malabo', icon: Briefcase },
  { text: 'eventos en Bata', icon: CalendarDays },
  { text: 'comida en Malabo', icon: UtensilsCrossed },
  { text: 'farmacias de guardia en Malabo', icon: MapIcon },
  { text: '¿cómo pago en la Tienda?', icon: HelpCircle },
  { text: 'itinerarios de aventura', icon: RouteIcon },
];

export default function SearchScreen() {
  const [input, setInput] = useState('');
  const [turns, setTurns] = useState<Turn[]>([]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { recent, addSearch, clearSearches } = useRecentSearches();

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [turns, busy]);

  const history = (): AssistantTurn[] =>
    turns.flatMap((t): AssistantTurn[] =>
      t.role === 'user' ? [{ role: 'user', content: t.content }] : t.role === 'assistant' ? [{ role: 'assistant', content: t.reply.answer }] : []);

  async function ask(raw: string) {
    const q = raw.trim();
    if (!q || busy) return;
    tick('selection');
    addSearch(q);
    setInput('');
    const past = history();
    setTurns((prev) => [...prev, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const reply = await askAssistant(q, past);
      setTurns((prev) => [...prev, reply.success ? { role: 'assistant', reply: reply as AssistantAnswer } : { role: 'error', content: reply.message }]);
    } catch (e) {
      setTurns((prev) => [...prev, { role: 'error', content: e instanceof Error ? e.message : 'No se pudo conectar.' }]);
    } finally {
      setBusy(false);
    }
  }

  function newSearch() {
    setTurns([]);
    setInput('');
    setBusy(false);
  }

  // A search started elsewhere (home screen box or popular searches):
  // /search?q=... runs it once.
  const { q, t } = useLocalSearchParams<{ q?: string; t?: string }>();
  const lastParam = useRef<string | null>(null);
  useEffect(() => {
    const key = `${q ?? ''}|${t ?? ''}`;
    if (!q || lastParam.current === key) return;
    lastParam.current = key;
    ask(q);
  }, [q, t]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AppHeader hide={['search']} />
      <View className="flex-row items-center gap-2 px-4 pb-2 pt-4">
        <Sparkles size={20} color="#1A1C1C" />
        <Text className="flex-1 text-xl font-semibold text-foreground">Asistente Oltinde</Text>
        {turns.length > 0 ? (
          <Pressable onPress={newSearch} hitSlop={8} className="flex-row items-center gap-1 rounded-full border border-border px-3 py-1.5 active:bg-muted">
            <X size={14} color="#1A1C1C" />
            <Text className="text-xs font-semibold text-foreground">Borrar búsqueda</Text>
          </Pressable>
        ) : null}
      </View>

      <KeyboardAware className="flex-1">
        <ScrollView ref={scrollRef} contentContainerClassName="gap-4 p-4" keyboardShouldPersistTaps="handled">
          {turns.length === 0 ? (
            <View className="gap-6">
              <View className="items-center gap-2 px-4 py-6">
                <Sparkles size={28} color="#8A8A8A" />
                <Text className="text-center text-xl font-semibold text-foreground">¿En qué le puedo ayudar?</Text>
                <Text className="text-center text-sm text-muted-foreground">
                  Busque empresas, trámites, farmacias, productos o alquileres, o pregunte cómo usar Oltinde. Escriba como hablaría.
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
                    {recent.map((r) => (
                      <Pressable key={r} onPress={() => ask(r)} className="rounded-lg border border-border bg-card px-3.5 py-2 active:bg-muted">
                        <Text className="text-sm text-foreground">{r}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <View className="gap-2">
                <Text className="text-xs text-muted-foreground">Pruebe con</Text>
                <View className="flex-row flex-wrap gap-2">
                  {EXAMPLE_QUERIES.map(({ text, icon: Icon }) => (
                    <Pressable key={text} onPress={() => ask(text)} className="flex-row items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 active:bg-muted">
                      <Icon size={14} color="#1A1C1C" />
                      <Text className="text-sm text-foreground">{text}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>
          ) : null}

          {turns.map((turn, i) =>
            turn.role === 'user' ? (
              <View key={i} className="flex-row items-end justify-end gap-2">
                <View className="max-w-[85%] rounded-lg bg-primary p-3">
                  <Text className="text-sm text-primary-foreground">{turn.content}</Text>
                </View>
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <User size={14} color="#000" />
                </View>
              </View>
            ) : turn.role === 'assistant' ? (
              <AssistantAnswerView key={i} reply={turn.reply} />
            ) : (
              <Text key={i} className="pl-9 text-sm text-destructive">{turn.content}</Text>
            ),
          )}

          {busy ? (
            <View className="flex-row items-center gap-2 pl-1">
              <ActivityIndicator color="#1A1C1C" />
              <Text className="text-sm text-muted-foreground">Buscando…</Text>
            </View>
          ) : null}
        </ScrollView>

        <View className="flex-row items-center gap-2 border-t border-border p-3">
          <View className="flex-1 justify-center">
            <TextField
              placeholder="Pregunte o busque lo que necesite…"
              value={input}
              onChangeText={setInput}
              editable={!busy}
              onSubmitEditing={() => ask(input)}
              returnKeyType="search"
              maxLength={600}
              className="pr-10"
            />
            {input ? (
              <Pressable onPress={() => setInput('')} hitSlop={8} className="absolute right-3" accessibilityLabel="Borrar texto">
                <X size={18} color="#8A8A8A" />
              </Pressable>
            ) : null}
          </View>
          <Button onPress={() => ask(input)} loading={busy} disabled={!input.trim()} className="w-24">
            Buscar
          </Button>
        </View>
      </KeyboardAware>
    </SafeAreaView>
  );
}
