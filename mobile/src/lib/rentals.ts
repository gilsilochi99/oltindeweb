// Alquileres (houses, vehicles, items such as chairs or generators, and
// spaces such as event halls; by companies or private people) for the app. Types and helpers mirror the
// web app's src/lib/rentals/types.ts; calls go through /api/mobile/rpc to the
// same server functions the website uses (the server recomputes every price
// with the same quoteBooking, so what the customer sees is what is saved).
import { rpc, rpcAction } from './api';
import { WEB_APP_URL } from './config';

export type RentalCategory = 'property' | 'vehicle' | 'item' | 'space';
export const RENTAL_CATEGORIES: RentalCategory[] = ['property', 'vehicle', 'item', 'space'];
export type RentalDriverOption = 'none' | 'optional' | 'required';
export type RentalDeliveryOption = 'none' | 'optional' | 'required';

export const RENTAL_CATEGORY_LABELS: Record<RentalCategory, string> = {
  property: 'Casas y pisos',
  vehicle: 'Vehículos',
  item: 'Equipos y artículos',
  space: 'Espacios',
};

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

// Details asked for each kind of item (same list as the website).
export type SpecField = { key: string; label: string; placeholder?: string };
const SPEC = (key: string, label: string, placeholder?: string): SpecField => ({ key, label, placeholder });
const ITEM_SPEC_FIELDS: Record<string, SpecField[]> = {
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

export const DELIVERY_OPTION_LABELS: Record<RentalDeliveryOption, string> = {
  none: 'Solo recogida',
  optional: 'Recogida o entrega',
  required: 'Siempre con entrega',
};

export function kindLabel(category: RentalCategory, kind: string): string {
  return kindsFor(category)[kind] ?? kind;
}

export const TRANSMISSION_LABELS: Record<string, string> = { manual: 'Manual', automatico: 'Automático' };
export const FUEL_LABELS: Record<string, string> = { gasolina: 'Gasolina', diesel: 'Diésel', hibrido: 'Híbrido', electrico: 'Eléctrico' };
export const DRIVER_OPTION_LABELS: Record<RentalDriverOption, string> = {
  none: 'Sin conductor',
  optional: 'Con o sin conductor',
  required: 'Siempre con conductor',
};

export function unitLabel(category: RentalCategory, plural = false): string {
  if (category === 'property') return plural ? 'noches' : 'noche';
  return plural ? 'días' : 'día';
}

export type RentalListing = {
  id: string;
  /** Absent for a private advertiser. */
  companyId?: string;
  ownerId?: string;
  isIndividual: boolean;
  /** Company name, or the private advertiser's first name. */
  companyName: string;
  slug: string;
  title: string;
  description: string;
  category: RentalCategory;
  kind: string;
  status: 'draft' | 'active' | 'archived';
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
  images: { id: string; url: string }[];
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
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
  hourlyEnabled?: boolean;
  hourlyPrice?: number;
  quantity?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  seats?: number;
  transmission?: string;
  driverOption?: RentalDriverOption;
  deliveryOption?: RentalDeliveryOption;
  isFeatured: boolean;
  companyId?: string;
  isIndividual?: boolean;
  companyName: string;
};

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
  term?: 'short' | 'long' | 'hourly';
  q?: string;
  companyId?: string;
  sort?: RentalSort;
  page?: number;
};

export type RentalSearchResult = {
  items: RentalListItem[];
  total: number;
  page: number;
  pageCount: number;
  facets: { kinds: { kind: string; count: number }[]; cities: { city: string; count: number }[] };
};

export type RentalsHome = {
  featured: RentalListItem[];
  properties: RentalListItem[];
  vehicles: RentalListItem[];
  items?: RentalListItem[];
  spaces?: RentalListItem[];
  total: number;
  kindCounts: { category: RentalCategory; kind: string; count: number }[];
  cityCounts: { city: string; count: number }[];
};

export type RentalTerm = 'short' | 'long' | 'hourly';
export type RentalBookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export const BOOKING_STATUS_LABELS: Record<RentalBookingStatus, string> = {
  pending: 'Pendiente de respuesta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
};

// 'partial': every unit is taken for part of the day (free hours may remain).
export type BusyRange = { start: string; end: string; kind: 'booking' | 'block' | 'partial' };

export type RentalBooking = {
  id: string;
  bookingNumber: string;
  accessToken?: string;
  listingId?: string;
  companyId?: string;
  ownerId?: string;
  isIndividual?: boolean;
  companyName?: string;
  /** Private advertiser's phone: on the customer's booking once accepted. */
  advertiserPhone?: string;
  customerName: string;
  customerPhone: string;
  listingTitle: string;
  listingSlug?: string;
  listingImage?: string;
  category: RentalCategory;
  term: RentalTerm;
  startDate: string;
  endDate: string;
  units: number;
  quantity?: number;
  startHour?: number;
  endHour?: number;
  guests?: number;
  withDriver: boolean;
  withDelivery?: boolean;
  deliveryAddress?: string;
  unitPrice: number;
  driverFee: number;
  deliveryFee?: number;
  subtotal: number;
  deposit: number;
  total: number;
  message?: string;
  status: RentalBookingStatus;
  ownerNote?: string;
  cancelReason?: string;
  events: { id: string; status: RentalBookingStatus; note?: string; createdAt: string }[];
  createdAt: string;
};

export type BookingRequestInput = {
  listingId: string;
  term: RentalTerm;
  startDate: string;
  endDate?: string;
  months?: number;
  startHour?: number;
  endHour?: number;
  quantity?: number;
  guests?: number;
  withDriver?: boolean;
  withDelivery?: boolean;
  deliveryAddress?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message?: string;
};

// ---------------------------------------------------------------- helpers

type PriceFields = Pick<RentalListItem, 'category' | 'shortTermEnabled' | 'dailyPrice' | 'longTermEnabled' | 'monthlyPrice' | 'hourlyEnabled' | 'hourlyPrice'>;

export function headlinePrice(l: PriceFields): { amount: number; unit: string } | undefined {
  return allPrices(l)[0];
}

// Every price a listing offers: per night/day, per hour, per month.
export function allPrices(l: PriceFields): { amount: number; unit: string }[] {
  const out: { amount: number; unit: string }[] = [];
  if (l.shortTermEnabled && l.dailyPrice) out.push({ amount: l.dailyPrice, unit: unitLabel(l.category) });
  if (l.hourlyEnabled && l.hourlyPrice) out.push({ amount: l.hourlyPrice, unit: 'hora' });
  if (l.longTermEnabled && l.monthlyPrice) out.push({ amount: l.monthlyPrice, unit: 'mes' });
  return out;
}

// "14:00"
export const hourLabel = (h: number) => `${String(h).padStart(2, '0')}:00`;

export function bookingDurationLabel(b: Pick<RentalBooking, 'term' | 'units' | 'category'>): string {
  if (b.term === 'long') return `${b.units} ${b.units === 1 ? 'mes' : 'meses'}`;
  if (b.term === 'hourly') return `${b.units} ${b.units === 1 ? 'hora' : 'horas'}`;
  return `${b.units} ${unitLabel(b.category, b.units !== 1)}`;
}

// "12 oct 2026 → 15 oct 2026" or "12 oct 2026, 10:00–14:00"
export function bookingWhenLabel(b: Pick<RentalBooking, 'startDate' | 'endDate' | 'startHour' | 'endHour'>): string {
  if (b.startHour !== undefined && b.endHour !== undefined) return `${formatIsoDate(b.startDate)}, ${hourLabel(b.startHour)}–${hourLabel(b.endHour)}`;
  return `${formatIsoDate(b.startDate)} → ${formatIsoDate(b.endDate)}`;
}

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

export function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && bStart < aEnd;
}

// Today's calendar date in Guinea Ecuatorial (UTC+1, no DST).
export function todayIsoGQ(): string {
  return isoDate(new Date(Date.now() + 3600000));
}

// "12 oct 2026"
export function formatIsoDate(s: string): string {
  return parseIsoDate(s).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export type BookingQuote = {
  units: number; quantity: number; unitPrice: number; driverFee: number; deliveryFee: number; withDelivery: boolean;
  subtotal: number; deposit: number; total: number; endDate: string;
};

export function deliveryChosen(l: { deliveryOption?: RentalDeliveryOption }, wanted?: boolean): boolean {
  return l.deliveryOption === 'required' || (l.deliveryOption === 'optional' && !!wanted);
}

// Same price rule as the server (src/lib/rentals/types.ts on the web).
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

export const rentalUrl = (slug: string) => `${WEB_APP_URL}/alquiler/${slug}`;

// ---------------------------------------------------------------- server calls

export const getRentalsHome = () => rpc<RentalsHome>('getRentalsHome');
export const searchRentals = (query: RentalQuery) => rpc<RentalSearchResult>('searchRentals', query);
export const getRentalBySlug = (slug: string) =>
  rpc<{ listing: RentalListing; isPreview: boolean } | null>('getRentalBySlug', slug);
export const getSimilarRentals = (l: Pick<RentalListing, 'id' | 'category' | 'city' | 'companyId' | 'ownerId'>) =>
  rpc<{ similar: RentalListItem[]; fromCompany: RentalListItem[] }>('getSimilarRentals', l.id, l.category, l.city, l.companyId ?? null, l.ownerId ?? null);
export const recordRentalView = (listingId: string) => rpc('recordRentalView', listingId).catch(() => {});
export const getAvailability = (listingId: string) => rpc<BusyRange[]>('getAvailability', listingId);
// Units free at each hour (0–23) of one day.
export const getHourAvailability = (listingId: string, date: string) => rpc<number[]>('getHourAvailability', listingId, date);
export const requestBooking = (input: BookingRequestInput) =>
  rpcAction<{ success: true; token: string; bookingNumber: string }>('requestBooking', input);
export const getBookingByToken = (token: string) => rpc<RentalBooking | null>('getBookingByToken', token);
export const getMyBookings = () => rpc<RentalBooking[]>('getMyBookings');
export const cancelMyBooking = (bookingId: string, reason?: string) => rpcAction('cancelMyBooking', bookingId, undefined, reason);

// ---------------------------------------------------------------- reviews

export type RentalReview = { id: string; author: string; rating: number; comment: string; date: string; replyText?: string; replyDate?: string };
export type RentalReviewsData = { reviews: RentalReview[]; count: number; average: number; distribution: number[] };
export type RentalReviewEligibility = { canReview: boolean; reason?: 'signin' | 'not_stayed'; existing?: { rating: number; comment: string } };

export const getRentalReviews = (listingId: string) => rpc<RentalReviewsData>('getRentalReviews', listingId);
export const getRentalReviewEligibility = (listingId: string) => rpc<RentalReviewEligibility>('getRentalReviewEligibility', listingId);
export const submitRentalReview = (listingId: string, input: { rating: number; comment: string }) =>
  rpcAction('submitRentalReview', listingId, input);
export const canReplyToRentalReviews = (listingId: string) => rpc<boolean>('canReplyToRentalReviews', listingId);
export const replyToRentalReview = (reviewId: string, text: string) => rpcAction('replyToRentalReview', reviewId, text);
