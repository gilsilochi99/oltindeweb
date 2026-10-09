import { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Bot, ShieldOff, Sparkles, User, Zap } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useSiteSettings } from '../../src/hooks/use-queries';
import { WEB_APP_URL } from '../../src/lib/config';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AdvisorScreen() {
  const { user, isPremium } = useAuth();
  const { data: settings, isLoading: settingsLoading } = useSiteSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (settingsLoading) return <LoadingState variant="list" />;

  if (!settings?.isBusinessAdvisorEnabled) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Asesor IA' }} />
        <EmptyState
          title="Función no disponible"
          description="El Asesor de Negocios IA no está activado en este momento."
          icon={ShieldOff}
        />
      </SafeAreaView>
    );
  }

  if (!isPremium) {
    return (
      <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
        <Stack.Screen options={{ title: 'Asesor IA' }} />
        <View className="flex-1 items-center justify-center gap-4 px-8">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Zap size={28} color="#000" />
          </View>
          <Text className="text-center text-xl font-semibold text-foreground">
            Desbloquea el Asesor de Negocios IA
          </Text>
          <Text className="text-center text-sm text-muted-foreground">
            Esta es una función premium. Actualiza tu cuenta para obtener respuestas expertas sobre negocios en
            Guinea Ecuatorial.
          </Text>
          <Button variant="outline" onPress={() => router.back()}>
            Volver
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  const submit = async () => {
    const question = input.trim();
    if (!question || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`${WEB_APP_URL}/api/mobile/advisor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const json = await res.json();
      if (!res.ok || !json.response) throw new Error(json.error || 'No se pudo obtener respuesta.');
      setMessages((prev) => [...prev, { role: 'assistant', content: json.response }]);
    } catch (e: any) {
      setError(e.message || 'Ocurrió un error al contactar al asistente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Asesor IA' }} />
      <KeyboardAware className="flex-1">
        <ScrollView contentContainerClassName="gap-3 p-4" keyboardShouldPersistTaps="handled">
          {messages.length === 0 ? (
            <View className="items-center gap-2 py-12">
              <Sparkles size={28} color="#8A8A8A" />
              <Text className="text-center text-sm text-muted-foreground">
                Ej: "¿Qué empresas de construcción están verificadas?"
              </Text>
            </View>
          ) : null}
          {messages.map((message, i) => (
            <View key={i} className={`flex-row items-end gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.role === 'assistant' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                  <Bot size={14} color="#1A1C1C" />
                </View>
              ) : null}
              <View
                className={`max-w-[80%] rounded-lg p-3 ${message.role === 'user' ? 'bg-primary' : 'bg-muted'}`}
              >
                <Text className={`text-sm ${message.role === 'user' ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {message.content}
                </Text>
              </View>
              {message.role === 'user' ? (
                <View className="h-7 w-7 items-center justify-center rounded-full bg-primary">
                  <User size={14} color="#000" />
                </View>
              ) : null}
            </View>
          ))}
          {isLoading ? (
            <View className="flex-row items-center gap-2">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-muted">
                <Bot size={14} color="#1A1C1C" />
              </View>
              <ActivityIndicator />
            </View>
          ) : null}
          {error ? <Text className="text-center text-sm text-destructive">{error}</Text> : null}
        </ScrollView>
        <View className="flex-row items-center gap-2 border-t border-border p-3">
          <View className="flex-1">
            <TextField
              placeholder="Escribe tu pregunta…"
              value={input}
              onChangeText={setInput}
              editable={!isLoading}
              onSubmitEditing={submit}
              returnKeyType="send"
            />
          </View>
          <Button onPress={submit} loading={isLoading} disabled={!input.trim()} className="w-24">
            Enviar
          </Button>
        </View>
      </KeyboardAware>
    </SafeAreaView>
  );
}
