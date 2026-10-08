// Alquileres (houses and vehicles) for the app. Types and helpers mirror the
// web app's src/lib/rentals/types.ts; calls go through /api/mobile/rpc to the
// same server functions the website uses (the server recomputes every price
// with the same quoteBooking, so what the customer sees is what is saved).
import { rpc, rpcAction } from './api';
import { WEB_APP_URL } from './config';

export type RentalCategory = 'property' | 'vehicle';
export type RentalDriverOption = 'none' | 'optional' | 'required';

export const RENTAL_CATEGORY_LABELS: Record<RentalCategory, string> = {
  property: 'Inmuebles',
  vehicle: 'Vehículos',
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

export function kindsFor(category: RentalCategory): Record<string, string> {
  return category === 'property' ? PROPERTY_KINDS : VEHICLE_KINDS;
}

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
  companyId: string;
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
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  seats?: number;
  transmission?: string;
  driverOption?: RentalDriverOption;
  isFeatured: boolean;
  companyId: string;
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
  term?: 'short' | 'long';
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
  total: number;
  kindCounts: { category: RentalCategory; kind: string; count: number }[];
  cityCounts: { city: string; count: number }[];
};

export type RentalTerm = 'short' | 'long';
export type RentalBookingStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';

export const BOOKING_STATUS_LABELS: Record<RentalBookingStatus, string> = {
  pending: 'Pendiente de respuesta',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  cancelled: 'Cancelada',
  completed: 'Finalizada',
};

export type BusyRange = { start: string; end: string; kind: 'booking' | 'block' };

export type RentalBooking = {
  id: string;
  bookingNumber: string;
  accessToken?: string;
  listingId?: string;
  companyId: string;
  companyName?: string;
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
  guests?: number;
  withDriver: boolean;
  unitPrice: number;
  driverFee: number;
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
  guests?: number;
  withDriver?: boolean;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  message?: string;
};

// ---------------------------------------------------------------- helpers

export function headlinePrice(l: Pick<RentalListItem, 'category' | 'shortTermEnabled' | 'dailyPrice' | 'longTermEnabled' | 'monthlyPrice'>): { amount: number; unit: string } | undefined {
  if (l.shortTermEnabled && l.dailyPrice) return { amount: l.dailyPrice, unit: unitLabel(l.category) };
  if (l.longTermEnabled && l.monthlyPrice) return { amount: l.monthlyPrice, unit: 'mes' };
  return undefined;
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

export type BookingQuote = { units: number; unitPrice: number; driverFee: number; subtotal: number; deposit: number; total: number; endDate: string };

// Same price rule as the server.
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

export const rentalUrl = (slug: string) => `${WEB_APP_URL}/alquiler/${slug}`;

// ---------------------------------------------------------------- server calls

export const getRentalsHome = () => rpc<RentalsHome>('getRentalsHome');
export const searchRentals = (query: RentalQuery) => rpc<RentalSearchResult>('searchRentals', query);
export const getRentalBySlug = (slug: string) =>
  rpc<{ listing: RentalListing; isPreview: boolean } | null>('getRentalBySlug', slug);
export const getSimilarRentals = (l: Pick<RentalListing, 'id' | 'category' | 'city' | 'companyId'>) =>
  rpc<{ similar: RentalListItem[]; fromCompany: RentalListItem[] }>('getSimilarRentals', l.id, l.category, l.city, l.companyId);
export const recordRentalView = (listingId: string) => rpc('recordRentalView', listingId).catch(() => {});
export const getAvailability = (listingId: string) => rpc<BusyRange[]>('getAvailability', listingId);
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
