import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import { BadgeCheck, Clock, FileText, ShieldAlert, X } from 'lucide-react-native';
import { getVerificationState, submitVerification, uploadVerificationDoc, type VerificationDoc } from '../../../src/lib/business';
import { Button } from '../../../src/components/ui/Button';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

const KINDS: { kind: VerificationDoc['kind']; title: string; help: string }[] = [
  { kind: 'business', title: 'Documento de la empresa', help: 'Registro mercantil, licencia de apertura o documento fiscal (NIF).' },
  { kind: 'identity', title: 'Su documento de identidad', help: 'DNI o pasaporte de quien gestiona la empresa.' },
];

function Banner({ tone, icon: Icon, title, text }: { tone: 'green' | 'amber' | 'red'; icon: typeof Clock; title: string; text?: string }) {
  const c = { green: ['#F0FDF4', '#86EFAC', '#15803D'], amber: ['#FFFBEB', '#FCD34D', '#B45309'], red: ['#FEF2F2', '#FCA5A5', '#B91C1C'] }[tone];
  return (
    <View className="flex-row gap-3 rounded-lg p-4" style={{ backgroundColor: c[0], borderWidth: 1, borderColor: c[1] }}>
      <Icon size={22} color={c[2]} />
      <View className="flex-1 gap-1">
        <Text className="text-sm font-semibold text-foreground">{title}</Text>
        {text ? <Text className="text-xs text-foreground/70">{text}</Text> : null}
      </View>
    </View>
  );
}

// "Negocio verificado": send proof, staff review it (web: dashboard/companies/[id]/verification).
export default function VerificationScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const state = useQuery({ queryKey: ['verification', id], queryFn: () => getVerificationState(id) });
  const [docs, setDocs] = useState<VerificationDoc[]>([]);
  const [uploading, setUploading] = useState<VerificationDoc['kind'] | null>(null);
  const [note, setNote] = useState('');

  const pick = async (kind: VerificationDoc['kind']) => {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'], copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    if (a.size && a.size > 15 * 1024 * 1024) return Alert.alert('Archivo demasiado grande', 'El máximo es 15 MB.');
    setUploading(kind);
    try {
      const key = await uploadVerificationDoc(id, { uri: a.uri, name: a.name, mimeType: a.mimeType });
      setDocs((prev) => [...prev.filter((d) => d.kind !== kind), { kind, key, name: a.name }]);
    } catch (e) {
      Alert.alert('No se pudo subir', e instanceof Error ? e.message : '');
    } finally {
      setUploading(null);
    }
  };

  const send = useMutation({
    mutationFn: () => submitVerification(id, docs, note),
    onSuccess: () => {
      setDocs([]);
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['verification', id] });
      Alert.alert('Solicitud enviada', 'Le avisaremos cuando la revisemos (normalmente en 1–3 días).');
    },
    onError: (e: Error) => Alert.alert('No se pudo enviar', e.message),
  });

  if (state.isLoading) return <LoadingState />;
  if (!state.data) return <EmptyState title="Solo el dueño de la empresa puede ver esta página" />;
  const s = state.data;
  const pending = s.latest?.status === 'pending';

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: 'Verificación' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        {s.isVerified ? (
          <Banner tone="green" icon={BadgeCheck} title="Su empresa tiene el sello de Negocio verificado."
            text={s.verifiedUntil ? `Válido hasta el ${new Date(s.verifiedUntil).toLocaleDateString('es-ES')}.` : undefined} />
        ) : pending ? (
          <Banner tone="amber" icon={Clock} title="Su solicitud está en revisión." text="Le avisaremos por la app y por email." />
        ) : s.latest?.status === 'rejected' ? (
          <Banner tone="red" icon={ShieldAlert} title="Su última solicitud no se aprobó." text={s.latest.reviewNote ? `Motivo: ${s.latest.reviewNote}` : undefined} />
        ) : null}

        {!pending ? (
          <>
            <Text className="text-sm text-muted-foreground">
              El sello indica a los clientes que Oltinde ha comprobado que la empresa existe y que usted la gestiona. Sus documentos son privados: solo los ve el equipo de Oltinde.
            </Text>
            {KINDS.map(({ kind, title, help }) => {
              const doc = docs.find((d) => d.kind === kind);
              return (
                <View key={kind} className="gap-2 rounded-lg border border-border bg-card p-4">
                  <Text className="text-[15px] font-semibold text-foreground">{title}</Text>
                  <Text className="text-xs text-muted-foreground">{help}</Text>
                  {doc ? (
                    <View className="flex-row items-center gap-2">
                      <FileText size={16} color="#1A1C1C" />
                      <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>{doc.name}</Text>
                      <Pressable onPress={() => setDocs((prev) => prev.filter((d) => d.kind !== kind))} hitSlop={8}><X size={18} color="#6B6B6B" /></Pressable>
                    </View>
                  ) : (
                    <Button variant="outline" onPress={() => pick(kind)} loading={uploading === kind} disabled={!!uploading}>
                      Elegir PDF o foto
                    </Button>
                  )}
                </View>
              );
            })}
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">Comentario (opcional)</Text>
              <TextInput
                value={note}
                onChangeText={setNote}
                multiline
                placeholder="Ej: la licencia está a nombre de la sociedad."
                placeholderTextColor="#9CA3AF"
                className="min-h-[60px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
                style={{ textAlignVertical: 'top' }}
              />
            </View>
            <Button onPress={() => send.mutate()} loading={send.isPending} disabled={docs.length < 2}>
              Enviar para revisión
            </Button>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAware>
  );
}
