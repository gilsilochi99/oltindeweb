import { useState } from 'react';
import { Alert, FlatList, Linking, Pressable, RefreshControl, Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { Download, FileText, Paperclip, Trash2 } from 'lucide-react-native';
import { useCompany } from '../../../src/hooks/use-queries';
import { addDocument, deleteDocument } from '../../../src/lib/business';
import { uploadFileRaw } from '../../../src/lib/api';
import { absoluteUrl } from '../../../src/lib/shop';
import { Button } from '../../../src/components/ui/Button';
import { TextField } from '../../../src/components/ui/TextField';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

const MAX_BYTES = 15 * 1024 * 1024; // same limit as the web's /api/upload
const TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'image/*',
];

type Picked = { uri: string; name: string; size: number; mimeType?: string };

// Files the company shares on its profile — catalogues, price lists…
// (web: dashboard/companies/[id]/documents).
export default function DocumentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const company = useCompany(id);
  const [name, setName] = useState('');
  const [file, setFile] = useState<Picked | null>(null);

  const documents = [...(company.data?.documents ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['company', id] });

  const pick = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: TYPES, copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const a = result.assets[0];
    if (a.size && a.size > MAX_BYTES) {
      Alert.alert('Archivo demasiado grande', 'El máximo es 15 MB.');
      return;
    }
    setFile({ uri: a.uri, name: a.name, size: a.size ?? 0, mimeType: a.mimeType });
    if (!name.trim()) setName(a.name.replace(/\.[^.]+$/, ''));
  };

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Elija un archivo.');
      const safe = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
      const url = await uploadFileRaw(file.uri, `documents/${id}/${Crypto.randomUUID()}-${safe}`, file.mimeType);
      await addDocument(id, { name: name.trim(), url, size: file.size });
    },
    onSuccess: () => {
      setName('');
      setFile(null);
      refresh();
      Alert.alert('Documento subido', 'Ya aparece en el perfil de su empresa.');
    },
    onError: (e: Error) => Alert.alert('No se pudo subir', e.message),
  });

  const remove = useMutation({
    mutationFn: (docId: string) => deleteDocument(id, docId),
    onSuccess: refresh,
    onError: (e: Error) => Alert.alert('No se pudo eliminar', e.message),
  });

  if (company.isLoading) return <LoadingState />;

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: 'Documentos' }} />
      <FlatList
        data={documents}
        keyExtractor={(d) => d.id}
        contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={company.isRefetching} onRefresh={() => company.refetch()} />}
        ListHeaderComponent={
          <View className="mb-3 gap-3 rounded-lg border border-border bg-card p-4">
            <Text className="text-[15px] font-semibold text-foreground">Subir un documento</Text>
            <TextField label="Nombre" value={name} onChangeText={setName} placeholder="Ej: Catálogo 2026" />
            <Pressable onPress={pick} className="flex-row items-center gap-2 rounded-lg border border-dashed border-input bg-background px-3 py-3.5 active:bg-muted">
              <Paperclip size={18} color="#1A1C1C" />
              <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                {file ? file.name : 'Elegir archivo (PDF, Word, Excel, imagen…)'}
              </Text>
              {file ? <Text className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)} MB</Text> : null}
            </Pressable>
            <Button onPress={() => upload.mutate()} loading={upload.isPending} disabled={!file || !name.trim()}>
              Subir documento
            </Button>
          </View>
        }
        ListEmptyComponent={<EmptyState icon={FileText} title="No hay documentos" description="Los documentos que suba aparecerán en el perfil de su empresa." />}
        renderItem={({ item }) => (
          <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card p-3">
            <FileText size={20} color="#1A1C1C" />
            <View className="flex-1">
              <Text className="text-sm font-semibold text-foreground" numberOfLines={2}>{item.name}</Text>
              <Text className="text-xs text-muted-foreground">Subido el {new Date(item.createdAt).toLocaleDateString('es-ES')}</Text>
            </View>
            <Pressable onPress={() => { const u = absoluteUrl(item.url); if (u) Linking.openURL(u); }} hitSlop={8} className="p-1.5" accessibilityLabel="Abrir">
              <Download size={19} color="#1976D2" />
            </Pressable>
            <Pressable
              onPress={() =>
                Alert.alert('Eliminar documento', `¿Eliminar "${item.name}"? No se puede deshacer.`, [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(item.id) },
                ])
              }
              hitSlop={8}
              className="p-1.5"
              accessibilityLabel="Eliminar"
            >
              <Trash2 size={19} color="#B91C1C" />
            </Pressable>
          </View>
        )}
      />
    </KeyboardAware>
  );
}
