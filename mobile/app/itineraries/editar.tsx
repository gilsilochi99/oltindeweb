import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, Building2, MapPin, Plus, Search, Trash2, X } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useActiveCompanies, useItinerary, useTouristLocations, useUniqueCities } from '../../src/hooks/use-queries';
import { createItinerary, updateItinerary, type ItineraryInput } from '../../src/lib/creator';
import type { ItineraryStopLocationType, ItineraryVisibility } from '../../src/lib/types';
import { PhotoPicker } from '../../src/components/business/PhotoPicker';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

type StopDraft = { key: string; locationId: string; locationType: ItineraryStopLocationType; day: number; suggestedTime: string; notes: string };
type Option = { id: string; type: ItineraryStopLocationType; name: string; city?: string };

// Create or edit an itinerary (web: ItineraryForm): details, then the stops
// (tourist places or companies) in order, each on a day.
export default function EditItineraryScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const existing = useItinerary(id ?? '');
  const { data: cities = [] } = useUniqueCities();
  const { data: places = [] } = useTouristLocations();
  const { data: companies = [] } = useActiveCompanies();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [days, setDays] = useState('1');
  const [theme, setTheme] = useState('');
  const [visibility, setVisibility] = useState<ItineraryVisibility>('public');
  const [cover, setCover] = useState<string[]>([]);
  const [stops, setStops] = useState<StopDraft[]>([]);
  const [loaded, setLoaded] = useState(!id);
  const [picking, setPicking] = useState<number | null>(null); // day being added to

  useEffect(() => {
    const it = existing.data;
    if (it && !loaded) {
      setTitle(it.title);
      setDescription(it.description);
      setCity(it.city);
      setDays(String(it.durationDays));
      setTheme(it.theme?.join(', ') ?? '');
      setVisibility(it.visibility);
      setCover(it.coverImage && !it.coverImage.includes('placehold.co') ? [it.coverImage] : []);
      setStops(
        [...it.stops]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({ key: s.id, locationId: s.locationId, locationType: s.locationType || 'place', day: s.day, suggestedTime: s.suggestedTime || '', notes: s.notes || '' })),
      );
      setLoaded(true);
    }
  }, [existing.data, loaded]);

  const options = useMemo<Option[]>(
    () => [
      ...places.map((p) => ({ id: p.id, type: 'place' as const, name: p.name, city: p.location?.city })),
      ...companies.map((c) => ({ id: c.id, type: 'company' as const, name: c.name, city: c.branches?.[0]?.location?.city })),
    ],
    [places, companies],
  );
  const nameOf = (s: StopDraft) => options.find((o) => o.id === s.locationId && o.type === s.locationType)?.name ?? 'Lugar desconocido';

  const dayCount = Math.max(1, Math.min(30, Number(days) || 1));
  const move = (index: number, dir: -1 | 1) =>
    setStops((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });
  const patchStop = (key: string, p: Partial<StopDraft>) => setStops((prev) => prev.map((s) => (s.key === key ? { ...s, ...p } : s)));

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Inicie sesión para continuar.');
      const input: ItineraryInput = {
        title: title.trim(),
        description: description.trim(),
        city,
        durationDays: dayCount,
        coverImage: cover[0] ?? '',
        theme: theme.split(',').map((t) => t.trim()).filter(Boolean),
        visibility,
        stops: stops.map((s, i) => ({
          locationId: s.locationId,
          locationType: s.locationType,
          order: i + 1,
          day: Math.min(s.day, dayCount),
          suggestedTime: s.suggestedTime.trim(),
          notes: s.notes.trim(),
        })),
      };
      if (id) await updateItinerary(id, user.uid, input);
      else await createItinerary(user.uid, user.displayName ?? 'Usuario', input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itineraries'] });
      queryClient.invalidateQueries({ queryKey: ['itinerary', id] });
      router.back();
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const problem =
    title.trim().length < 5 ? 'El título debe tener al menos 5 caracteres.'
    : description.trim().length < 10 ? 'La descripción debe tener al menos 10 caracteres.'
    : !city ? 'Elija una ciudad.'
    : stops.length === 0 ? 'Añada al menos una parada.'
    : undefined;

  if (id && !loaded) return <LoadingState />;

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: id ? 'Editar itinerario' : 'Nuevo itinerario' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        <TextField label="Título" value={title} onChangeText={setTitle} placeholder="Ej: Fin de semana en Malabo" />
        <View className="gap-1.5">
          <Text className="text-sm font-medium text-foreground">Descripción</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="¿Para quién es y qué se va a vivir?"
            placeholderTextColor="#9CA3AF"
            multiline
            className="min-h-[90px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
            style={{ textAlignVertical: 'top' }}
          />
        </View>
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Ciudad</Text>
          <View className="flex-row flex-wrap gap-2">
            {cities.map((c) => <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />)}
          </View>
        </View>
        <View className="flex-row gap-3">
          <View className="w-28">
            <TextField label="Días" value={days} onChangeText={(t) => setDays(t.replace(/[^0-9]/g, ''))} keyboardType="number-pad" maxLength={2} />
          </View>
          <View className="flex-1">
            <TextField label="Temas (opcional)" value={theme} onChangeText={setTheme} placeholder="Ej: familiar, aventura" />
          </View>
        </View>
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Visibilidad</Text>
          <View className="flex-row flex-wrap gap-2">
            <Chip label="Público" selected={visibility === 'public'} onPress={() => setVisibility('public')} />
            <Chip label="No listado (solo con enlace)" selected={visibility === 'unlisted'} onPress={() => setVisibility('unlisted')} />
          </View>
        </View>
        <View className="gap-2">
          <Text className="text-sm font-medium text-foreground">Foto de portada (opcional)</Text>
          <PhotoPicker urls={cover} onChange={setCover} folder={`itineraries/${id ?? 'new'}`} max={1} />
        </View>

        {Array.from({ length: dayCount }, (_, d) => d + 1).map((day) => {
          const dayStops = stops.map((s, i) => ({ s, i })).filter(({ s }) => Math.min(s.day, dayCount) === day);
          return (
            <View key={day} className="gap-2 rounded-lg border border-border bg-card p-3">
              <Text className="text-[15px] font-semibold text-foreground">Día {day}</Text>
              {dayStops.map(({ s, i }) => (
                <View key={s.key} className="gap-2 rounded-md bg-muted p-3">
                  <View className="flex-row items-center gap-2">
                    {s.locationType === 'company' ? <Building2 size={15} color="#1A1C1C" /> : <MapPin size={15} color="#1A1C1C" />}
                    <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={2}>{nameOf(s)}</Text>
                    <Pressable onPress={() => move(i, -1)} hitSlop={6} className="p-1"><ArrowUp size={17} color="#1A1C1C" /></Pressable>
                    <Pressable onPress={() => move(i, 1)} hitSlop={6} className="p-1"><ArrowDown size={17} color="#1A1C1C" /></Pressable>
                    <Pressable onPress={() => setStops((prev) => prev.filter((x) => x.key !== s.key))} hitSlop={6} className="p-1">
                      <Trash2 size={17} color="#B91C1C" />
                    </Pressable>
                  </View>
                  {dayCount > 1 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-1.5">
                      {Array.from({ length: dayCount }, (_, k) => k + 1).map((k) => (
                        <Chip key={k} label={`Día ${k}`} selected={Math.min(s.day, dayCount) === k} onPress={() => patchStop(s.key, { day: k })} />
                      ))}
                    </ScrollView>
                  ) : null}
                  <View className="flex-row gap-2">
                    <TextInput
                      value={s.suggestedTime}
                      onChangeText={(t) => patchStop(s.key, { suggestedTime: t })}
                      placeholder="Hora (10:00)"
                      placeholderTextColor="#9CA3AF"
                      className="h-10 w-28 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
                    />
                    <TextInput
                      value={s.notes}
                      onChangeText={(t) => patchStop(s.key, { notes: t })}
                      placeholder="Nota (opcional)"
                      placeholderTextColor="#9CA3AF"
                      className="h-10 flex-1 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
                    />
                  </View>
                </View>
              ))}
              <Pressable onPress={() => setPicking(day)} className="flex-row items-center gap-1.5 self-start py-1">
                <Plus size={16} color="#1976D2" />
                <Text className="text-sm font-semibold text-secondary">Añadir parada</Text>
              </Pressable>
            </View>
          );
        })}

        {problem ? <Text className="text-sm text-muted-foreground">{problem}</Text> : null}
        <Button onPress={() => save.mutate()} loading={save.isPending} disabled={!!problem}>
          {id ? 'Guardar cambios' : 'Crear itinerario'}
        </Button>
      </ScrollView>

      <StopPicker
        visible={picking !== null}
        options={options}
        city={city}
        onClose={() => setPicking(null)}
        onPick={(o) => {
          setStops((prev) => [...prev, { key: `${o.type}:${o.id}:${Date.now()}`, locationId: o.id, locationType: o.type, day: picking ?? 1, suggestedTime: '', notes: '' }]);
          setPicking(null);
        }}
      />
    </KeyboardAware>
  );
}

function StopPicker({ visible, options, city, onClose, onPick }: { visible: boolean; options: Option[]; city: string; onClose: () => void; onPick: (o: Option) => void }) {
  const [q, setQ] = useState('');
  const [kind, setKind] = useState<ItineraryStopLocationType>('place');
  const [onlyCity, setOnlyCity] = useState(true);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return options
      .filter((o) => o.type === kind && (!onlyCity || !city || o.city === city) && (!s || o.name.toLowerCase().includes(s)))
      .slice(0, 100);
  }, [options, q, kind, onlyCity, city]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAware className="flex-1 bg-background">
        <View className="flex-row items-center gap-2 border-b border-border px-4 pb-3 pt-12">
          <Text className="flex-1 text-lg font-semibold text-foreground">Añadir parada</Text>
          <Pressable onPress={onClose} hitSlop={10}><X size={22} color="#1A1C1C" /></Pressable>
        </View>
        <View className="gap-3 px-4 py-3">
          <View className="flex-row items-center gap-2 rounded-full border border-input bg-card px-4" style={{ height: 44 }}>
            <Search size={18} color="#8A8A8A" />
            <TextInput value={q} onChangeText={setQ} placeholder="Buscar…" placeholderTextColor="#9CA3AF" className="flex-1 text-base text-foreground" autoFocus />
          </View>
          <View className="flex-row flex-wrap gap-2">
            <Chip label="Lugares" selected={kind === 'place'} onPress={() => setKind('place')} />
            <Chip label="Empresas" selected={kind === 'company'} onPress={() => setKind('company')} />
            {city ? <Chip label={`Solo ${city}`} selected={onlyCity} onPress={() => setOnlyCity((v) => !v)} /> : null}
          </View>
        </View>
        <FlatList
          data={list}
          keyExtractor={(o) => `${o.type}:${o.id}`}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          ListEmptyComponent={<Text className="py-8 text-center text-sm text-muted-foreground">No hay resultados.</Text>}
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item)} className="flex-row items-center gap-3 border-b border-border py-3 active:bg-muted">
              {item.type === 'company' ? <Building2 size={17} color="#1A1C1C" /> : <MapPin size={17} color="#1A1C1C" />}
              <View className="flex-1">
                <Text className="text-[15px] text-foreground">{item.name}</Text>
                {item.city ? <Text className="text-xs text-muted-foreground">{item.city}</Text> : null}
              </View>
            </Pressable>
          )}
        />
      </KeyboardAware>
    </Modal>
  );
}
