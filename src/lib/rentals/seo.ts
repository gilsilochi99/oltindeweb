import type { RentalCategory, RentalQuery } from './types';
import { kindLabel } from './types';
import { activeRentalFilters, rentalHref } from './query-params';

// Search-engine copy for /alquiler: the words people actually type ("alquiler
// de coches", "rent a car", "pisos en alquiler"...) used in titles,
// descriptions and visible links. Only pages that have listings are indexed.

/** Natural name of a listing type as people search it. */
const KIND_SEARCH_NAMES: Record<string, string> = {
  // Inmuebles
  piso: 'Pisos y apartamentos en alquiler',
  casa: 'Casas en alquiler',
  villa: 'Villas y chalets en alquiler',
  estudio: 'Estudios en alquiler',
  habitacion: 'Habitaciones en alquiler',
  oficina: 'Oficinas en alquiler',
  local: 'Locales comerciales en alquiler',
  nave: 'Naves y almacenes en alquiler',
  terreno: 'Terrenos en alquiler',
  // Vehículos
  coche: 'Alquiler de coches',
  todoterreno: 'Alquiler de todoterrenos 4x4',
  furgoneta: 'Alquiler de furgonetas',
  minibus: 'Alquiler de minibuses',
  pickup: 'Alquiler de pick-ups',
  moto: 'Alquiler de motos',
  camion: 'Alquiler de camiones',
};

/** Extra phrasings for the description, so each page matches more searches. */
const KIND_SYNONYMS: Record<string, string> = {
  piso: 'apartamentos, pisos amueblados y alquiler vacacional por noches o por meses',
  casa: 'casas amuebladas, casas con jardín y alquiler de viviendas por meses',
  villa: 'villas, chalets y casas de lujo, por noches o por meses',
  estudio: 'estudios y apartamentos pequeños amueblados',
  habitacion: 'habitaciones y cuartos en alquiler, por noches o por meses',
  oficina: 'oficinas y despachos para empresas',
  local: 'locales y tiendas para negocio',
  nave: 'naves industriales, almacenes y depósitos',
  terreno: 'terrenos y parcelas',
  coche: 'rent a car, coches de alquiler con o sin conductor, por días o por meses',
  todoterreno: '4x4, SUV y todoterrenos con o sin conductor',
  furgoneta: 'furgonetas y vehículos de carga o de pasajeros',
  minibus: 'minibuses y vehículos para grupos, con conductor',
  pickup: 'pick-ups y camionetas',
  moto: 'motos y scooters',
  camion: 'camiones y vehículos pesados',
};

const CATEGORY_SEARCH_NAMES: Record<RentalCategory, string> = {
  property: 'Pisos, casas y oficinas en alquiler',
  vehicle: 'Alquiler de coches y vehículos',
};

const CATEGORY_SYNONYMS: Record<RentalCategory, string> = {
  property: 'apartamentos, casas, villas, habitaciones, oficinas y locales, por noches o por meses',
  vehicle: 'rent a car, todoterrenos 4x4, furgonetas y minibuses, con o sin conductor',
};

/** Link text / title for a landing page, e.g. "Alquiler de coches en Malabo". */
export function rentalSearchName(category: RentalCategory, kind?: string, city?: string): string {
  const base = kind ? (KIND_SEARCH_NAMES[kind] ?? `${kindLabel(category, kind)} en alquiler`) : CATEGORY_SEARCH_NAMES[category];
  return city ? `${base} en ${city}` : base;
}

/**
 * Landing pages are the clean combinations (category, one type, city, term)
 * on page 1 with no text search, price range or sort. Everything else is a
 * user filter and stays out of the index.
 */
export function isRentalLanding(q: RentalQuery): boolean {
  if (!q.category || q.q || q.sort || (q.page ?? 1) > 1) return false;
  if ((q.kinds?.length ?? 0) > 1) return false;
  const landingFilters = (q.kinds?.length ? 1 : 0) + (q.city ? 1 : 0) + (q.term ? 1 : 0);
  return activeRentalFilters(q) === landingFilters;
}

export function rentalLandingCanonical(q: RentalQuery): string {
  return rentalHref({ category: q.category, kinds: q.kinds, city: q.city, term: q.term });
}

export function rentalLandingTitle(q: RentalQuery): string {
  if (!q.category) return 'Alquileres en Guinea Ecuatorial';
  const name = rentalSearchName(q.category, q.kinds?.[0], q.city);
  const term = q.term === 'long' ? ' por meses' : q.term === 'short' ? (q.category === 'vehicle' ? ' por días' : ' por noches') : '';
  const where = q.city ? '' : ' en Guinea Ecuatorial';
  const suffix = q.category === 'vehicle' && (!q.kinds?.length || q.kinds[0] === 'coche') ? ' · Rent a car' : '';
  return `${name}${term}${where}${suffix}`;
}

export function rentalLandingDescription(q: RentalQuery): string {
  if (!q.category) return 'Alquiler de casas, pisos y coches en Guinea Ecuatorial: precios en XAF, fotos, disponibilidad y reserva directa con la empresa.';
  const kind = q.kinds?.[0];
  const where = q.city ? `${q.city}, Guinea Ecuatorial` : 'Malabo, Bata y toda Guinea Ecuatorial';
  const synonyms = kind ? KIND_SYNONYMS[kind] : CATEGORY_SYNONYMS[q.category];
  const name = rentalSearchName(q.category, kind);
  return `${name} en ${where}: ${synonyms ?? ''}. Compare precios en XAF, fotos y disponibilidad, y reserve directamente con empresas verificadas.`;
}
