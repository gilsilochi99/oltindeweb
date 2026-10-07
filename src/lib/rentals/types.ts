// App-facing shapes for the rentals module (properties + vehicles).
// Plain JSON-serializable data, like src/lib/shop/types.ts.

import type { ProductStatus } from '../shop/types';

export type RentalCategory = 'property' | 'vehicle';
export type RentalDriverOption = 'none' | 'optional' | 'required';
export type RentalStatus = ProductStatus; // draft | active | archived

export const RENTAL_CATEGORY_LABELS: Record<RentalCategory, string> = {
  property: 'Inmueble',
  vehicle: 'Vehículo',
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

export function kindsFor(category: RentalCategory): Record<string, string> {
  return category === 'property' ? PROPERTY_KINDS : VEHICLE_KINDS;
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

export function amenitiesFor(category: RentalCategory): string[] {
  return category === 'property' ? PROPERTY_AMENITIES : VEHICLE_AMENITIES;
}

export const TRANSMISSION_LABELS: Record<string, string> = { manual: 'Manual', automatico: 'Automático' };
export const FUEL_LABELS: Record<string, string> = { gasolina: 'Gasolina', diesel: 'Diésel', hibrido: 'Híbrido', electrico: 'Eléctrico' };
export const DRIVER_OPTION_LABELS: Record<RentalDriverOption, string> = {
  none: 'Sin conductor',
  optional: 'Con o sin conductor',
  required: 'Siempre con conductor',
};

// "noche" for properties, "día" for vehicles.
export function unitLabel(category: RentalCategory, plural = false): string {
  if (category === 'property') return plural ? 'noches' : 'noche';
  return plural ? 'días' : 'día';
}

export type RentalImage = { id: string; url: string };

export type RentalListing = {
  id: string;
  companyId: string;
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
  'id' | 'companyId' | 'companyName' | 'slug' | 'images' | 'isFeatured' | 'ratingAvg' | 'ratingCount'
  | 'viewCount' | 'bookingCount' | 'publishedAt' | 'createdAt' | 'updatedAt'
> & { images: string[] };

// Lowest headline price for cards: "desde X / noche" or "X / mes".
export function headlinePrice(l: Pick<RentalListing, 'category' | 'shortTermEnabled' | 'dailyPrice' | 'longTermEnabled' | 'monthlyPrice'>): { amount: number; unit: string } | undefined {
  if (l.shortTermEnabled && l.dailyPrice) return { amount: l.dailyPrice, unit: unitLabel(l.category) };
  if (l.longTermEnabled && l.monthlyPrice) return { amount: l.monthlyPrice, unit: 'mes' };
  return undefined;
}

// ---------------------------------------------------------------- public search

export type RentalTermFilter = 'short' | 'long';
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
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  seats?: number;
  transmission?: string;
  driverOption?: RentalDriverOption;
  isFeatured: boolean;
  ratingAvg: number;
  ratingCount: number;
  companyId: string;
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

export type RentalTerm = 'short' | 'long';
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

export type BusyRange = { start: string; end: string; kind: 'booking' | 'block' }; // YYYY-MM-DD, end exclusive

export type RentalBookingEvent = { id: string; status: RentalBookingStatus; note?: string; createdAt: string };

export type RentalBooking = {
  id: string;
  bookingNumber: string;
  accessToken?: string; // only returned to the customer who made it
  listingId?: string;
  companyId: string;
  companyName?: string;
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
  guests?: number;
  withDriver: boolean;
  unitPrice: number;
  driverFee: number;
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
  guests?: number;
  withDriver?: boolean;
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

export type BookingQuote = { units: number; unitPrice: number; driverFee: number; subtotal: number; deposit: number; total: number; endDate: string };

// Price for a request — the same function the server uses to set the price,
// so what the customer sees is what gets saved.
export function quoteBooking(
  l: Pick<RentalListing, 'category' | 'dailyPrice' | 'monthlyPrice' | 'deposit' | 'driverOption' | 'driverDailyFee'>,
  req: { term: RentalTerm; startDate: string; endDate?: string; months?: number; withDriver?: boolean },
): BookingQuote | undefined {
  const deposit = l.deposit ?? 0;
  if (req.term === 'short') {
    if (!req.endDate || !l.dailyPrice) return undefined;
    const units = daysBetween(req.startDate, req.endDate);
    if (units < 1) return undefined;
    const withDriver = l.category === 'vehicle' && (l.driverOption === 'required' || (l.driverOption === 'optional' && !!req.withDriver));
    const driverFee = withDriver ? (l.driverDailyFee ?? 0) * units : 0;
    const subtotal = l.dailyPrice * units + driverFee;
    return { units, unitPrice: l.dailyPrice, driverFee, subtotal, deposit, total: subtotal, endDate: req.endDate };
  }
  if (!req.months || !l.monthlyPrice) return undefined;
  const subtotal = l.monthlyPrice * req.months;
  return { units: req.months, unitPrice: l.monthlyPrice, driverFee: 0, subtotal, deposit, total: subtotal, endDate: addMonthsIso(req.startDate, req.months) };
}
