import { useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, Switch, Text, TextInput, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Bath, BedDouble, CalendarCheck, Car, Check, Clock, Fuel, Gauge, ImageOff, Info, MapPin, MessageCircle, Package, Phone, Ruler, Share2, Sofa, Store, Truck, UserRound, Users } from 'lucide-react-native';
import {
  DELIVERY_OPTION_LABELS, DRIVER_OPTION_LABELS, FUEL_LABELS, TRANSMISSION_LABELS, addDaysIso, addMonthsIso, formatIsoDate, getAvailability, getHourAvailability, getRentalBySlug,
  getSimilarRentals, hourLabel, kindLabel, quoteBooking, rangesOverlap, recordRentalView, rentalUrl, requestBooking, specFieldsFor, todayIsoGQ, unitLabel,
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
import { openExternal } from '../../src/lib/links';

function whatsappHref(value: string, text: string): string {
  const base = value.startsWith('http') ? value : `https://wa.me/${value.replace(/[^\d]/g, '')}`;
  return `${base}${base.includes('?') ? '&' : '?'}text=${encodeURIComponent(text)}`;
}

export default function RentalDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { width } = useWindowDimensions();
  const { data, isLoading } = useQuery({ queryKey: ['rentals', 'listing', slug], queryFn: () => getRentalBySlug(slug), enabled: !!slug });
  const listing = data?.listing;
  const { data: company } = useCompany(listing?.companyId ?? ''); // none for a private advertiser
  const similar = useQuery({ queryKey: ['rentals', 'similar', listing?.id], queryFn: () => getSimilarRentals(listing!), enabled: !!listing });
  const [imageIndex, setImageIndex] = useState(0);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (listing && !data?.isPreview) recordRentalView(listing.id);
  }, [listing?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) return <LoadingState />;
  if (!listing) return <EmptyState back title="Anuncio no encontrado" description="Puede que ya no esté disponible." />;

  const isProperty = listing.category === 'property';
  const images = listing.images.map((i) => absoluteUrl(i.url)!).filter(Boolean);
  const branch = company?.branches?.[0];
  const phone = branch?.contact?.phone;
  const whatsapp = company?.contact?.socialMedia?.whatsapp || phone;
  const isItem = listing.category === 'item';
  const isSpace = listing.category === 'space';
  const facts = (isItem
    ? [
        listing.quantity > 1 && { icon: Package, label: `${listing.quantity} unidades` },
        ...specFieldsFor(listing.category, listing.kind).map((field) => !!listing.specs?.[field.key] && { icon: Info, label: `${field.label}: ${listing.specs[field.key]}` }),
        listing.deliveryOption && { icon: Truck, label: DELIVERY_OPTION_LABELS[listing.deliveryOption] },
      ]
    : isSpace
    ? [
        listing.maxGuests && { icon: Users, label: `Hasta ${listing.maxGuests} personas` },
        listing.areaM2 && { icon: Ruler, label: `${listing.areaM2} m²` },
        listing.hourlyEnabled && { icon: Clock, label: `Por horas: mínimo ${listing.minHours} ${listing.minHours === 1 ? 'hora' : 'horas'}` },
      ]
    : isProperty
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

  const canBook = (listing.shortTermEnabled && !!listing.dailyPrice) || (listing.hourlyEnabled && !!listing.hourlyPrice) || (listing.longTermEnabled && !!listing.monthlyPrice);

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
              <Text className="text-xs font-semibold text-muted-foreground">{kindLabel(listing.category, listing.kind)}</Text>
              <Text className="text-xl font-semibold leading-7 text-foreground">{listing.title}</Text>
              <View className="flex-row items-center gap-1">
                <MapPin size={14} color="#8A8A8A" />
                <Text className="text-sm text-muted-foreground">{[listing.neighborhood, listing.city].filter(Boolean).join(', ')}</Text>
              </View>
              {listing.ratingCount > 0 ? <StarRating rating={listing.ratingAvg} count={listing.ratingCount} size={13} /> : null}
              <View className="mt-1 gap-1 rounded-lg bg-muted/60 p-3">
                {listing.shortTermEnabled && listing.dailyPrice ? (
                  <Text className="text-lg font-semibold text-foreground">
                    {formatXaf(listing.dailyPrice)} <Text className="text-sm font-normal text-muted-foreground">/ {unitLabel(listing.category)}</Text>
                  </Text>
                ) : null}
                {listing.hourlyEnabled && listing.hourlyPrice ? (
                  <Text className="text-lg font-semibold text-foreground">
                    {formatXaf(listing.hourlyPrice)} <Text className="text-sm font-normal text-muted-foreground">/ hora</Text>
                  </Text>
                ) : null}
                {listing.longTermEnabled && listing.monthlyPrice ? (
                  <Text className="text-lg font-semibold text-foreground">
                    {formatXaf(listing.monthlyPrice)} <Text className="text-sm font-normal text-muted-foreground">/ mes</Text>
                  </Text>
                ) : null}
                {isItem && listing.quantity > 1 ? <Text className="text-xs text-muted-foreground">Precios por unidad · {listing.quantity} disponibles</Text> : null}
                {isItem && listing.deliveryOption && listing.deliveryOption !== 'none' ? (
                  <Text className="text-xs text-muted-foreground">Entrega y montaje: {listing.deliveryFee ? formatXaf(listing.deliveryFee) : 'gratis'}</Text>
                ) : null}
                {listing.deposit ? <Text className="text-xs text-muted-foreground">Fianza{isItem && listing.quantity > 1 ? ' por unidad' : ''}: {formatXaf(listing.deposit)}</Text> : null}
                {listing.driverOption && listing.driverOption !== 'none' && listing.driverDailyFee ? (
                  <Text className="text-xs text-muted-foreground">Conductor: {formatXaf(listing.driverDailyFee)} / día</Text>
                ) : null}
                {listing.priceNotes ? <Text className="text-xs text-muted-foreground">{listing.priceNotes}</Text> : null}
              </View>
            </View>

            {listing.isIndividual ? (
              <Text className="px-4 pt-4 text-xs text-muted-foreground">Anuncio de un particular. Envíe una solicitud de reserva: cuando la acepte, verá su teléfono para organizar la entrega.</Text>
            ) : null}
            <View className="flex-row gap-2 px-4 pt-4">
              {!listing.isIndividual && whatsapp ? (
                <Pressable
                  onPress={() => openExternal(whatsappHref(whatsapp, `Hola ${listing.companyName}, me interesa este alquiler que vi en Oltinde:\n${listing.title}\n${rentalUrl(listing.slug)}`))}
                  className="h-12 flex-1 flex-row items-center justify-center gap-2 rounded-lg active:opacity-80"
                  style={{ backgroundColor: '#25D366' }}
                >
                  <MessageCircle size={18} color="#fff" />
                  <Text className="text-base font-semibold text-white">WhatsApp</Text>
                </Pressable>
              ) : null}
              {!listing.isIndividual && phone ? (
                <Pressable
                  onPress={() => openExternal(`tel:${phone.replace(/\s/g, '')}`)}
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
              <Section title={isProperty ? 'Comodidades' : isItem ? 'Qué incluye' : 'Equipamiento'}>
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
              {listing.companyId ? (
                <Pressable onPress={() => router.push(`/companies/${listing.companyId}`)} className="flex-row items-center gap-2">
                  <Store size={16} color="#1976D2" />
                  <Text className="text-sm font-semibold text-secondary">{listing.companyName}</Text>
                </Pressable>
              ) : (
                <View className="flex-row items-center gap-2">
                  <UserRound size={16} color="#1A1C1C" />
                  <Text className="text-sm font-semibold text-foreground">{listing.companyName}</Text>
                </View>
              )}
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
              <Text className="mt-1.5 text-center text-xs text-muted-foreground">Sin pago en la app: el anunciante confirma y acuerda el pago con usted.</Text>
            </View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}

const currentHourGQ = () => new Date(Date.now() + 3600000).getUTCHours();

function BookingForm({ listing, onClose }: { listing: RentalListing; onClose: () => void }) {
  const { user } = useAuth();
  const isProperty = listing.category === 'property';
  const isItem = listing.category === 'item';
  const today = todayIsoGQ();
  const busy = useQuery({ queryKey: ['rentals', 'availability', listing.id], queryFn: () => getAvailability(listing.id) });

  const terms = ([['short', listing.shortTermEnabled && !!listing.dailyPrice], ['hourly', listing.hourlyEnabled && !!listing.hourlyPrice], ['long', listing.longTermEnabled && !!listing.monthlyPrice]] as [RentalTerm, boolean][])
    .filter(([, on]) => on).map(([t]) => t);
  const [term, setTerm] = useState<RentalTerm>(terms[0] ?? 'short');
  const [days, setDays] = useState<DaySelection>({});
  const [months, setMonths] = useState(listing.minMonths || 1);
  const [startHour, setStartHour] = useState<number | undefined>();
  const [endHour, setEndHour] = useState<number | undefined>();
  const [quantity, setQuantity] = useState('1');
  const [guests, setGuests] = useState('');
  const [withDriver, setWithDriver] = useState(listing.driverOption === 'required');
  const [withDelivery, setWithDelivery] = useState(listing.deliveryOption === 'required');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [name, setName] = useState(user?.displayName ?? '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email ?? '');
  const [message, setMessage] = useState('');

  const qty = isItem ? Math.max(1, Math.min(listing.quantity, Math.floor(Number(quantity) || 1))) : 1;
  // By the hour only days with no free hour at all are closed.
  const calendarBusy = useMemo(() => (busy.data ?? []).filter((b) => term !== 'hourly' || b.kind !== 'partial'), [busy.data, term]);

  const day = term === 'hourly' ? days.from : undefined;
  const hours = useQuery({ queryKey: ['rentals', 'hours', listing.id, day], queryFn: () => getHourAvailability(listing.id, day!), enabled: !!day });
  const hourFree = (h: number) => !!hours.data && hours.data[h] >= qty && !(day === today && h <= currentHourGQ());
  const startOptions = Array.from({ length: 24 }, (_, h) => h).filter(hourFree);
  const endOptions = useMemo(() => {
    if (startHour === undefined) return [];
    const out: number[] = [];
    for (let h = startHour; h < 24 && hourFree(h); h++) out.push(h + 1);
    return out.filter((e) => e - startHour >= listing.minHours);
  }, [startHour, hours.data, qty]); // eslint-disable-line react-hooks/exhaustive-deps

  // Inclusive selection → [startDate, endDate) for the server, as on the web.
  const request = useMemo(() => {
    if (!days.from) return undefined;
    if (term === 'short') return { startDate: days.from, endDate: addDaysIso(days.to ?? days.from, 1) };
    if (term === 'hourly') {
      if (startHour === undefined || endHour === undefined) return undefined;
      return { startDate: days.from, endDate: addDaysIso(days.from, 1), startHour, endHour };
    }
    return { startDate: days.from, endDate: addMonthsIso(days.from, months), months };
  }, [term, days, months, startHour, endHour]);

  const quote = request ? quoteBooking(listing, { term, ...request, quantity: qty, withDriver, withDelivery }) : undefined;
  const problem = (() => {
    if (!request || !quote) return undefined;
    if (term !== 'hourly' && calendarBusy.some((b) => rangesOverlap(b.start, b.end, request.startDate, request.endDate))) return 'Las fechas elegidas incluyen días no disponibles.';
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
        quantity: qty,
        guests: guests ? Number(guests) : undefined,
        withDriver,
        withDelivery,
        deliveryAddress: withDelivery ? deliveryAddress : undefined,
        customerName: name,
        customerPhone: phone,
        customerEmail: email || undefined,
        message: message || undefined,
      }),
    onSuccess: (result) => router.replace(`/alquiler/reserva/${result.token}`),
    onError: (e: Error) => {
      Alert.alert('No se pudo enviar la solicitud', e.message);
      if (/disponibles|quedan/.test(e.message)) { busy.refetch(); hours.refetch(); }
    },
  });

  const monthOptions = Array.from({ length: Math.max(1, 24 - (listing.minMonths || 1) + 1) }, (_, i) => (listing.minMonths || 1) + i);
  const capacity = isProperty || listing.category === 'space' ? listing.maxGuests : undefined;
  const ready = !!quote && !problem && name.trim().length >= 2 && phone.trim().length >= 6 && (!withDelivery || deliveryAddress.trim().length >= 5);
  const pickDays = (d: DaySelection) => { setDays(d); setStartHour(undefined); setEndHour(undefined); };

  return (
    <KeyboardAware className="flex-1">
      <ScrollView contentContainerClassName="gap-4 p-4 pb-8" keyboardShouldPersistTaps="handled">
        <View className="flex-row items-center gap-2">
          <CalendarCheck size={20} color="#1A1C1C" />
          <Text className="flex-1 text-lg font-semibold text-foreground" numberOfLines={1}>Solicitar reserva</Text>
          <Pressable onPress={onClose} hitSlop={8}><Text className="text-sm font-semibold text-secondary">Volver</Text></Pressable>
        </View>
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>{listing.title}</Text>

        {terms.length > 1 ? (
          <View className="flex-row flex-wrap gap-2">
            {terms.map((t) => (
              <Chip key={t} label={t === 'short' ? `Por ${unitLabel(listing.category, true)}` : t === 'hourly' ? 'Por horas' : 'Por meses'} selected={term === t} onPress={() => { setTerm(t); pickDays({}); }} />
            ))}
          </View>
        ) : null}

        {isItem && listing.quantity > 1 ? (
          <TextField label={`Cantidad (hasta ${listing.quantity})`} value={quantity} onChangeText={(t) => setQuantity(t.replace(/\D/g, ''))} keyboardType="number-pad" />
        ) : null}

        {busy.isLoading ? (
          <LoadingState />
        ) : (
          <>
            <Text className="text-sm text-muted-foreground">
              {term === 'long' ? 'Elija el día de inicio.' : term === 'hourly' ? 'Elija el día.' : isProperty ? 'Marque la primera y la última noche.' : 'Marque el primer y el último día.'}
            </Text>
            <BookingCalendar busy={calendarBusy} today={today} mode={term === 'short' ? 'range' : 'single'} value={days} onChange={pickDays} />
          </>
        )}

        {term === 'hourly' && day ? (
          hours.isLoading ? <LoadingState /> : startOptions.length === 0 ? (
            <Text className="text-sm font-semibold text-destructive">No quedan horas libres ese día.</Text>
          ) : (
            <View className="gap-2">
              <Text className="text-sm font-semibold text-foreground">Desde</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                {startOptions.map((h) => <Chip key={h} label={hourLabel(h)} selected={startHour === h} onPress={() => { setStartHour(h); setEndHour(undefined); }} />)}
              </ScrollView>
              {startHour !== undefined ? (
                <>
                  <Text className="text-sm font-semibold text-foreground">Hasta</Text>
                  {endOptions.length === 0 ? (
                    <Text className="text-xs text-destructive">Mínimo {listing.minHours} horas seguidas libres desde esa hora.</Text>
                  ) : (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
                      {endOptions.map((h) => <Chip key={h} label={hourLabel(h)} selected={endHour === h} onPress={() => setEndHour(h)} />)}
                    </ScrollView>
                  )}
                </>
              ) : null}
            </View>
          )
        ) : null}

        {term === 'long' ? (
          <View className="gap-2">
            <Text className="text-sm font-semibold text-foreground">Duración</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {monthOptions.map((m) => <Chip key={m} label={`${m} ${m === 1 ? 'mes' : 'meses'}`} selected={months === m} onPress={() => setMonths(m)} />)}
            </ScrollView>
          </View>
        ) : null}

        {listing.category === 'vehicle' && listing.driverOption === 'optional' ? (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <Text className="flex-1 text-sm text-foreground">
              Con conductor{listing.driverDailyFee ? ` (+${formatXaf(listing.driverDailyFee)} / día)` : ''}
            </Text>
            <Switch value={withDriver} onValueChange={setWithDriver} />
          </View>
        ) : null}
        {isItem && listing.deliveryOption === 'optional' ? (
          <View className="flex-row items-center justify-between rounded-lg border border-border bg-card px-3 py-2.5">
            <Text className="flex-1 text-sm text-foreground">
              Con entrega y montaje{listing.deliveryFee ? ` (+${formatXaf(listing.deliveryFee)})` : ' (gratis)'}
            </Text>
            <Switch value={withDelivery} onValueChange={setWithDelivery} />
          </View>
        ) : null}

        {request && quote ? (
          <View className="gap-1 rounded-lg bg-muted/60 p-3">
            <Text className="text-sm text-foreground">
              {term === 'hourly' ? `${formatIsoDate(request.startDate)}, ${hourLabel(request.startHour!)}–${hourLabel(request.endHour!)}` : `${formatIsoDate(request.startDate)} → ${formatIsoDate(quote.endDate)}`}
            </Text>
            <Text className="text-sm text-muted-foreground">
              {quote.units} {term === 'short' ? unitLabel(listing.category, quote.units !== 1) : term === 'hourly' ? (quote.units === 1 ? 'hora' : 'horas') : quote.units === 1 ? 'mes' : 'meses'} × {formatXaf(quote.unitPrice)}{quote.quantity > 1 ? ` × ${quote.quantity} unidades` : ''}
            </Text>
            {quote.driverFee > 0 ? <Text className="text-sm text-muted-foreground">Conductor: {formatXaf(quote.driverFee)}</Text> : null}
            {quote.withDelivery ? <Text className="text-sm text-muted-foreground">Entrega y montaje: {quote.deliveryFee ? formatXaf(quote.deliveryFee) : 'gratis'}</Text> : null}
            <Text className="text-lg font-semibold text-foreground">Total: {formatXaf(quote.total)}</Text>
            {quote.deposit > 0 ? <Text className="text-xs text-muted-foreground">+ fianza de {formatXaf(quote.deposit)} (se devuelve)</Text> : null}
            {problem ? <Text className="text-sm font-semibold text-destructive">{problem}</Text> : null}
          </View>
        ) : null}

        <View className="gap-3">
          <Text className="text-lg font-semibold text-foreground">Sus datos</Text>
          <TextField label="Nombre" value={name} onChangeText={setName} autoComplete="name" />
          <TextField label="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" autoComplete="tel" placeholder="+240 222 XXX XXX" />
          <TextField label="Correo (opcional)" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          {withDelivery ? (
            <TextField label="Dirección de entrega" value={deliveryAddress} onChangeText={setDeliveryAddress} placeholder="Barrio, calle, referencia" maxLength={512} />
          ) : null}
          {capacity ? (
            <TextField label={`Personas (máx. ${capacity})`} value={guests} onChangeText={(t) => setGuests(t.replace(/\D/g, ''))} keyboardType="number-pad" />
          ) : null}
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">Mensaje para el anunciante (opcional)</Text>
            <TextInput
              value={message}
              onChangeText={setMessage}
              multiline
              placeholder={listing.category === 'space' ? 'Tipo de evento, número de invitados…' : 'Hora de llegada, preguntas…'}
              placeholderTextColor="#9CA3AF"
              className="min-h-[70px] rounded-lg border border-input bg-card p-3 text-sm text-foreground"
              style={{ textAlignVertical: 'top' }}
            />
          </View>
        </View>

        <Button onPress={() => send.mutate()} loading={send.isPending} disabled={!ready}>Enviar solicitud</Button>
        <Text className="text-center text-xs text-muted-foreground">
          El anunciante acepta o rechaza su solicitud. {term === 'hourly' ? 'Las horas' : 'Las fechas'} quedan reservadas mientras tanto. El pago se acuerda directamente con él.
        </Text>
      </ScrollView>
    </KeyboardAware>
  );
}
