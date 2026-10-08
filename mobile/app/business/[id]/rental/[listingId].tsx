import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DRIVER_OPTION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, kindsFor, unitLabel,
  type RentalCategory, type RentalDriverOption, type RentalListing,
} from '../../../../src/lib/rentals';
import { createRentalListing, getListingForEdit, updateRentalListing, type RentalListingInput } from '../../../../src/lib/business';
import { rpc } from '../../../../src/lib/api';
import { PhotoPicker } from '../../../../src/components/business/PhotoPicker';
import { TextField } from '../../../../src/components/ui/TextField';
import { Button } from '../../../../src/components/ui/Button';
import { Chip } from '../../../../src/components/ui/Rail';
import { LoadingState } from '../../../../src/components/ui/LoadingState';
import { EmptyState } from '../../../../src/components/ui/EmptyState';

const MAX_IMAGES = 15; // same limit as the server

const PROPERTY_AMENITIES = [
  'Aire acondicionado', 'Wifi', 'Agua caliente', 'Generador', 'Depósito de agua', 'Parking',
  'Seguridad 24h', 'Piscina', 'Cocina equipada', 'Lavadora', 'TV', 'Balcón / Terraza',
  'Jardín', 'Ascensor', 'Vistas al mar', 'Admite mascotas',
];
const VEHICLE_AMENITIES = [
  'Aire acondicionado', 'GPS', '4x4', 'Bluetooth', 'Cámara trasera', 'Asientos para niños',
  'Seguro a todo riesgo', 'Kilometraje ilimitado', 'Entrega a domicilio', 'Recogida en aeropuerto',
];

const str = (n?: number) => (n === undefined || n === null ? '' : String(n));
const optNum = (s: string) => (s.trim() === '' ? undefined : Number(s.replace(/[^\d.]/g, '')) || undefined);

export default function RentalFormScreen() {
  const { id: companyId, listingId } = useLocalSearchParams<{ id: string; listingId: string }>();
  const isNew = listingId === 'new';
  const existing = useQuery({ queryKey: ['advertiser', 'listing', listingId], queryFn: () => getListingForEdit(listingId), enabled: !isNew });
  if (!isNew && existing.isLoading) return <LoadingState />;
  if (!isNew && !existing.data) return <EmptyState title="Anuncio no encontrado" />;
  return <RentalForm companyId={companyId} listing={existing.data ?? undefined} />;
}

function RentalForm({ companyId, listing }: { companyId: string; listing?: RentalListing }) {
  const queryClient = useQueryClient();
  const cities = useQuery({ queryKey: ['cities'], queryFn: () => rpc<string[]>('getUniqueCities') });

  const [images, setImages] = useState<string[]>(listing?.images.map((i) => i.url) ?? []);
  const [category, setCategory] = useState<RentalCategory>(listing?.category ?? 'property');
  const [kind, setKind] = useState(listing?.kind ?? '');
  const [title, setTitle] = useState(listing?.title ?? '');
  const [description, setDescription] = useState(listing?.description ?? '');
  const [city, setCity] = useState(listing?.city ?? '');
  const [neighborhood, setNeighborhood] = useState(listing?.neighborhood ?? '');
  const [address, setAddress] = useState(listing?.address ?? '');
  const [shortTermEnabled, setShortTermEnabled] = useState(listing?.shortTermEnabled ?? true);
  const [dailyPrice, setDailyPrice] = useState(str(listing?.dailyPrice));
  const [minUnits, setMinUnits] = useState(str(listing?.minUnits ?? 1));
  const [maxUnits, setMaxUnits] = useState(str(listing?.maxUnits));
  const [longTermEnabled, setLongTermEnabled] = useState(listing?.longTermEnabled ?? false);
  const [monthlyPrice, setMonthlyPrice] = useState(str(listing?.monthlyPrice));
  const [minMonths, setMinMonths] = useState(str(listing?.minMonths ?? 1));
  const [deposit, setDeposit] = useState(str(listing?.deposit));
  const [priceNotes, setPriceNotes] = useState(listing?.priceNotes ?? '');
  const [bedrooms, setBedrooms] = useState(str(listing?.bedrooms));
  const [bathrooms, setBathrooms] = useState(str(listing?.bathrooms));
  const [areaM2, setAreaM2] = useState(str(listing?.areaM2));
  const [maxGuests, setMaxGuests] = useState(str(listing?.maxGuests));
  const [furnished, setFurnished] = useState(listing?.furnished ?? false);
  const [brand, setBrand] = useState(listing?.brand ?? '');
  const [model, setModel] = useState(listing?.model ?? '');
  const [year, setYear] = useState(str(listing?.year));
  const [transmission, setTransmission] = useState(listing?.transmission ?? '');
  const [fuel, setFuel] = useState(listing?.fuel ?? '');
  const [seats, setSeats] = useState(str(listing?.seats));
  const [driverOption, setDriverOption] = useState<RentalDriverOption>(listing?.driverOption ?? 'none');
  const [driverDailyFee, setDriverDailyFee] = useState(str(listing?.driverDailyFee));
  const [amenities, setAmenities] = useState<string[]>(listing?.amenities ?? []);
  const [rules, setRules] = useState(listing?.rules ?? '');

  const isProperty = category === 'property';

  const save = useMutation({
    mutationFn: async (status: RentalListingInput['status']) => {
      const input: RentalListingInput = {
        title: title.trim(),
        description: description.trim(),
        category,
        kind,
        status,
        city: city.trim(),
        neighborhood: neighborhood.trim() || undefined,
        address: address.trim() || undefined,
        lat: listing?.lat,
        lng: listing?.lng,
        shortTermEnabled,
        dailyPrice: optNum(dailyPrice),
        minUnits: optNum(minUnits) ?? 1,
        maxUnits: optNum(maxUnits),
        longTermEnabled,
        monthlyPrice: optNum(monthlyPrice),
        minMonths: optNum(minMonths) ?? 1,
        deposit: optNum(deposit),
        priceNotes: priceNotes.trim() || undefined,
        bedrooms: optNum(bedrooms),
        bathrooms: optNum(bathrooms),
        areaM2: optNum(areaM2),
        maxGuests: optNum(maxGuests),
        furnished: isProperty ? furnished : undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        year: optNum(year),
        transmission: transmission || undefined,
        fuel: fuel || undefined,
        seats: optNum(seats),
        driverOption: isProperty ? undefined : driverOption,
        driverDailyFee: optNum(driverDailyFee),
        amenities,
        rules: rules.trim() || undefined,
        images,
      };
      if (listing) await updateRentalListing(listing.id, input);
      else await createRentalListing(companyId, input);
      return status;
    },
    onSuccess: (status) => {
      queryClient.invalidateQueries({ queryKey: ['advertiser'] });
      queryClient.invalidateQueries({ queryKey: ['rentals'] });
      Alert.alert(status === 'active' ? 'Anuncio publicado' : 'Guardado', status === 'active' ? 'Ya aparece en Alquiler.' : 'Puede publicarlo cuando quiera.');
      router.back();
    },
    onError: (e: Error) => Alert.alert('No se pudo guardar', e.message),
  });

  const amenityList = isProperty ? PROPERTY_AMENITIES : VEHICLE_AMENITIES;
  const toggleAmenity = (a: string) => setAmenities(amenities.includes(a) ? amenities.filter((x) => x !== a) : [...amenities, a]);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen options={{ title: listing ? 'Editar anuncio' : 'Nuevo anuncio' }} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="gap-5 p-4 pb-10" keyboardShouldPersistTaps="handled">
          <Block title="Qué alquila">
            <View className="flex-row gap-2">
              <Chip label="Inmueble" selected={isProperty} onPress={() => { setCategory('property'); setKind(''); setAmenities([]); }} />
              <Chip label="Vehículo" selected={!isProperty} onPress={() => { setCategory('vehicle'); setKind(''); setAmenities([]); }} />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {Object.entries(kindsFor(category)).map(([key, label]) => (
                <Chip key={key} label={label} selected={kind === key} onPress={() => setKind(key)} />
              ))}
            </View>
          </Block>

          <Block title="Fotos">
            <PhotoPicker urls={images} onChange={setImages} folder={`rentals/${companyId}`} max={MAX_IMAGES} />
          </Block>

          <Block title="Anuncio">
            <TextField label="Título" value={title} onChangeText={setTitle} placeholder={isProperty ? 'Ej.: Piso amueblado de 2 habitaciones en Caracolas' : 'Ej.: Toyota Hilux 4x4 con conductor'} />
            <Text className="text-sm font-medium text-foreground">Descripción</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#9CA3AF"
              placeholder="Describa el inmueble o vehículo, la zona, lo que incluye…"
              className="min-h-[110px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </Block>

          <Block title="Ubicación">
            <View className="flex-row flex-wrap gap-2">
              {(cities.data ?? []).map((c) => <Chip key={c} label={c} selected={city === c} onPress={() => setCity(c)} />)}
            </View>
            <TextField label="Ciudad" value={city} onChangeText={setCity} />
            <TextField label="Barrio (opcional)" value={neighborhood} onChangeText={setNeighborhood} />
            {isProperty ? <TextField label="Dirección (opcional)" value={address} onChangeText={setAddress} /> : null}
          </Block>

          <Block title="Precios">
            <Row label={`Por ${unitLabel(category, true)}`} value={shortTermEnabled} onChange={setShortTermEnabled} />
            {shortTermEnabled ? (
              <View className="gap-2">
                <TextField label={`Precio por ${unitLabel(category)} (XAF)`} value={dailyPrice} onChangeText={setDailyPrice} keyboardType="number-pad" />
                <View className="flex-row gap-2">
                  <View className="flex-1"><TextField label={`Mínimo de ${unitLabel(category, true)}`} value={minUnits} onChangeText={setMinUnits} keyboardType="number-pad" /></View>
                  <View className="flex-1"><TextField label="Máximo (opcional)" value={maxUnits} onChangeText={setMaxUnits} keyboardType="number-pad" /></View>
                </View>
              </View>
            ) : null}
            <Row label="Por meses" value={longTermEnabled} onChange={setLongTermEnabled} />
            {longTermEnabled ? (
              <View className="flex-row gap-2">
                <View className="flex-1"><TextField label="Precio por mes (XAF)" value={monthlyPrice} onChangeText={setMonthlyPrice} keyboardType="number-pad" /></View>
                <View className="flex-1"><TextField label="Mínimo de meses" value={minMonths} onChangeText={setMinMonths} keyboardType="number-pad" /></View>
              </View>
            ) : null}
            <TextField label="Fianza (opcional, XAF)" value={deposit} onChangeText={setDeposit} keyboardType="number-pad" />
            <TextField label="Notas sobre el precio (opcional)" value={priceNotes} onChangeText={setPriceNotes} placeholder="Ej.: luz y agua incluidas" />
          </Block>

          {isProperty ? (
            <Block title="Detalles">
              <View className="flex-row gap-2">
                <View className="flex-1"><TextField label="Habitaciones" value={bedrooms} onChangeText={setBedrooms} keyboardType="number-pad" /></View>
                <View className="flex-1"><TextField label="Baños" value={bathrooms} onChangeText={setBathrooms} keyboardType="number-pad" /></View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1"><TextField label="Superficie (m²)" value={areaM2} onChangeText={setAreaM2} keyboardType="number-pad" /></View>
                <View className="flex-1"><TextField label="Personas máx." value={maxGuests} onChangeText={setMaxGuests} keyboardType="number-pad" /></View>
              </View>
              <Row label="Amueblado" value={furnished} onChange={setFurnished} />
            </Block>
          ) : (
            <Block title="Detalles del vehículo">
              <View className="flex-row gap-2">
                <View className="flex-1"><TextField label="Marca" value={brand} onChangeText={setBrand} /></View>
                <View className="flex-1"><TextField label="Modelo" value={model} onChangeText={setModel} /></View>
              </View>
              <View className="flex-row gap-2">
                <View className="flex-1"><TextField label="Año" value={year} onChangeText={setYear} keyboardType="number-pad" /></View>
                <View className="flex-1"><TextField label="Plazas" value={seats} onChangeText={setSeats} keyboardType="number-pad" /></View>
              </View>
              <Text className="text-sm font-medium text-foreground">Cambio</Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(TRANSMISSION_LABELS).map(([k, l]) => <Chip key={k} label={l} selected={transmission === k} onPress={() => setTransmission(transmission === k ? '' : k)} />)}
              </View>
              <Text className="text-sm font-medium text-foreground">Combustible</Text>
              <View className="flex-row flex-wrap gap-2">
                {Object.entries(FUEL_LABELS).map(([k, l]) => <Chip key={k} label={l} selected={fuel === k} onPress={() => setFuel(fuel === k ? '' : k)} />)}
              </View>
              <Text className="text-sm font-medium text-foreground">Conductor</Text>
              <View className="flex-row flex-wrap gap-2">
                {(Object.keys(DRIVER_OPTION_LABELS) as RentalDriverOption[]).map((k) => (
                  <Chip key={k} label={DRIVER_OPTION_LABELS[k]} selected={driverOption === k} onPress={() => setDriverOption(k)} />
                ))}
              </View>
              {driverOption !== 'none' ? (
                <TextField label="Precio del conductor por día (XAF)" value={driverDailyFee} onChangeText={setDriverDailyFee} keyboardType="number-pad" />
              ) : null}
            </Block>
          )}

          <Block title={isProperty ? 'Comodidades' : 'Equipamiento'}>
            <View className="flex-row flex-wrap gap-2">
              {amenityList.map((a) => <Chip key={a} label={a} selected={amenities.includes(a)} onPress={() => toggleAmenity(a)} />)}
            </View>
          </Block>

          <Block title="Condiciones (opcional)">
            <TextInput
              value={rules}
              onChangeText={setRules}
              multiline
              placeholderTextColor="#9CA3AF"
              placeholder={isProperty ? 'Ej.: no se permite fumar; entrada desde las 14:00' : 'Ej.: conductor mayor de 25 años; devolver con el depósito lleno'}
              className="min-h-[80px] rounded-lg border border-input bg-card p-3 text-base text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </Block>
        </ScrollView>

        <View className="flex-row gap-2 border-t border-border bg-card px-4 py-3">
          <Button variant="outline" className="flex-1" onPress={() => save.mutate('draft')} loading={save.isPending && save.variables === 'draft'} disabled={save.isPending}>
            Guardar borrador
          </Button>
          <Button className="flex-1" onPress={() => save.mutate('active')} loading={save.isPending && save.variables === 'active'} disabled={save.isPending}>
            Publicar
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3">
      <Text className="text-lg font-bold text-foreground">{title}</Text>
      {children}
    </View>
  );
}

function Row({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="flex-1 text-sm font-medium text-foreground">{label}</Text>
      <Switch value={value} onValueChange={onChange} />
    </View>
  );
}
