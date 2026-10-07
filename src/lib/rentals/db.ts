import { prisma, Prisma } from '../db';
import { slugify } from '../slug';
import type { RentalListing } from './types';

// Row → app type mappers and shared helpers for the rentals module.
// Server-only (imports the Prisma client); not a 'use server' module.

const iso = (d: Date) => d.toISOString();
const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
const num = (v: Prisma.Decimal | null | undefined) => (v === null || v === undefined ? undefined : Number(v));

export const rentalInclude = {
  company: { select: { name: true } },
  images: { orderBy: { position: 'asc' } },
} satisfies Prisma.RentalListingInclude;

type RentalRow = Prisma.RentalListingGetPayload<{ include: typeof rentalInclude }>;

export function toRentalListing(r: RentalRow): RentalListing {
  return {
    id: r.id,
    companyId: r.companyId,
    companyName: r.company.name,
    slug: r.slug,
    title: r.title,
    description: r.description,
    category: r.category,
    kind: r.kind,
    status: r.status,
    city: r.city,
    neighborhood: opt(r.neighborhood),
    address: opt(r.address),
    lat: opt(r.lat),
    lng: opt(r.lng),
    shortTermEnabled: r.shortTermEnabled,
    dailyPrice: num(r.dailyPrice),
    minUnits: r.minUnits,
    maxUnits: opt(r.maxUnits),
    longTermEnabled: r.longTermEnabled,
    monthlyPrice: num(r.monthlyPrice),
    minMonths: r.minMonths,
    deposit: num(r.deposit),
    priceNotes: opt(r.priceNotes),
    bedrooms: opt(r.bedrooms),
    bathrooms: opt(r.bathrooms),
    areaM2: opt(r.areaM2),
    maxGuests: opt(r.maxGuests),
    furnished: opt(r.furnished),
    brand: opt(r.brand),
    model: opt(r.model),
    year: opt(r.year),
    transmission: opt(r.transmission),
    fuel: opt(r.fuel),
    seats: opt(r.seats),
    driverOption: opt(r.driverOption),
    driverDailyFee: num(r.driverDailyFee),
    amenities: (r.amenities ?? []) as string[],
    rules: opt(r.rules),
    images: r.images.map(i => ({ id: i.id, url: i.url })),
    isFeatured: r.isFeatured,
    ratingAvg: Number(r.ratingAvg),
    ratingCount: r.ratingCount,
    viewCount: r.viewCount,
    bookingCount: r.bookingCount,
    publishedAt: r.publishedAt ? iso(r.publishedAt) : undefined,
    createdAt: iso(r.createdAt),
    updatedAt: iso(r.updatedAt),
  };
}

// Random suffix so two advertisers can both list "Piso en Malabo II"; never
// regenerated on edit so shared links keep working.
export async function uniqueRentalSlug(title: string): Promise<string> {
  const base = slugify(title).slice(0, 80) || 'alquiler';
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const taken = await prisma.rentalListing.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  throw new Error('No se pudo generar un enlace único para el anuncio.');
}

// What the public may see: published listings of active companies.
export const publicRentalWhere = {
  status: 'active',
  company: { isActive: true },
} satisfies Prisma.RentalListingWhereInput;
