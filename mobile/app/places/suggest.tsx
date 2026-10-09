import { useState } from 'react';
import { Alert, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useAuth } from '../../src/hooks/use-auth';
import { useSuggestTouristLocation } from '../../src/hooks/use-queries';
import { TextField } from '../../src/components/ui/TextField';
import { Button } from '../../src/components/ui/Button';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

export default function SuggestPlaceScreen() {
  const { user } = useAuth();
  const mutation = useSuggestTouristLocation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');

  const submit = () => {
    if (!user) return;
    if (!name.trim() || !description.trim() || !category.trim() || !city.trim()) {
      Alert.alert('Faltan datos', 'Completa al menos el nombre, descripción, categoría y ciudad.');
      return;
    }
    mutation.mutate(
      { name: name.trim(), description: description.trim(), category: category.trim(), city: city.trim(), address: address.trim(), userId: user.uid },
      {
        onSuccess: () => {
          Alert.alert('¡Gracias!', 'Tu sugerencia fue enviada y será revisada por un administrador antes de publicarse.', [
            { text: 'OK', onPress: () => router.push('/places') },
          ]);
        },
        onError: () => Alert.alert('Error', 'No se pudo enviar tu sugerencia. Inténtalo de nuevo.'),
      },
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: 'Sugerir un lugar' }} />
      <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4">
        <Text className="text-sm text-muted-foreground">
          Comparte un lugar que merezca la pena visitar. Un administrador revisará tu sugerencia antes de publicarla.
        </Text>
        <TextField label="Nombre" value={name} onChangeText={setName} />
        <TextField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          multiline
          style={{ height: 90, textAlignVertical: 'top', paddingTop: 10 }}
        />
        <TextField label="Categoría" placeholder="Playa, monumento, museo…" value={category} onChangeText={setCategory} />
        <TextField label="Ciudad" value={city} onChangeText={setCity} />
        <TextField label="Dirección (opcional)" value={address} onChangeText={setAddress} />
        <View className="pt-2">
          <Button onPress={submit} loading={mutation.isPending}>
            Enviar sugerencia
          </Button>
        </View>
      </ScrollView>
      </KeyboardAware>
    </SafeAreaView>
  );
}
