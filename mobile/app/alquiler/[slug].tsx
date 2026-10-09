import { useEffect, useMemo, useState } from 'react';
import { Alert, Linking, Platform, Pressable, ScrollView, Share, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, CalendarCheck, Car, Check, Fuel, Gauge, ImageOff, MapPin, MessageCircle, Phone, Ruler, Share2, Sofa, Store, Users } from 'lucide-react-native';
import {
  DRIVER_OPTION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, addDaysIso, addMonthsIso, formatIsoDate, getAvailability, getRentalBySlug,
  getSimilarRentals, kindLabel, quoteBooking, rangesOverlap, recordRentalView, rentalUrl, requestBooking, todayIsoGQ, unitLabel,
  type RentalListing, type RentalTerm,
} from '../../src/lib/rentals';
import { absoluteUrl, formatXaf } from '../../src/lib/shop';
import { useCompany } from '../../src/hooks/use-queries';
import { useAuth } from '../../src/hooks/use-auth';
import { BookingCalendar, type DaySelection } from '../../src/components/rentals/BookingCalendar';
import { RentalCard } from '../../src/components/rentals/RentalCard';
import { RentalReviewsSection } from '../../src/components/rentals/RentalReviewsSection';
import { Rail, Chip } from '../../src/components/ui/Rail';
import { Section } from '../../src/components/ui/Section';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { LoadingState } from '../../src/components/ui/LoadingState';
import { StarRating } from '../../src/components/ui/StarRating';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { KeyboardAware } from '../../src/components/ui/KeyboardAware';

function whatsappHref(value: string, text: string): string {
  const base = value.startsWith('http') ? value : `https://wa.me/${value.replace(/[^\d]/g, '')}`;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
}

export default function RentalDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading } = useQuery({ queryKey: ['rentals', 'listing', slug], queryFn: () => getRentalBySlug(slug), enabled: !!slug });
  const listing = data?.listing;
  const { data: company } = useCompany(listing?.companyId ?? '');
  const similar = useQuery({ queryKey: ['rentals', 'similar', listing?.id], queryFn: () => getSimilarRentals(listing!), enabled: !!listing });
  const [imageIndex, setImageIndex] = useState(0);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (listing && !data?.isPreview) recordRentalView(listing.id);
  }, [listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingState />;
  if (!listing) return <EmptyState title="Anuncio no encontrado" description="Puede que ya no esté disponible." />;

  const isProperty = listing.category === 'property';
  const images = listing.images.map((i) => absoluteUrl(i.url)!).filter(Boolean);
  const branch = company?.branches?.[0];
  const phone = branch?.contact?.phone;
  const whatsapp = company?.contact?.socialMedia?.whatsapp || phone;
  const facts = (isProperty
    ? [
        listing.bedrooms != null && { icon: BedDouble, label: `${listing.bedrooms} habitaciones` },
        listing.bathrooms != null && { icon: Bath, label: `${listing.bathrooms} baños` },
        listing.maxGuests && { icon: Users, label: `Hasta ${listing.maxGuests} personas` },
        listing.areaM2 && { icon: Ruler, label: `${listing.areaM2} m²` },
        listing.furnished != null && { icon: Sofa, label: listing.furnished ? 'Amueblado' : 'Sin amueblar' },
      ]
    : [
        (listing.brand || listing.model) && { icon: Car, label: [listing.brand, listing.model, listing.year].filter(Boolean).join(' ') },
        listing.seats && { icon: Users, label: `${listing.seats} plazas` },
        listing.transmission && { icon: Gauge, label: TRANSMISSION_LABELS[listing.transmission] ?? listing.transmission },
        listing.fuel && { icon: Fuel, label: FUEL_LABELS[listing.fuel] ?? listing.fuel },
        listing.driverOption && { icon: Users, label: DRIVER_OPTION_LABELS[listing.driverOption] },
      ]
  ).filter(Boolean) as { icon: typeof Users; label: string }[];

  const canBook = (listing.shortTermEnabled && !!listing.dailyPrice) || (listing.longTermEnabled && !!listing.monthlyPrice);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['bottom']}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable onPress={() => Share.share({ message: `${listing.title} en Oltinde: ${rentalUrl(listing.slug)}` })} hitSlop={8}>
              <Share2 size={21} color="#1A1C1C" />
            </Pressable>
          ),
        }}
      />
      {booking ? (
        <BookingForm listing={listing} onClose={() => setBooking(false)} />
      ) : (
        <>
          <ScrollView contentContainerClassName="pb-6">
            {data?.isPreview ? (
              <View className="bg-amber-100 px-4 py-2">
                <Text className="text-sm text-amber-900">Vista previa: este anuncio no está publicado.</Text>
              </View>
            ) : null}
            <View style={{ width, height: width * 0.7 }} className="bg-muted">
              {images.length > 0 ? (
                <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
                  {images.map((uri) => <Image key={uri} source={{ uri }} style={{ width, height: width * 0.7 }} contentFit="cover" />)}
                </ScrollView>
              ) : (
                <View className="flex-1 items-center justify-center"><ImageOff size={32} color="#C4C4C4" /></View>
              )}
              {images.length > 1 ? (
                <View className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1">
                  <Text className="text-xs font-semibold text-white">{imageIndex + 1} / {images.length}</Text>
                </View>
              ) : null}
            </View>

            <View className="gap-2 px-4 pt-4">
              <Text className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{kindLabel(listing.category, listing.kind)}</Text>
              <Text className="text-xl font-extrabold leading-7 text-foreground">{listing.title}</Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color="#8A8A8A" />
                <Text className="text-sm text-muted-foreground">{[listing.neighborhood, listing.city].filter(Boolean).join(', ')}</Text>
              </View>
              {listing.ratingCount > 0 ? <StarRating rating={listing.ratingAvg} count={listing.ratingCount} size={13} /> : null}
              <View className="mt-1 gap-1 rounded-lg bg-muted/60 p-3">
                {listing.shortTermEnabled && listing.dailyPrice ? (
                  <Text className="text-lg font-extrabold text-foreground">
                    {formatXaf(listing.dailyPrice)} <Text className="text-sm font-normal text-muted-foreground">/ {unitLabel(listing.category)}</Text>
                  </Text>
                ) : null}
                {listing.longTermEnabled && listing.monthlyPrice ? (
                  <Text className="text-lg font-extrabold text-foreground">
                    {formatXaf(listing.monthlyPrice)} <Text className="text-sm font-normal text-muted-foreground">/ mes</Text>
                  </Text>
                ) : null}
                {listing.deposit ? <Text className="text-xs text-muted-foreground">Fianza: {formatXaf(listing.deposit)}</Text> : null}
                {listing.driverOption && listing.driverOption !== 'none' && listing.driverDailyFee ? (
                  <Text className="text-xs text-muted-foreground">Conductor: {formatXaf(listing.driverDailyFee)} / día</Text>
                ) : null}
                {listing.priceNotes ? <Text className="text-xs text-muted-foreground">{listing.priceNotes}</Text> : null}
              </View>
            </View>

            <View className="flex-row gap-2 px-4 pt-4">
              {whatsapp ? (
                <Pressable
                  onPress={() => Linking.openURL(whatsappHref(whatsapp, `Hola ${listing.companyName}, me interesa este alquiler que vi en Oltinde:\n${listing.title}\n${rentalUrl(listing.slug)}`))}
                  className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg active:opacity-80"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text className="text-base font-semibold text-white">WhatsApp</Text>
                </Pressable>
              ) : null}
              {phone ? (
                <Pressable
                  onPress={() => Linking.openURL(`tel:${phone.replace(/\s/g, '')}`)}
                  className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg border border-border bg-card active:opacity-80"
                >
                  <Phone size={18} color="#1A1C1C" />
                  <Text className="text-base font-semibold text-foreground">Llamar</Text>
                </Pressable>
              ) : null}
            </View>

            {facts.length > 0 ? (
              <View className="mt-4">
                <Section title="Características">
                  <View className="flex-row flex-wrap gap-x-5 gap-y-2.5">
                    {facts.map(({ icon: Icon, label }) => (
                      <View key={label} className="flex-row items-center gap-1.5">
                        <Icon size={16} color="#1A1C1C" />
                        <Text className="text-sm text-foreground">{label}</Text>
                      </View>
                    ))}
                  </View>
                </Section>
              </View>
            ) : null}

            <Section title="Descripción">
              <Text className="text-sm leading-6 text-foreground">{listing.description}</Text>
            </Section>

            {listing.amenities.length > 0 ? (
              <Section title={isProperty ? 'Comodidades' : 'Equipamiento'}>
                <View className="gap-2">
                  {listing.amenities.map((a) => (
                    <View key={a} className="flex-row items-center gap-2">
                      <Check size={15} color="#15803D" />
                      <Text className="text-sm text-foreground">{a}</Text>
                    </View>
                  ))}
                </View>
              </Section>
            ) : null}

            {listing.rules ? (
              <Section title="Condiciones">
                <Text className="text-sm leading-6 text-foreground">{listing.rules}</Text>
              </Section>
            ) : null}

            {!data?.isPreview ? <RentalReviewsSection listingId={listing.id} /> : null}

            <Section title="Anunciante">
              <Pressable onPress={() => router.push(`/companies/${listing.companyId}`)} className="flex-row items-center gap-2">
                <Store size={16} color="#1976D2" />
                <Text className="text-sm font-semibold text-secondary">{listing.companyName}</Text>
              </Pressable>
            </Section>

            {similar.data?.fromCompany.length ? (
              <Rail title={`Más de ${listing.companyName}`}>{similar.data.fromCompany.map((l) => <RentalCard key={l.id} listing={l} />)}</Rail>
            ) : null}
            {similar.data?.similar.length ? (
              <Rail title={`Similares en ${listing.city}`}>{similar.data.similar.map((l) => <RentalCard key={l.id} listing={l} />)}</Rail>
            ) : null}
          </ScrollView>
          {canBook && !data?.isPreview ? (
            <View className="border-t border-border bg-card px-4 py-3">
              <Button onPress={() => setBooking(true)}>Solicitar reserva</Button>
              <Text className="mt-1.5 text-center text-xs text-muted-foreground">Sin pago en la app: la empresa confirma y acuerda el pago con usted.</Text>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

function BookingForm({ listing, onClose }: { listing: RentalListing; onClose: () => void }) {
  const { user } = useAuth();
  const isProperty = listing.category === 'property';
  const today = todayIsoGQ();
  const busy = useQuery({ queryKey: ['rentals', 'availability', listing.id], queryFn: () => getAvailability(listing.id) });

  const [term, setTerm] = useState<RentalTerm>(listing.shortTermEnabled && listing.dailyPrice ? 'short' : 'long');
  const [days, setDays] = useState<DaySelection>({});
  const [months, setMonths] = useState(listing.minMonths || 1);
  const [guests, setGuests] = useState('');
  const [withDriver, setWithDriver] = useState(listing.driverOption === 'required');
  const [name, setName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');

  // Inclusive selection → [startDate, endDate) for the server, as on the web.
  const request = useMemo(() => {
    if (!days.from) return undefined;
    if (term === 'short') return { startDate: days.from, endDate: addDaysIso(days.to ?? days.from, 1) };
    return { startDate: days.from, endDate: addMonthsIso(days.from, months), months };
  }, [term, days, months]);

  const quote = request ? quoteBooking(listing, { term, ...request, withDriver }) : undefined;
  const problem = (() => {
    if (!request || !quote) return undefined;
    if ((busy.data ?? []).some((b) => rangesOverlap(b.start, b.end, request.startDate, request.endDate))) return 'Las fechas elegidas incluyen días no disponibles.';
    if (term === 'short' && quote.units < listing.minUnits) return `Mínimo ${listing.minUnits} ${unitLabel(listing.category, listing.minUnits !== 1)}.`;
    if (term === 'short' && listing.maxUnits && quote.units > listing.maxUnits) return `Máximo ${listing.maxUnits} ${unitLabel(listing.category, true)}.`;
    return undefined;
  })();

  const send = useMutation({
    mutationFn: () =>
      requestBooking({
        listingId: listing.id,
        term,
        ...request!,
        guests: guests ? Number(guests) : undefined,
        withDriver,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        message: message || undefined,
      }),
    onSuccess: (result) => router.replace(`/alquiler/reserva/${result.token}`),
    onError: (e: Error) => {
      Alert.alert('No se pudo enviar la solicitud', e.message);
      if (/disponibles/.test(e.message)) busy.refetch();
    },
  });

  const monthOptions = Array.from({ length: Math.max(1, 24 - (listing.minMonths || 1) + 1) }, (_, i) => (listing.minMonths || 1) + i);
  const ready = !!quote && !problem && name.trim().length >= 2 && phone.trim().length >= 6;

  return (
    <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-2">
          <CalendarCheck size={20} color="#1A1C1C" />
          <Text className="flex-1 text-lg font-bold text-foreground" numberOfLines={1}>Solicitar reserva</Text>
          <Pressable onPress={onClose} hitSlop={8}><Text className="text-sm font-semibold text-secondary">Volver</Text></Pressable>
        </View>
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>{listing.title}</Text>

        {listing.shortTermEnabled && listing.dailyPrice && listing.longTermEnabled && listing.monthlyPrice ? (
          <View className="flex-row gap-2">
            <Chip label={`Por ${unitLabel(listing.category, true)}`} selected={term === 'short'} onPress={() => { setTerm('short'); setDays({}); }} />
            <Chip label="Por meses" selected={term === 'long'} onPress={() => { setTerm('long'); setDays({}); }} />
          </View>
        ) : null}

        {busy.isLoading ? (
          <LoadingState />
        ) : (
          <>
            <Text className="text-sm text-muted-foreground">
              {term === 'long' ? 'Elija el día de entrada.' : isProperty ? 'Marque la primera y la última noche.' : 'Marque el primer y el último día.'}
            </Text>
            <BookingCalendar busy={busy.data ?? []} today={today} mode={term === 'short' ? 'range' : 'single'} value={days} onChange={setDays} />
          </>
        )}

        {term === 'long' ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Duración</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {monthOptions.map((m) => <Chip key={m} label={`${m} ${m === 1 ? 'mes' : 'meses'}`} selected={months === m} onPress={() => setMonths(m)} />)}
            </ScrollView>
          </View>
        ) : null}

        {!isProperty && listing.driverOption === 'optional' ? (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <Text className="flex-1 text-sm text-foreground">
              Con conductor{listing.driverDailyFee ? ` (+${formatXaf(listing.driverDailyFee)} / día)` : ''}
            </Text>
            <Switch value={withDriver} onValueChange={setWithDriver} />
          </View>
        ) : null}

        {request && quote ? (
          <View className="gap-1 rounded-lg bg-muted/60 p-3">
            <Text className="text-sm text-foreground">
              {formatIsoDate(request.startDate)} → {formatIsoDate(request.endDate)}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {quote.units} {term === 'short' ? unitLabel(listing.category, quote.units !== 1) : quote.units === 1 ? 'mes' : 'meses'} × {formatXaf(quote.unitPrice)}
            </Text>
            {quote.driverFee > 0 ? <Text className="text-sm text-muted-foreground">Conductor: {formatXaf(quote.driverFee)}</Text> : null}
            <Text className="text-lg font-extrabold text-foreground">Total: {formatXaf(quote.total)}</Text>
            {quote.deposit > 0 ? <Text className="text-xs text-muted-foreground">+ fianza de {formatXaf(quote.deposit)} (se devuelve)</Text> : null}
            {problem ? <Text className="text-sm font-semibold text-destructive">{problem}</Text> : null}
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Sus datos</Text>
          <TextField label="Nombre" value={name} onChangeText={setName} autoComplete="name" />
          <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+240 222 XXX XXX" />
          <TextField label="Correo (opcional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {isProperty && listing.maxGuests ? (
            <TextField label={`Personas (máx. ${listing.maxGuests})`} value={guests} onChangeText={(t) => setGuests(t.replace(/\D/g, ''))} keyboardType="number-pad" />
          ) : null}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Mensaje para la empresa (opcional)</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder="Hora de llegada, preguntas…"
              placeholderTextColor="#9CA3AF"
              className="min-h-[70px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </View>

        <Button onPress={() => send.mutate()} loading={send.isPending} disabled={!ready}>Enviar solicitud</Button>
        <Text className="text-center text-xs text-muted-foreground">
          La empresa acepta o rechaza su solicitud. Las fechas quedan reservadas mientras tanto. El pago se acuerda directamente con la empresa.
        </Text>
      </ScrollView>
    </KeyboardAware>
  );
}
