// App-facing shapes for the rentals module: properties, vehicles, items
// (chairs, tents, sound, generators...) and spaces (event halls, meeting
// rooms). Advertisers are companies or private people.
// Plain JSON-serializable data, like src/lib/shop/types.ts.

import type { ProductStatus } from '../shop/types';

export type RentalCategory = 'property' | 'vehicle' | 'item' | 'space';
export const RENTAL_CATEGORIES: RentalCategory[] = ['property', 'vehicle', 'item', 'space'];
export type RentalDriverOption = 'none' | 'optional' | 'required';
export type RentalDeliveryOption = 'none' | 'optional' | 'required';
export type RentalStatus = ProductStatus; // draft | active | archived

export const RENTAL_CATEGORY_LABELS: Record<RentalCategory, string> = {
  property: 'Inmueble',
  vehicle: 'Vehículo',
  item: 'Equipos y artículos',
  space: 'Espacio',
};

// Plural headings for tabs and sections.
export const RENTAL_CATEGORY_TITLES: Record<RentalCategory, string> = {
  property: 'Casas y pisos',
  vehicle: 'Coches',
  item: 'Equipos y artículos',
  space: 'Espacios para eventos',
};

export const RENTAL_STATUS_LABELS: Record<RentalStatus, string> = {
  draft: 'Borrador',
  active: 'Publicado',
  archived: 'Archivado',
};

// Subtypes. Stored as the key; the label is for display.
export const PROPERTY_KINDS: Record<string, string> = {
  piso: 'Piso / Apartamento',
  casa: 'Casa',
  villa: 'Villa / Chalet',
  estudio: 'Estudio',
  habitacion: 'Habitación',
  oficina: 'Oficina',
  local: 'Local comercial',
  nave: 'Nave / Almacén',
  terreno: 'Terreno',
};

export const VEHICLE_KINDS: Record<string, string> = {
  coche: 'Coche',
  todoterreno: 'Todoterreno / SUV',
  furgoneta: 'Furgoneta',
  minibus: 'Minibús',
  pickup: 'Pick-up',
  moto: 'Moto',
  camion: 'Camión',
};

export const ITEM_KINDS: Record<string, string> = {
  sillas: 'Sillas',
  mesas: 'Mesas',
  carpas: 'Carpas',
  sonido: 'Equipo de sonido',
  iluminacion: 'Iluminación',
  decoracion: 'Decoración',
  vajilla: 'Vajilla y menaje',
  ropa: 'Trajes y vestidos',
  hinchables: 'Hinchables y juegos',
  generador: 'Generadores',
  maquinaria: 'Maquinaria de obra',
  andamios: 'Andamios',
  herramientas: 'Herramientas',
  proyector: 'Proyectores y pantallas',
  camaras: 'Cámaras y drones',
  informatica: 'Ordenadores e impresoras',
  bicicletas: 'Bicicletas',
  nautica: 'Barcos y kayaks',
  deporte: 'Deporte y playa',
  otro: 'Otros',
};

export const SPACE_KINDS: Record<string, string> = {
  salon: 'Salón de eventos',
  sala: 'Sala de reuniones',
  coworking: 'Oficina por horas / coworking',
  estudio: 'Estudio de foto o grabación',
  jardin: 'Jardín / espacio exterior',
  cancha: 'Cancha deportiva',
  otro: 'Otro espacio',
};

const KINDS: Record<RentalCategory, Record<string, string>> = { property: PROPERTY_KINDS, vehicle: VEHICLE_KINDS, item: ITEM_KINDS, space: SPACE_KINDS };

export function kindsFor(category: RentalCategory): Record<string, string> {
  return KINDS[category] ?? {};
}

// Details asked for each kind of item (stored in listing.specs as text).
export type SpecField = { key: string; label: string; placeholder?: string };
const SPEC = (key: string, label: string, placeholder?: string): SpecField => ({ key, label, placeholder });
export const ITEM_SPEC_FIELDS: Record<string, SpecField[]> = {
  sillas: [SPEC('tipo', 'Tipo', 'Plástico, Tiffany, plegable...'), SPEC('color', 'Color')],
  mesas: [SPEC('tipo', 'Tipo', 'Redonda, rectangular...'), SPEC('medidas', 'Medidas', '1,80 x 0,75 m'), SPEC('plazas', 'Personas por mesa', '8')],
  carpas: [SPEC('medidas', 'Medidas', '10 x 20 m'), SPEC('capacidad', 'Capacidad (personas)', '200')],
  sonido: [SPEC('potencia', 'Potencia', '2.000 W'), SPEC('incluye', 'Incluye', 'Altavoces, mesa de mezclas, 2 micrófonos')],
  iluminacion: [SPEC('incluye', 'Incluye')],
  generador: [SPEC('potencia', 'Potencia', '20 kVA'), SPEC('combustible', 'Combustible', 'Diésel'), SPEC('consumo', 'Consumo', '4 l/h')],
  maquinaria: [SPEC('marca', 'Marca y modelo'), SPEC('capacidad', 'Capacidad')],
  andamios: [SPEC('altura', 'Altura máxima', '6 m'), SPEC('medidas', 'Medidas por módulo')],
  proyector: [SPEC('resolucion', 'Resolución', 'Full HD'), SPEC('pantalla', 'Tamaño de pantalla', '3 x 2 m')],
  camaras: [SPEC('marca', 'Marca y modelo'), SPEC('incluye', 'Incluye')],
  informatica: [SPEC('marca', 'Marca y modelo'), SPEC('caracteristicas', 'Características')],
  ropa: [SPEC('tallas', 'Tallas disponibles'), SPEC('tipo', 'Tipo', 'Traje, vestido de novia...')],
  nautica: [SPEC('capacidad', 'Capacidad (personas)'), SPEC('motor', 'Motor')],
};

export function specFieldsFor(category: RentalCategory, kind: string): SpecField[] {
  if (category !== 'item') return [];
  return ITEM_SPEC_FIELDS[kind] ?? [SPEC('marca', 'Marca y modelo'), SPEC('caracteristicas', 'Características')];
}

export function kindLabel(category: RentalCategory, kind: string): string {
  return kindsFor(category)[kind] ?? kind;
}

export const PROPERTY_AMENITIES = [
  'Aire acondicionado', 'Wifi', 'Agua caliente', 'Generador', 'Depósito de agua', 'Parking',
  'Seguridad 24h', 'Piscina', 'Cocina equipada', 'Lavadora', 'TV', 'Balcón / Terraza',
  'Jardín', 'Ascensor', 'Vistas al mar', 'Admite mascotas',
];

export const VEHICLE_AMENITIES = [
  'Aire acondicionado', 'GPS', '4x4', 'Bluetooth', 'Cámara trasera', 'Asientos para niños',
  'Seguro a todo riesgo', 'Kilometraje ilimitado', 'Entrega a domicilio', 'Recogida en aeropuerto',
];

export const ITEM_AMENITIES = [
  'Montaje incluido', 'Técnico u operario disponible', 'Combustible incluido', 'Limpieza incluida', 'Seguro incluido',
];

export const SPACE_AMENITIES = [
  'Aire acondicionado', 'Wifi', 'Parking', 'Sillas y mesas', 'Equipo de sonido', 'Proyector', 'Escenario',
  'Cocina', 'Baños', 'Generador', 'Seguridad', 'Acceso para sillas de ruedas',
];

export function amenitiesFor(category: RentalCategory): string[] {
  return { property: PROPERTY_AMENITIES, vehicle: VEHICLE_AMENITIES, item: ITEM_AMENITIES, space: SPACE_AMENITIES }[category] ?? [];
}

export const DELIVERY_OPTION_LABELS: Record<RentalDeliveryOption, string> = {
  none: 'Solo recogida',
  optional: 'Recogida o entrega',
  required: 'Siempre con entrega',
};

export const TRANSMISSION_LABELS: Record<string, string> = { manual: 'Manual', automatico: 'Automático' };
export const FUEL_LABELS: Record<string, string> = { gasolina: 'Gasolina', diesel: 'Diésel', hibrido: 'Híbrido', electrico: 'Eléctrico' };
export const DRIVER_OPTION_LABELS: Record<RentalDriverOption, string> = {
  none: 'Sin conductor',
  optional: 'Con o sin conductor',
  required: 'Siempre con conductor',
};

// "noche" for properties, "día" for everything else.
export function unitLabel(category: RentalCategory, plural = false): string {
  if (category === 'property') return plural ? 'noches' : 'noche';
  return plural ? 'días' : 'día';
}

// Private advertisers can have only a few listings published at once.
export const MAX_PRIVATE_ACTIVE_LISTINGS = 5;

export type RentalImage = { id: string; url: string };

export type RentalListing = {
  id: string;
  /** Absent for a private advertiser. */
  companyId?: string;
  /** Private advertiser's user id. */
  ownerId?: string;
  isIndividual: boolean;
  /** The company's name, or the private advertiser's first name. */
  companyName: string;
  slug: string;
  title: string;
  description: string;
  category: RentalCategory;
  kind: string;
  status: RentalStatus;
  city: string;
  neighborhood?: string;
  address?: string;
  lat?: number;
  lng?: number;
  shortTermEnabled: boolean;
  dailyPrice?: number;
  minUnits: number;
  maxUnits?: number;
  longTermEnabled: boolean;
  monthlyPrice?: number;
  minMonths: number;
  deposit?: number;
  priceNotes?: string;
  hourlyEnabled: boolean;
  hourlyPrice?: number;
  minHours: number;
  quantity: number;
  deliveryOption?: RentalDeliveryOption;
  deliveryFee?: number;
  specs: Record<string, string>;
  /** Private advertiser's phone, only for the advertiser's own forms. */
  contactPhone?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaM2?: number;
  maxGuests?: number;
  furnished?: boolean;
  brand?: string;
  model?: string;
  year?: number;
  transmission?: string;
  fuel?: string;
  seats?: number;
  driverOption?: RentalDriverOption;
  driverDailyFee?: number;
  amenities: string[];
  rules?: string;
  images: RentalImage[];
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  viewCount: number;
  bookingCount: number;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type RentalListingInput = Omit<RentalListing,
  'id' | 'companyId' | 'ownerId' | 'isIndividual' | 'companyName' | 'slug' | 'images' | 'isFeatured' | 'ratingAvg' | 'ratingCount'
  | 'viewCount' | 'bookingCount' | 'publishedAt' | 'createdAt' | 'updatedAt'
> & { images: string[] };

type PriceFields = Pick<RentalListing, 'category' | 'shortTermEnabled' | 'dailyPrice' | 'longTermEnabled' | 'monthlyPrice'> & Partial<Pick<RentalListing, 'hourlyEnabled' | 'hourlyPrice'>>;

// Headline price for cards: "X / noche", "X / hora" or "X / mes".
export function headlinePrice(l: PriceFields): { amount: number; unit: string } | undefined {
  if (l.shortTermEnabled && l.dailyPrice) return { amount: l.dailyPrice, unit: unitLabel(l.category) };
  if (l.hourlyEnabled && l.hourlyPrice) return { amount: l.hourlyPrice, unit: 'hora' };
  if (l.longTermEnabled && l.monthlyPrice) return { amount: l.monthlyPrice, unit: 'mes' };
  return undefined;
}

// Every price a listing offers, for "X / noche · Y / hora · Z / mes".
export function allPrices(l: PriceFields): { amount: number; unit: string }[] {
  const out: { amount: number; unit: string }[] = [];
  if (l.shortTermEnabled && l.dailyPrice) out.push({ amount: l.dailyPrice, unit: unitLabel(l.category) });
  if (l.hourlyEnabled && l.hourlyPrice) out.push({ amount: l.hourlyPrice, unit: 'hora' });
  if (l.longTermEnabled && l.monthlyPrice) out.push({ amount: l.monthlyPrice, unit: 'mes' });
  return out;
}

// ---------------------------------------------------------------- public search

export type RentalTermFilter = 'short' | 'long' | 'hourly';
export type RentalSort = 'relevance' | 'newest' | 'price_asc' | 'price_desc';

export const RENTAL_SORT_LABELS: Record<RentalSort, string> = {
  relevance: 'Relevancia',
  newest: 'Más recientes',
  price_asc: 'Precio: menor a mayor',
  price_desc: 'Precio: mayor a menor',
};

export type RentalQuery = {
  category?: RentalCategory;
  kinds?: string[];
  city?: string;
  term?: RentalTermFilter; // which price the price filter/sort applies to
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minGuests?: number; // properties: guests; vehicles: seats
  furnished?: boolean;
  transmission?: string;
  withDriver?: boolean;
  q?: string;
  companyId?: string;
  sort?: RentalSort;
  page?: number;
};

export type RentalListItem = {
  id: string;
  slug: string;
  title: string;
  image?: string;
  category: RentalCategory;
  kind: string;
  city: string;
  neighborhood?: string;
  shortTermEnabled: boolean;
  dailyPrice?: number;
  longTermEnabled: boolean;
  monthlyPrice?: number;
  hourlyEnabled: boolean;
  hourlyPrice?: number;
  quantity: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  seats?: number;
  transmission?: string;
  driverOption?: RentalDriverOption;
  deliveryOption?: RentalDeliveryOption;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  companyId?: string;
  isIndividual: boolean;
  companyName: string;
};

export type RentalSearchResult = {
  items: RentalListItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: { kinds: { kind: string; count: number }[]; cities: { city: string; count: number }[] };
};

// ---------------------------------------------------------------- bookings

export type RentalTerm = 'short' | 'long' | 'hourly';
export type RentalBookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export const BOOKING_STATUS_LABELS: Record<RentalBookingStatus, string> = {
  pending: 'Pendiente de respuesta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
};

// Statuses whose dates are taken on the calendar.
export const HOLDING_STATUSES: RentalBookingStatus[] = ['pending', 'accepted'];

// YYYY-MM-DD, end exclusive. 'partial': every unit is taken for part of the day (free hours may remain).
export type BusyRange = { start: string; end: string; kind: 'booking' | 'block' | 'partial' };

export type RentalBookingEvent = { id: string; status: RentalBookingStatus; note?: string; createdAt: string };

export type RentalBooking = {
  id: string;
  bookingNumber: string;
  accessToken?: string; // only returned to the customer who made it
  listingId?: string;
  companyId?: string;
  /** Private advertiser. */
  ownerId?: string;
  isIndividual: boolean;
  companyName?: string;
  /** Private advertiser's phone: only on the customer's receipt once accepted. */
  advertiserPhone?: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  listingTitle: string;
  listingSlug?: string;
  listingImage?: string;
  category: RentalCategory;
  term: RentalTerm;
  startDate: string;
  endDate: string;
  units: number;
  quantity: number;
  startHour?: number;
  endHour?: number;
  guests?: number;
  withDriver: boolean;
  withDelivery: boolean;
  deliveryAddress?: string;
  unitPrice: number;
  driverFee: number;
  deliveryFee: number;
  subtotal: number;
  deposit: number;
  total: number;
  commissionPercent: number;
  commissionAmount: number;
  message?: string;
  status: RentalBookingStatus;
  ownerNote?: string;
  /** Reason given by the customer when they cancelled. */
  cancelReason?: string;
  events: RentalBookingEvent[];
  createdAt: string;
};

export type BookingRequestInput = {
  listingId: string;
  term: RentalTerm;
  startDate: string; // YYYY-MM-DD
  endDate?: string; // short term: exclusive end (check-out / return day)
  months?: number; // long term
  startHour?: number; // hourly: on startDate, 0..23
  endHour?: number; // hourly: exclusive, 1..24
  quantity?: number; // identical units (default 1)
  guests?: number;
  withDriver?: boolean;
  withDelivery?: boolean;
  deliveryAddress?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message?: string;
};

// ---- calendar-date helpers (dates as YYYY-MM-DD, compared in UTC)

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function parseIsoDate(s: string): Date {
  return new Date(`${s}T00:00:00.000Z`);
}

export function addDaysIso(s: string, days: number): string {
  const d = parseIsoDate(s);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDate(d);
}

export function addMonthsIso(s: string, months: number): string {
  const d = parseIsoDate(s);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return isoDate(d);
}

export function daysBetween(start: string, end: string): number {
  return Math.round((parseIsoDate(end).getTime() - parseIsoDate(start).getTime()) / 86400000);
}

// Half-open ranges [aStart, aEnd) and [bStart, bEnd).
export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Today's calendar date in Guinea Ecuatorial (UTC+1, no DST).
export function todayIsoGQ(): string {
  return isoDate(new Date(Date.now() + 3600000));
}

export type BookingQuote = {
  units: number; quantity: number; unitPrice: number; driverFee: number; deliveryFee: number; withDelivery: boolean;
  subtotal: number; deposit: number; total: number; endDate: string;
};

export function deliveryChosen(l: { deliveryOption?: RentalDeliveryOption }, wanted?: boolean): boolean {
  return l.deliveryOption === 'required' || (l.deliveryOption === 'optional' && !!wanted);
}

// Price for a request — the same function the server uses to set the price,
// so what the customer sees is what gets saved. Prices are per unit, times
// the quantity (200 chairs); delivery is one flat fee per booking; the
// deposit (per unit) is shown apart.
export function quoteBooking(
  l: Pick<RentalListing, 'category' | 'dailyPrice' | 'monthlyPrice' | 'deposit' | 'driverOption' | 'driverDailyFee'>
    & Partial<Pick<RentalListing, 'hourlyPrice' | 'deliveryOption' | 'deliveryFee'>>,
  req: { term: RentalTerm; startDate: string; endDate?: string; months?: number; startHour?: number; endHour?: number; quantity?: number; withDriver?: boolean; withDelivery?: boolean },
): BookingQuote | undefined {
  const quantity = Math.max(1, Math.floor(req.quantity ?? 1));
  const deposit = (l.deposit ?? 0) * quantity;
  const withDelivery = deliveryChosen(l, req.withDelivery);
  const deliveryFee = withDelivery ? (l.deliveryFee ?? 0) : 0;
  if (req.term === 'short') {
    if (!req.endDate || !l.dailyPrice) return undefined;
    const units = daysBetween(req.startDate, req.endDate);
    if (units < 1) return undefined;
    const withDriver = l.category === 'vehicle' && (l.driverOption === 'required' || (l.driverOption === 'optional' && !!req.withDriver));
    const driverFee = withDriver ? (l.driverDailyFee ?? 0) * units : 0;
    const subtotal = l.dailyPrice * units * quantity + driverFee + deliveryFee;
    return { units, quantity, unitPrice: l.dailyPrice, driverFee, deliveryFee, withDelivery, subtotal, deposit, total: subtotal, endDate: req.endDate };
  }
  if (req.term === 'hourly') {
    if (!l.hourlyPrice || req.startHour === undefined || req.endHour === undefined) return undefined;
    if (req.startHour < 0 || req.endHour > 24) return undefined;
    const units = req.endHour - req.startHour;
    if (units < 1) return undefined;
    const subtotal = l.hourlyPrice * units * quantity + deliveryFee;
    return { units, quantity, unitPrice: l.hourlyPrice, driverFee: 0, deliveryFee, withDelivery, subtotal, deposit, total: subtotal, endDate: addDaysIso(req.startDate, 1) };
  }
  if (!req.months || !l.monthlyPrice) return undefined;
  const subtotal = l.monthlyPrice * req.months * quantity + deliveryFee;
  return { units: req.months, quantity, unitPrice: l.monthlyPrice, driverFee: 0, deliveryFee, withDelivery, subtotal, deposit, total: subtotal, endDate: addMonthsIso(req.startDate, req.months) };
}

// "14:00"
export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

// ---------------------------------------------------------------- reviews & stats

export type RentalReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
  replyText?: string;
  replyDate?: string;
};

export type RentalReviewsData = {
  reviews: RentalReview[];
  count: number;
  average: number;
  distribution: number[]; // index 0 = 1 star ... index 4 = 5 stars
};

export type RentalReviewEligibility = {
  canReview: boolean;
  reason?: 'signin' | 'not_stayed';
  existing?: { rating: number; comment: string };
};

export type RentalStats = {
  days: number;
  views: number; // all-time views of the company's listings
  requests: number; // booking requests received in the period
  accepted: number; // of those, accepted or completed
  rejected: number;
  cancelled: number;
  pending: number; // waiting for an answer now (any date)
  acceptanceRate: number; // 0..1 among answered requests in the period
  unitsBooked: number; // nights/days (short term) of accepted requests in the period
  hoursBooked: number; // hours (hourly) of accepted requests in the period
  monthsBooked: number; // months (long term) of accepted requests in the period
  revenue: number; // total of accepted + completed requests in the period
  commission: number;
  daily: { date: string; requests: number; accepted: number }[];
  topListings: { listingId?: string; title: string; slug?: string; requests: number; accepted: number; revenue: number; views: number }[];
  upcoming: { id: string; bookingNumber: string; listingTitle: string; customerName: string; startDate: string; endDate: string }[];
};
