import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, X } from 'lucide-react-native';
import { useAuth } from '../../src/hooks/use-auth';
import { useProfessionalByOwner, useServices, useUniqueCities } from '../../src/hooks/use-queries';
import { createProfessionalProfile, deleteProfessionalProfile, updateProfessionalProfile, type ProfessionalInput } from '../../src/lib/creator';
import { randomId } from '../../src/lib/storage';
import type { ProfessionalAvailability, ProfessionalService } from '../../src/lib/types';
import { PhotoPicker } from '../../src/components/business/PhotoPicker';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { Chip } from '../../src/components/ui/Rail';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

const AVAILABILITY: ProfessionalAvailability[] = ['Disponible', 'Ocupado', 'A demanda'];

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-4">
      <Text className="text-[15px] font-semibold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

// The user's public profile as a professional (web: /dashboard/professional):
// create it, edit it, or delete it.
export default function MyProfessionalProfileScreen() {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const queryClient = useQueryClient();
  const existing = useProfessionalByOwner(uid);
  const { data: services = [] } = useServices();
  const { data: cities = [] } = useUniqueCities();
  const categories = useMemo(() => Array.from(new Set(services.map((s) => s.category).filter(Boolean))).sort(), [services]);

  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('');
  const [photo, setPhoto] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState<ProfessionalAvailability>('Disponible');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillText, setSkillText] = useState('');
  const [offered, setOffered] = useState<ProfessionalService[]>([]);
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (existing.isLoading || loaded) return;
    const p = existing.data;
    if (p) {
      setDisplayName(p.displayName);
      setTitle(p.title);
      setPhoto(p.photo ? [p.photo] : []);
      setBio(p.bio);
      setCategory(p.category);
      setCity(p.city);
      setAvailability(p.availability ?? 'Disponible');
      setSkills(p.skills ?? []);
      setOffered(p.services ?? []);
      setPortfolio(p.portfolio ?? []);
      setPhone(p.contact?.phone ?? '');
      setWhatsapp(p.contact?.whatsapp ?? '');
      setEmail(p.contact?.email ?? '');
      setLinkedin(p.contact?.linkedin ?? '');
    } else {
      setDisplayName(user?.displayName ?? '');
      setEmail(user?.email ?? '');
    }
    setLoaded(true);
  }, [existing.isLoading, existing.data, loaded, user]);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['professionalByOwner'] });
    queryClient.invalidateQueries({ queryKey: ['professionals'] });
    if (existing.data) queryClient.invalidateQueries({ queryKey: ['professional', existing.data.id] });
  };

  const addSkill = () => {
    const parts = skillText.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length) setSkills((prev) => Array.from(new Set([...prev, ...parts])));
    setSkillText('');
  };

  const save = useMutation({
    mutationFn: async () => {
      const pending = skillText.split(',').map((s) => s.trim()).filter(Boolean);
      const data: ProfessionalInput = {
        displayName: displayName.trim(),
        title: title.trim(),
        photo: photo[0] ?? '',
        bio: bio.trim(),
        category,
        city,
        availability,
        skills: Array.from(new Set([...skills, ...pending])),
        services: offered.filter((s) => s.name.trim().length >= 2).map((s) => ({ ...s, name: s.name.trim() })),
        portfolio,
        contact: { phone: phone.trim(), whatsapp: whatsapp.trim(), email: email.trim(), linkedin: linkedin.trim() },
      };
      if (existing.data) await updateProfessionalProfile(existing.data.id, data);
      else await createProfessionalProfile(uid, data);
    },
    onSuccess: () => {
      refresh();
      Alert.alert('Perfil guardado', 'Su perfil de profesional está publicado.', [{ text: 'OK', onPress: () => router.back() }]);
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const remove = useMutation({
    mutationFn: () => deleteProfessionalProfile(existing.data!.id),
    onSuccess: () => {
      refresh();
      router.back();
    },
    onError: (e: Error) => Alert.alert('No se pudo eliminar', e.message),
  });

  const problem =
    displayName.trim().length < 2 ? 'Escriba su nombre.'
    : title.trim().length < 2 ? 'Escriba su título profesional.'
    : bio.trim().length < 10 ? 'La biografía debe tener al menos 10 caracteres.'
    : !category ? 'Elija una categoría.'
    : !city ? 'Elija una ciudad.'
    : skills.length === 0 && !skillText.trim() ? 'Añada al menos una habilidad.'
    : email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'El correo no es válido.'
    : linkedin.trim() && !/^https?:\/\//.test(linkedin.trim()) ? 'El enlace de LinkedIn debe empezar por https://'
    : undefined;

  if (!loaded) return <LoadingState />;

  return (
    <KeyboardAware>
      <Stack.Screen options={{ title: existing.data ? 'Mi perfil profesional' : 'Crear perfil profesional' }} />
      <ScrollView contentContainerClassName="gap-4 p-4 pb-10" keyboardShouldPersistTaps="handled">
        {!existing.data ? (
          <Text className="text-sm text-muted-foreground">
            Aparezca en el directorio de Profesionales de Oltinde para que los clientes le encuentren y le contacten. Es gratis.
          </Text>
        ) : null}

        <Group title="Sobre usted">
          <PhotoPicker urls={photo} onChange={setPhoto} folder={`professionals/${existing.data?.id ?? 'new'}`} max={1} />
          <TextField label="Nombre" value={displayName} onChangeText={setDisplayName} />
          <TextField label="Título profesional" value={title} onChangeText={setTitle} placeholder="Ej: Electricista, Diseñadora gráfica" />
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Biografía</Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Su experiencia y lo que ofrece."
              placeholderTextColor="#9CA3AF"
              multiline
              className="min-h-[100px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </Group>

        <Group title="Categoría y ciudad">
          <View className="flex-row flex-wrap gap-2">
            {categories.map((c) => <Chip key={c} label={c} selected={category === c} onPress={() => setCategory(c)} />)}
          </View>
          <View className="flex-row flex-wrap gap-2 border-t border-border pt-3">
            {cities.map((c) => <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />)}
          </View>
          <View className="flex-row flex-wrap gap-2 border-t border-border pt-3">
            {AVAILABILITY.map((a) => <Chip key={a} label={a} selected={availability === a} onPress={() => setAvailability(a)} />)}
          </View>
        </Group>

        <Group title="Habilidades">
          {skills.length ? (
            <View className="flex-row flex-wrap gap-2">
              {skills.map((s) => (
                <View key={s} className="flex-row items-center gap-1.5 rounded-full bg-muted py-1.5 pl-3 pr-2">
                  <Text className="text-sm text-foreground">{s}</Text>
                  <Pressable onPress={() => setSkills((prev) => prev.filter((x) => x !== s))} hitSlop={6}>
                    <X size={14} color="#6B6B6B" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
          <View className="flex-row gap-2">
            <TextInput
              value={skillText}
              onChangeText={setSkillText}
              onSubmitEditing={addSkill}
              returnKeyType="done"
              placeholder="Ej: Instalaciones, Reparaciones"
              placeholderTextColor="#9CA3AF"
              className="h-11 flex-1 rounded-lg border border-input bg-background px-3 text-base text-foreground"
            />
            <Button variant="outline" onPress={addSkill}>Añadir</Button>
          </View>
        </Group>

        <Group title="Servicios y precios (opcional)">
          {offered.map((s, i) => (
            <View key={s.id} className="gap-2 rounded-md bg-muted p-3">
              <View className="flex-row items-center gap-2">
                <TextInput
                  value={s.name}
                  onChangeText={(t) => setOffered((prev) => prev.map((x, j) => (j === i ? { ...x, name: t } : x)))}
                  placeholder="Servicio"
                  placeholderTextColor="#9CA3AF"
                  className="h-10 flex-1 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
                />
                <Pressable onPress={() => setOffered((prev) => prev.filter((_, j) => j !== i))} hitSlop={6} className="p-1">
                  <Trash2 size={17} color="#B91C1C" />
                </Pressable>
              </View>
              <TextInput
                value={s.price ?? ''}
                onChangeText={(t) => setOffered((prev) => prev.map((x, j) => (j === i ? { ...x, price: t } : x)))}
                placeholder="Precio (ej: desde 20.000 XAF)"
                placeholderTextColor="#9CA3AF"
                className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
              />
              <TextInput
                value={s.description ?? ''}
                onChangeText={(t) => setOffered((prev) => prev.map((x, j) => (j === i ? { ...x, description: t } : x)))}
                placeholder="Descripción (opcional)"
                placeholderTextColor="#9CA3AF"
                className="h-10 rounded-md border border-input bg-card px-2.5 text-sm text-foreground"
              />
            </View>
          ))}
          <Pressable onPress={() => setOffered((prev) => [...prev, { id: randomId(), name: '', price: '', description: '' }])} className="flex-row items-center gap-1.5 self-start py-1">
            <Plus size={16} color="#1976D2" />
            <Text className="text-sm font-semibold text-secondary">Añadir servicio</Text>
          </Pressable>
        </Group>

        <Group title="Portafolio (hasta 5 fotos)">
          <PhotoPicker urls={portfolio} onChange={setPortfolio} folder={`professionals/${existing.data?.id ?? 'new'}/portfolio`} max={5} />
        </Group>

        <Group title="Contacto">
          <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="+240 …" />
          <TextField label="WhatsApp" value={whatsapp} onChangeText={setWhatsapp} keyboardType="phone-pad" placeholder="+240 …" />
          <TextField label="Correo" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <TextField label="LinkedIn (opcional)" value={linkedin} onChangeText={setLinkedin} autoCapitalize="none" placeholder="https://linkedin.com/in/…" />
        </Group>

        {problem ? <Text className="text-sm text-muted-foreground">{problem}</Text> : null}
        <Button onPress={() => save.mutate()} loading={save.isPending} disabled={!!problem}>
          {existing.data ? 'Guardar cambios' : 'Publicar mi perfil'}
        </Button>
        {existing.data ? (
          <>
            <Button variant="outline" onPress={() => router.push(`/professionals/${existing.data!.id}`)}>Ver mi perfil público</Button>
            <Button
              variant="ghost"
              loading={remove.isPending}
              onPress={() =>
                Alert.alert('Eliminar perfil', 'Su perfil dejará de aparecer en el directorio. No se puede deshacer.', [
                  { text: 'Cancelar', style: 'cancel' },
                  { text: 'Eliminar', style: 'destructive', onPress: () => remove.mutate() },
                ])
              }
            >
              Eliminar perfil
            </Button>
          </>
        ) : null}
      </ScrollView>
    </KeyboardAware>
  );
}
