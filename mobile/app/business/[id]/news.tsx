import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Plus, Trash2 } from 'lucide-react-native';
import { useCompany, useCompanyOfferMutations, useCompanyAnnouncementMutations } from '../../../src/hooks/use-queries';
import { LoadingState } from '../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../src/components/ui/EmptyState';
import { TextField } from '../../../src/components/ui/TextField';
import { Button } from '../../../src/components/ui/Button';
import { Section } from '../../../src/components/ui/Section';
import { Badge } from '../../../src/components/ui/Badge';
import { KeyboardAware } from '../../../src/components/ui/KeyboardAware';

function AddOfferForm({ onAdd, submitting }: { onAdd: (title: string, discount: string, description: string) => void; submitting: boolean }) {
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('');
  const [description, setDescription] = useState('');
  return (
    <View className="gap-2.5 rounded-lg border border-border bg-card p-3.5">
      <TextField placeholder="Título de la oferta" value={title} onChangeText={setTitle} />
      <TextField placeholder="Descuento (ej. 20%)" value={discount} onChangeText={setDiscount} />
      <TextField placeholder="Descripción (opcional)" value={description} onChangeText={setDescription} />
      <Button
        loading={submitting}
        disabled={!title.trim() || !discount.trim()}
        onPress={() => {
          onAdd(title.trim(), discount.trim(), description.trim());
          setTitle('');
          setDiscount('');
          setDescription('');
        }}
      >
        Publicar oferta
      </Button>
    </View>
  );
}

function AddAnnouncementForm({ onAdd, submitting }: { onAdd: (title: string, content: string) => void; submitting: boolean }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <View className="gap-2.5 rounded-lg border border-border bg-card p-3.5">
      <TextField placeholder="Título del anuncio" value={title} onChangeText={setTitle} />
      <TextField
        placeholder="Contenido"
        multiline
        style={{ height: 70, textAlignVertical: 'top', paddingTop: 10 }}
        value={content}
        onChangeText={setContent}
      />
      <Button
        loading={submitting}
        disabled={!title.trim() || !content.trim()}
        onPress={() => {
          onAdd(title.trim(), content.trim());
          setTitle('');
          setContent('');
        }}
      >
        Publicar anuncio
      </Button>
    </View>
  );
}

export default function NewsManageScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: company, isLoading } = useCompany(id);
  const offerMutations = useCompanyOfferMutations(id);
  const announcementMutations = useCompanyAnnouncementMutations(id);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);

  if (isLoading) return <LoadingState />;
  if (!company) return <EmptyState title="No se pudo cargar el negocio" />;

  const offers = [...(company.offers ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const announcements = [...(company.announcements ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Ofertas y anuncios' }} />
      <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="pb-10">
        <Section title="Ofertas">
          <View className="gap-2.5">
            {showOfferForm ? (
              <AddOfferForm
                submitting={offerMutations.add.isPending}
                onAdd={(title, discount, description) => {
                  offerMutations.add.mutate({ company, input: { title, discount, description } }, { onSuccess: () => setShowOfferForm(false) });
                }}
              />
            ) : (
              <Pressable onPress={() => setShowOfferForm(true)} className="flex-row items-center gap-1.5 self-start">
                <Plus size={16} color="#1976D2" />
                <Text className="text-sm font-medium text-secondary">Nueva oferta</Text>
              </Pressable>
            )}
            {offers.map((offer) => (
              <View key={offer.id} className="flex-row items-center gap-2 rounded-lg border border-border bg-card p-3">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{offer.title}</Text>
                  <Badge label={offer.discount} variant="primary" />
                </View>
                <Pressable onPress={() => offerMutations.remove.mutate({ company, offer })} className="h-9 w-9 items-center justify-center">
                  <Trash2 size={16} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            {offers.length === 0 && !showOfferForm ? <Text className="text-sm text-muted-foreground">Sin ofertas activas.</Text> : null}
          </View>
        </Section>

        <Section title="Anuncios">
          <View className="gap-2.5">
            {showAnnouncementForm ? (
              <AddAnnouncementForm
                submitting={announcementMutations.add.isPending}
                onAdd={(title, content) => {
                  announcementMutations.add.mutate({ company, input: { title, content } }, { onSuccess: () => setShowAnnouncementForm(false) });
                }}
              />
            ) : (
              <Pressable onPress={() => setShowAnnouncementForm(true)} className="flex-row items-center gap-1.5 self-start">
                <Plus size={16} color="#1976D2" />
                <Text className="text-sm font-medium text-secondary">Nuevo anuncio</Text>
              </Pressable>
            )}
            {announcements.map((a) => (
              <View key={a.id} className="flex-row items-center gap-2 rounded-lg border border-border bg-card p-3">
                <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                  {a.title}
                </Text>
                <Pressable
                  onPress={() => announcementMutations.remove.mutate({ company, announcement: a })}
                  className="h-9 w-9 items-center justify-center"
                >
                  <Trash2 size={16} color="#EF4444" />
                </Pressable>
              </View>
            ))}
            {announcements.length === 0 && !showAnnouncementForm ? (
              <Text className="text-sm text-muted-foreground">Sin anuncios.</Text>
            ) : null}
          </View>
        </Section>
      </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}
