import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Bot, RotateCcw, Send } from 'lucide-react-native';
import { askAssistant, getAssistantPublicState, type AssistantTurn } from '../src/lib/assistant';
import { appRouteForLink } from '../src/lib/notification-links';
import { EmptyState } from '../src/components/ui/EmptyState';
import { KeyboardAware } from '../src/components/ui/KeyboardAware';
import { tick } from '../src/components/ui/motion';

const SUGGESTIONS = ['¿Cómo compro en la Tienda?', '¿Qué farmacias están de guardia?', '¿Cómo publico mi empresa?', '¿Qué necesito para el pasaporte?'];

// Links in answers are website paths; open the matching app screen.
function openLink(href: string) {
  if (href.startsWith('/')) router.push(appRouteForLink(href) as never);
}

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
      out.push(
        <Text key={`${key}-${i++}`} className="font-semibold text-secondary underline" onPress={() => openLink(href)}>
          {m[1]}
        </Text>,
      );
    } else {
      out.push(<Text key={`${key}-${i++}`} className="font-semibold">{m[3]}</Text>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

// Same small Markdown as the web widget: links, bold, lists, paragraphs.
function Answer({ text }: { text: string }) {
  return (
    <View className="gap-2">
      {text.split(/\n{2,}/).map((block, b) => (
        <Text key={b} className="text-[15px] leading-6 text-foreground">
          {block.split('\n').filter((l) => l.trim()).map((l, j) => {
            const bullet = l.match(/^\s*([-*•]|\d+[.)])\s+/);
            const body = l.replace(/^\s*([-*•]|\d+[.)])\s+/, '').replace(/^#+\s*/, '');
            return (
              <Fragment key={j}>
                {j > 0 ? '\n' : ''}
                {bullet ? (/\d/.test(bullet[1]) ? `${bullet[1]} ` : '• ') : ''}
                {inline(body, `${b}-${j}`)}
              </Fragment>
            );
          })}
        </Text>
      ))}
    </View>
  );
}

export default function AssistantScreen() {
  const state = useQuery({ queryKey: ['assistant', 'state'], queryFn: getAssistantPublicState });
  const [turns, setTurns] = useState<AssistantTurn[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
  }, [turns, busy]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    tick('selection');
    setError(null);
    setInput('');
    const history = turns;
    setTurns([...history, { role: 'user', content: q }]);
    setBusy(true);
    try {
      const reply = await askAssistant(q, history);
      if (reply.success) setTurns((prev) => [...prev, { role: 'assistant', content: reply.answer }]);
      else setError(reply.message);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar con el asistente.');
    } finally {
      setBusy(false);
    }
  };

  const header = (
    <Stack.Screen
      options={{
        title: 'Asistente Oltinde',
        headerShown: true,
        headerRight: () =>
          turns.length ? (
            <Pressable onPress={() => { setTurns([]); setError(null); }} hitSlop={10} accessibilityLabel="Nueva conversación">
              <RotateCcw size={20} color="#1A1C1C" />
            </Pressable>
          ) : null,
      }}
    />
  );

  if (state.isLoading) return <>{header}<ActivityIndicator className="mt-16" color="#FFCD00" /></>;
  if (!state.data?.enabled) return <>{header}<EmptyState icon={Bot} title="El asistente no está disponible ahora" description="Use la Búsqueda Inteligente o contacte con soporte." /></>;

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      {header}
      <KeyboardAware>
        <ScrollView ref={scrollRef} contentContainerClassName="gap-3 p-4" keyboardShouldPersistTaps="handled">
          {turns.length === 0 ? (
            <View className="gap-3">
              <View className="flex-row items-center gap-2">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary"><Bot size={18} color="#000" /></View>
                <Text className="flex-1 text-[15px] text-foreground">Hola. Pregúnteme cómo usar Oltinde o qué busca: empresas, trámites, farmacias, la Tienda, alquileres…</Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <Pressable key={s} onPress={() => ask(s)} className="rounded-full border border-border bg-card px-3.5 py-2 active:bg-muted">
                    <Text className="text-sm text-foreground">{s}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : null}
          {turns.map((t, i) => (
            <View key={i} className={t.role === 'user' ? 'items-end' : 'items-start'}>
              <View className={`max-w-[88%] rounded-lg px-3 py-2.5 ${t.role === 'user' ? 'bg-primary' : 'bg-muted'}`}>
                {t.role === 'user' ? <Text className="text-[15px] text-black">{t.content}</Text> : <Answer text={t.content} />}
              </View>
            </View>
          ))}
          {busy ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator color="#1A1C1C" />
              <Text className="text-sm text-muted-foreground">Pensando…</Text>
            </View>
          ) : null}
          {error ? <Text className="text-sm text-destructive">{error}</Text> : null}
        </ScrollView>
        <View className="flex-row items-end gap-2 border-t border-border bg-background p-3">
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Escriba su pregunta…"
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={600}
            className="max-h-28 min-h-[44px] flex-1 rounded-lg border border-input bg-card px-3 py-2.5 text-base text-foreground"
          />
          <Pressable
            onPress={() => ask(input)}
            disabled={busy || !input.trim()}
            className={`h-11 w-11 items-center justify-center rounded-lg bg-primary ${busy || !input.trim() ? 'opacity-40' : ''}`}
            accessibilityLabel="Enviar"
          >
            <Send size={18} color="#000" />
          </Pressable>
        </View>
        <Text className="px-4 pb-2 text-center text-[11px] text-muted-foreground">El asistente puede equivocarse. Para casos concretos, contacte con soporte.</Text>
      </KeyboardAware>
    </SafeAreaView>
  );
}
