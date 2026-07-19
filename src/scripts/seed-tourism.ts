import { collection, addDoc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../lib/firebase';
import type { TouristLocation, Itinerary, ItineraryStop } from '../lib/types';

const SEED_USER_ID = 'seed-script';
const SEED_AUTHOR_NAME = 'Oltinde';

const locations: Omit<TouristLocation, 'id' | 'reviews' | 'status' | 'submittedBy' | 'createdAt'>[] & { key: string }[] = [
  {
    key: 'catedral-santa-isabel',
    name: 'Catedral de Santa Isabel',
    description: 'Emblemática catedral neogótica en el corazón de Malabo, con su característica fachada de color rosado. Uno de los monumentos más fotografiados de la ciudad.',
    category: 'Monumento',
    location: { address: 'Calle Rey Boncoro', city: 'Malabo', lat: 3.7550, lng: 8.7828 },
    image: 'https://picsum.photos/seed/catedral-malabo/800/600',
    priceRange: 'free',
    openingHours: [
      { day: 'Lunes - Sábado', hours: '08:00 - 18:00' },
      { day: 'Domingo', hours: '07:00 - 13:00 (Misa)' },
    ],
    isFeatured: true,
  },
  {
    key: 'pico-basile',
    name: 'Parque Nacional de Pico Basilé',
    description: 'El punto más alto de Guinea Ecuatorial, con senderos entre bosque nuboso y vistas panorámicas de toda la isla de Bioko en los días despejados.',
    category: 'Naturaleza',
    location: { address: 'Carretera a Moka', city: 'Malabo', lat: 3.6167, lng: 8.7000 },
    image: 'https://picsum.photos/seed/pico-basile/800/600',
    priceRange: '$',
    openingHours: [{ day: 'Todos los días', hours: '07:00 - 17:00' }],
    isFeatured: true,
  },
  {
    key: 'playa-arena-blanca',
    name: 'Playa de Arena Blanca',
    description: 'Playa de arena volcánica junto al pueblo pesquero de Luba, ideal para desconectar y disfrutar de la costa oeste de Bioko.',
    category: 'Playa',
    location: { address: 'Costa de Luba', city: 'Luba', lat: 3.4590, lng: 8.5540 },
    image: 'https://picsum.photos/seed/playa-luba/800/600',
    priceRange: 'free',
  },
  {
    key: 'mercado-central-malabo',
    name: 'Mercado Central de Malabo',
    description: 'El mercado más animado de la capital: artesanía local, telas, especias y productos frescos en un ambiente auténtico.',
    category: 'Cultura',
    location: { address: 'Centro de Malabo', city: 'Malabo', lat: 3.7530, lng: 8.7810 },
    image: 'https://picsum.photos/seed/mercado-malabo/800/600',
    priceRange: 'free',
    openingHours: [{ day: 'Lunes - Sábado', hours: '07:00 - 19:00' }],
  },
  {
    key: 'paseo-maritimo-bata',
    name: 'Paseo Marítimo de Bata',
    description: 'El malecón más largo del África continental española: kilómetros de paseo junto al Atlántico, ideal para caminar al atardecer.',
    category: 'Naturaleza',
    location: { address: 'Avenida de la Independencia', city: 'Bata', lat: 1.8500, lng: 9.7650 },
    image: 'https://picsum.photos/seed/paseo-bata/800/600',
    priceRange: 'free',
    isFeatured: true,
  },
  {
    key: 'monte-alen',
    name: 'Parque Nacional de Monte Alén',
    description: 'La mayor reserva de selva tropical del país, hogar de gorilas, mandriles y una biodiversidad excepcional. El "pulmón verde" de Guinea Ecuatorial.',
    category: 'Naturaleza',
    location: { address: 'Región continental, cerca de Bata', city: 'Bata', lat: 1.5000, lng: 10.3000 },
    image: 'https://picsum.photos/seed/monte-alen/800/600',
    priceRange: '$$',
    openingHours: [{ day: 'Todos los días', hours: '08:00 - 16:00 (con guía)' }],
  },
] as any;

async function seedLocations(): Promise<Record<string, string>> {
  const idsByKey: Record<string, string> = {};
  const locationsCol = collection(db, 'touristLocations');

  for (const { key, ...loc } of locations) {
    const doc: Omit<TouristLocation, 'id'> = {
      ...loc,
      gallery: [],
      linkedCompanyId: null,
      reviews: [],
      status: 'approved',
      submittedBy: SEED_USER_ID,
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(locationsCol, doc);
    idsByKey[key] = ref.id;
    console.log(`Seeded & approved: ${loc.name} (${ref.id})`);
  }

  return idsByKey;
}

async function seedItineraries(idsByKey: Record<string, string>) {
  const itinerariesCol = collection(db, 'itineraries');

  const itineraries: (Omit<Itinerary, 'id' | 'stops' | 'reviews' | 'authorId' | 'authorName' | 'createdAt'> & {
    stops: Omit<ItineraryStop, 'id'>[];
  })[] = [
    {
      title: 'Fin de Semana en Malabo',
      description: 'Un recorrido de dos días por lo mejor de la capital: historia colonial, cultura local y las mejores vistas de la isla de Bioko.',
      city: 'Malabo',
      durationDays: 2,
      theme: ['cultural', 'familiar'],
      visibility: 'public',
      coverImage: 'https://picsum.photos/seed/itinerary-malabo/800/600',
      isFeatured: true,
      stops: [
        { locationId: idsByKey['catedral-santa-isabel'], order: 1, day: 1, suggestedTime: '09:00', notes: 'Empiece temprano para evitar el calor del mediodía.' },
        { locationId: idsByKey['mercado-central-malabo'], order: 2, day: 1, suggestedTime: '11:00', notes: 'Buen lugar para comprar artesanía local.' },
        { locationId: idsByKey['pico-basile'], order: 3, day: 2, suggestedTime: '08:00', notes: 'Lleve calzado cómodo; la carretera de montaña puede estar húmeda.' },
      ],
    },
    {
      title: 'Escapada de Playa en Luba',
      description: 'Un día completo relajándose en una de las playas de arena volcánica más bonitas de la isla de Bioko.',
      city: 'Luba',
      durationDays: 1,
      theme: ['playa', 'relax'],
      visibility: 'public',
      coverImage: 'https://picsum.photos/seed/itinerary-luba/800/600',
      stops: [
        { locationId: idsByKey['playa-arena-blanca'], order: 1, day: 1, suggestedTime: '10:00', notes: 'Lleve protector solar y agua.' },
      ],
    },
    {
      title: 'Naturaleza y Selva en Bata',
      description: 'Dos días explorando la región continental: desde el paseo marítimo más largo del África continental española hasta el corazón de la selva de Monte Alén.',
      city: 'Bata',
      durationDays: 2,
      theme: ['aventura', 'naturaleza'],
      visibility: 'public',
      coverImage: 'https://picsum.photos/seed/itinerary-bata/800/600',
      isFeatured: true,
      stops: [
        { locationId: idsByKey['paseo-maritimo-bata'], order: 1, day: 1, suggestedTime: '17:00', notes: 'Ideal para el atardecer.' },
        { locationId: idsByKey['monte-alen'], order: 2, day: 2, suggestedTime: '08:00', notes: 'Reserve un guía local con antelación.' },
      ],
    },
  ];

  for (const itinerary of itineraries) {
    if (itinerary.stops.some(s => !s.locationId)) {
      console.error(`Skipping "${itinerary.title}": one or more referenced locations failed to seed.`);
      continue;
    }
    const doc: Omit<Itinerary, 'id'> = {
      ...itinerary,
      stops: itinerary.stops.map(s => ({ ...s, id: uuidv4() })),
      authorId: SEED_USER_ID,
      authorName: SEED_AUTHOR_NAME,
      reviews: [],
      createdAt: new Date().toISOString(),
    };
    const ref = await addDoc(itinerariesCol, doc);
    console.log(`Seeded itinerary: ${itinerary.title} (${ref.id})`);
  }
}

async function run() {
  console.log('--- Seeding tourism sample data for Equatorial Guinea ---');
  const idsByKey = await seedLocations();
  await seedItineraries(idsByKey);
  console.log('--- Done ---');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed script failed:', err);
  process.exit(1);
});
