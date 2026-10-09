import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../src/hooks/use-auth';
import { usePublishedPosts } from '../../src/hooks/use-queries';
import { getPostById } from '../../src/lib/data';
import { createPost, hasRichFormatting, htmlToText, textToHtml, updatePost, type PostInput } from '../../src/lib/creator';
import { WEB_APP_URL } from '../../src/lib/config';
import { PhotoPicker } from '../../src/components/business/PhotoPicker';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

const DEFAULT_CATEGORIES = ['Noticias', 'Guías', 'Turismo', 'Negocios', 'Cultura', 'Tecnología'];

// Write or edit a contribution (web: ContributionForm). Same rules as the
// web: title ≥ 5, summary 10–200, text ≥ 50 characters.
export default function EditContributionScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const existing = useQuery({ queryKey: ['post', id], queryFn: () => getPostById(id!), enabled: !!id });
  const { data: published } = usePublishedPosts();

  const [title, setTitle] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loaded, setLoaded] = useState(!id);

  useEffect(() => {
    const p = existing.data;
    if (p && !loaded) {
      setTitle(p.title);
      setExcerpt(p.excerpt);
      setContent(htmlToText(p.content));
      setCategory(p.category ?? '');
      setImages(p.featuredImage && !p.featuredImage.includes('placehold.co') ? [p.featuredImage] : []);
      setStatus(p.status === 'published' ? 'published' : 'draft');
      setLoaded(true);
    }
  }, [existing.data, loaded]);

  const categories = useMemo(() => {
    const fromPosts = (published ?? []).map((p) => p.category).filter((c): c is string => !!c);
    return Array.from(new Set([...fromPosts, ...DEFAULT_CATEGORIES, ...(category ? [category] : [])]));
  }, [published, category]);

  const rich = !!existing.data && hasRichFormatting(existing.data.content);

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Inicie sesión para continuar.');
      const input: PostInput = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content: textToHtml(content),
        category,
        featuredImage: images[0] ?? '',
        status,
      };
      if (id) await updatePost(id, input, existing.data?.featuredImage ?? '');
      else await createPost(user.uid, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const problem =
    title.trim().length < 5 ? 'El título debe tener al menos 5 caracteres.'
    : excerpt.trim().length < 10 ? 'El resumen debe tener al menos 10 caracteres.'
    : excerpt.trim().length > 200 ? 'El resumen no puede superar los 200 caracteres.'
    : content.trim().length < 50 ? 'El texto debe tener al menos 50 caracteres.'
    : !category ? 'Elija una categoría.'
    : undefined;

  if (id && !loaded) return <LoadingState />;

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: id ? 'Editar contribución' : 'Nueva contribución' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        {rich ? (
          <View className="gap-2 rounded-lg border border-primary bg-primary/10 p-3">
            <Text className="text-sm text-foreground">
              Este texto tiene formato (listas, enlaces o imágenes) que la app no puede editar. Si lo guarda aquí, quedará como texto simple.
            </Text>
            <Text className="text-sm font-semibold text-secondary" onPress={() => Linking.openURL(`${WEB_APP_URL}/dashboard/contribuciones/${id}`)}>
              Editar en la web
            </Text>
          </View>
        ) : null}

        <TextField label="Título" value={title} onChangeText={setTitle} placeholder="Ej: Cómo sacar el pasaporte en Malabo" />

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Resumen ({excerpt.trim().length}/200)</Text>
          <TextInput
            value={excerpt}
            onChangeText={setExcerpt}
            placeholder="Una o dos frases que aparecen en la lista."
            placeholderTextColor="#9CA3AF"
            multiline
            maxLength={200}
            className="min-h-[64px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Texto</Text>
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Escriba aquí. Deje una línea en blanco para separar párrafos."
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[220px] rounded-lg border border-input bg-card p-3 text-base leading-6 text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Categoría</Text>
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => (
              <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />
            ))}
          </View>
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Imagen destacada (opcional)</Text>
          <PhotoPicker urls={images} onChange={setImages} folder="posts" max={1} />
        </View>

        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Estado</Text>
          <View className="flex-row gap-2">
            <Chip label="Borrador" selected={status === 'draft'} onPress={() => setStatus('draft')} />
            <Chip label="Publicar" selected={status === 'published'} onPress={() => setStatus('published')} />
          </View>
        </View>

        {problem ? <Text className="text-sm text-muted-foreground">{problem}</Text> : null}
        <Button onPress={() => save.mutate()} loading={save.isPending} disabled={!!problem}>
          {status === 'published' ? 'Guardar y publicar' : 'Guardar borrador'}
        </Button>
      </ScrollView>
    </KeyboardAware>
  );
}
