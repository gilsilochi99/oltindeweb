import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Stack, router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { PenLine } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { deletePost, getMyPosts } from '../../src/lib/creator';
import { absoluteUrl } from '../../src/lib/shop';
import { isPlaceholderImage } from '../../src/lib/image-utils';
import { Button } from '../../src/components/ui/Button';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FadeInItem, PressableScale } from '../../src/components/ui/motion';

const STATUS = {
  published: { label: 'Publicado', bg: '#DCFCE7', fg: '#166534' },
  pending: { label: 'En revisión', bg: '#FEF3C7', fg: '#92400E' },
  draft: { label: 'Borrador', bg: '#F3F4F6', fg: '#374151' },
} as const;

// The user's own contributions (web: /dashboard/contribuciones).
export default function MyContributionsScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const posts = useQuery({ queryKey: ['posts', 'mine', uid], queryFn: () => getMyPosts(uid), enabled: !!uid });
  const remove = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: (e: Error) => Alert.alert('No se pudo eliminar', e.message),
  });

  return (
    <>
      <Stack.Screen options={{ title: 'Mis contribuciones' }} />
      {posts.isLoading ? (
        <LoadingState variant="list" />
      ) : (
        <FlatList
          data={posts.data ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={{ padding: 16, gap: 10, flexGrow: 1 }}
          refreshControl={<RefreshControl refreshing={posts.isRefetching} onRefresh={() => posts.refetch()} />}
          ListHeaderComponent={
            <View className="gap-2 pb-2">
              <Text className="text-sm text-muted-foreground">Comparta artículos, guías y noticias con la comunidad de Oltinde.</Text>
              <Button onPress={() => router.push('/contribuciones/editar')}>Nueva contribución</Button>
            </View>
          }
          ListEmptyComponent={<EmptyState icon={PenLine} title="Todavía no ha escrito nada" description="Su primera contribución aparecerá aquí." />}
          renderItem={({ item, index }) => {
            const s = STATUS[item.status] ?? STATUS.draft;
            const image = !isPlaceholderImage(item.featuredImage) ? absoluteUrl(item.featuredImage) : undefined;
            return (
              <FadeInItem index={index}>
                <View className="gap-3 rounded-lg border border-border bg-card p-3">
                  <PressableScale scaleTo={0.98} onPress={() => router.push(`/contribuciones/${item.id}`)} className="flex-row gap-3">
                    {image ? (
                      <Image source={{ uri: image }} style={{ width: 72, height: 72, borderRadius: 6 }} contentFit="cover" />
                    ) : null}
                    <View className="flex-1 gap-1">
                      <Text className="text-[15px] font-semibold text-foreground" numberOfLines={2}>{item.title}</Text>
                      <Text className="text-xs text-muted-foreground" numberOfLines={2}>{item.excerpt}</Text>
                      <View className="flex-row items-center gap-2">
                        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: s.bg }}>
                          <Text className="text-[11px] font-semibold" style={{ color: s.fg }}>{s.label}</Text>
                        </View>
                        <Text className="text-xs text-muted-foreground">{new Date(item.updatedAt || item.createdAt).toLocaleDateString('es-ES')}</Text>
                      </View>
                    </View>
                  </PressableScale>
                  <View className="flex-row gap-2">
                    <Button variant="outline" className="flex-1" onPress={() => router.push({ pathname: '/contribuciones/editar', params: { id: item.id } })}>
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      className="flex-1"
                      onPress={() =>
                        Alert.alert('Eliminar contribución', `¿Eliminar "${item.title}"? No se puede deshacer.`, [
                          { text: 'Cancelar', style: 'cancel' },
                          { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate(item.id) },
                        ])
                      }
                    >
                      Eliminar
                    </Button>
                  </View>
                </View>
              </FadeInItem>
            );
          }}
        />
      )}
    </>
  );
}
