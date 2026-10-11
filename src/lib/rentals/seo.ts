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
  // Equipos y artículos
  sillas: 'Alquiler de sillas para eventos',
  mesas: 'Alquiler de mesas para eventos',
  carpas: 'Alquiler de carpas',
  sonido: 'Alquiler de equipo de sonido',
  iluminacion: 'Alquiler de iluminación para eventos',
  decoracion: 'Alquiler de decoración para eventos',
  vajilla: 'Alquiler de vajilla y menaje',
  ropa: 'Alquiler de trajes y vestidos',
  hinchables: 'Alquiler de castillos hinchables',
  generador: 'Alquiler de generadores',
  maquinaria: 'Alquiler de maquinaria de obra',
  andamios: 'Alquiler de andamios',
  herramientas: 'Alquiler de herramientas',
  proyector: 'Alquiler de proyectores y pantallas',
  camaras: 'Alquiler de cámaras y drones',
  informatica: 'Alquiler de ordenadores e impresoras',
  bicicletas: 'Alquiler de bicicletas',
  nautica: 'Alquiler de barcos y kayaks',
  deporte: 'Alquiler de material deportivo y de playa',
  // Espacios
  salon: 'Salones de eventos en alquiler',
  sala: 'Salas de reuniones en alquiler',
  coworking: 'Oficinas por horas y coworking',
  jardin: 'Jardines y espacios exteriores para eventos',
  cancha: 'Alquiler de canchas deportivas',
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
  sillas: 'sillas para bodas, fiestas, funerales y conferencias, con entrega',
  carpas: 'carpas y toldos para bodas, fiestas y eventos',
  sonido: 'altavoces, mesas de mezclas y micrófonos para fiestas y eventos',
  generador: 'generadores eléctricos para casas, obras y eventos',
  maquinaria: 'hormigoneras, compresores, excavadoras y maquinaria de construcción',
  salon: 'salones para bodas, cumpleaños, conferencias y fiestas, por horas o por días',
  sala: 'salas de reuniones y de formación por horas',
};

const CATEGORY_SEARCH_NAMES: Record<RentalCategory, string> = {
  property: 'Pisos, casas y oficinas en alquiler',
  vehicle: 'Alquiler de coches y vehículos',
  item: 'Alquiler de equipos y artículos para eventos y obras',
  space: 'Salones y espacios para eventos en alquiler',
};

const CATEGORY_SYNONYMS: Record<RentalCategory, string> = {
  property: 'apartamentos, casas, villas, habitaciones, oficinas y locales, por noches o por meses',
  vehicle: 'rent a car, todoterrenos 4x4, furgonetas y minibuses, con o sin conductor',
  item: 'sillas, mesas, carpas, sonido, generadores, maquinaria y mucho más, con entrega',
  space: 'salones de eventos, salas de reuniones y espacios por horas o por días',
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
  const term = q.term === 'long' ? ' por meses' : q.term === 'hourly' ? ' por horas' : q.term === 'short' ? (q.category === 'property' ? ' por noches' : ' por días') : '';
  const where = q.city ? '' : ' en Guinea Ecuatorial';
  const suffix = q.category === 'vehicle' && (!q.kinds?.length || q.kinds[0] === 'coche') ? ' · Rent a car' : '';
  return `${name}${term}${where}${suffix}`;
}

export function rentalLandingDescription(q: RentalQuery): string {
  if (!q.category) return 'Alquiler de casas, pisos, coches, equipos para eventos y salones en Guinea Ecuatorial: precios en XAF, fotos, disponibilidad y reserva directa.';
  const kind = q.kinds?.[0];
  const where = q.city ? `${q.city}, Guinea Ecuatorial` : 'Malabo, Bata y toda Guinea Ecuatorial';
  const synonyms = kind ? KIND_SYNONYMS[kind] : CATEGORY_SYNONYMS[q.category];
  const name = rentalSearchName(q.category, kind);
  return `${name} en ${where}: ${synonyms ?? ''}. Compare precios en XAF, fotos y disponibilidad, y reserve directamente con empresas y particulares.`;
}
