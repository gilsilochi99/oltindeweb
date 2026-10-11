'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { deleteUploadByUrl } from '../uploads';
import { rentalInclude, toRentalListing, uniqueRentalSlug } from './db';
import { loadRentalKinds } from './kinds';
import { PRIVATE_SCOPE, resolveAdvertiser, resolveListingAdvertiser, type Advertiser } from './advertiser';
import { MAX_PRIVATE_ACTIVE_LISTINGS, kindsFor, specFieldsFor, type RentalListing, type RentalListingInput, type RentalStatus } from './types';
import type { ActionResult } from '../shop/types';

// Advertiser-side writes for the rentals module. The advertiser is a company
// (scope = its id) or the signed-in person (scope = 'me', see advertiser.ts).
// Every action re-checks the caller and validates its input with zod.

const MAX_IMAGES = 15;

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  console.error(fallback, error);
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

function revalidateRentals(a: Advertiser) {
  revalidateTag('rentals');
  revalidatePath(a.isIndividual ? '/dashboard/alquileres' : `/dashboard/companies/${a.folder}/rentals`);
}

// Only files in this advertiser's own rentals/<folder>/ are ever deleted —
// image URLs come from the client.
async function deleteOwnImages(folder: string, urls: string[]) {
  const own = Array.from(new Set(urls)).filter(u => u.includes(`/rentals/${folder}/`));
  await Promise.allSettled(own.map(u => deleteUploadByUrl(u)));
}

// ---------------------------------------------------------------- validation

const text = (max: number) => z.string().trim().max(max);
const optText = (max: number) => text(max).optional().transform(v => v || undefined);
const optInt = (min: number, max: number) => z.coerce.number().int().min(min).max(max).optional().nullable().transform(v => v ?? undefined);
const optMoney = z.coerce.number().min(0).max(1e10).optional().nullable().transform(v => (v ? v : undefined));
const imageUrl = z.string().trim().min(1).max(2048).refine(u => u.startsWith('/') || /^https?:\/\//.test(u), 'URL de imagen no válida.');

const listingSchema = z.object({
  title: text(255).min(5, 'El título debe tener al menos 5 caracteres.'),
  description: z.string().trim().max(20000),
  category: z.enum(['property', 'vehicle', 'item', 'space']),
  kind: text(64),
  status: z.enum(['draft', 'active', 'archived']),
  city: text(128).min(2, 'Indique la ciudad.'),
  neighborhood: optText(255),
  address: optText(512),
  lat: z.coerce.number().min(-90).max(90).optional().nullable().transform(v => v ?? undefined),
  lng: z.coerce.number().min(-180).max(180).optional().nullable().transform(v => v ?? undefined),
  shortTermEnabled: z.boolean(),
  dailyPrice: optMoney,
  minUnits: z.coerce.number().int().min(1).max(365).default(1),
  maxUnits: optInt(1, 365),
  longTermEnabled: z.boolean(),
  monthlyPrice: optMoney,
  minMonths: z.coerce.number().int().min(1).max(120).default(1),
  hourlyEnabled: z.boolean().optional().default(false),
  hourlyPrice: optMoney,
  minHours: z.coerce.number().int().min(1).max(24).optional().default(1),
  quantity: z.coerce.number().int().min(1, 'La cantidad mínima es 1.').max(10000, 'Cantidad demasiado grande.').optional().default(1),
  deposit: optMoney,
  priceNotes: optText(512),
  deliveryOption: z.enum(['none', 'optional', 'required']).optional().nullable().transform(v => v ?? undefined),
  deliveryFee: optMoney,
  specs: z.record(z.string().max(40), z.string().trim().max(200)).optional().default({}),
  contactPhone: z.string().trim().max(64).regex(/^[+\d\s()-]*$/, 'Teléfono no válido.').optional().transform(v => v || undefined),
  bedrooms: optInt(0, 100),
  bathrooms: optInt(0, 100),
  areaM2: optInt(1, 1000000),
  maxGuests: optInt(1, 5000),
  furnished: z.boolean().optional().nullable().transform(v => v ?? undefined),
  brand: optText(128),
  model: optText(128),
  year: optInt(1950, new Date().getFullYear() + 1),
  transmission: z.enum(['manual', 'automatico']).optional().nullable().transform(v => v ?? undefined),
  fuel: z.enum(['gasolina', 'diesel', 'hibrido', 'electrico']).optional().nullable().transform(v => v ?? undefined),
  seats: optInt(1, 100),
  driverOption: z.enum(['none', 'optional', 'required']).optional().nullable().transform(v => v ?? undefined),
  driverDailyFee: optMoney,
  amenities: z.array(text(80).min(1)).max(40),
  rules: optText(5000),
  images: z.array(imageUrl).max(MAX_IMAGES, `Máximo ${MAX_IMAGES} fotos.`),
}).superRefine((l, ctx) => {
  if (!(l.kind in kindsFor(l.category))) ctx.addIssue({ code: 'custom', message: 'Elija el tipo de lo que alquila.' });
  if (l.maxUnits !== undefined && l.maxUnits < l.minUnits) ctx.addIssue({ code: 'custom', message: 'El máximo no puede ser menor que el mínimo.' });
  if (l.status === 'active') {
    const hourly = l.hourlyEnabled && (l.category === 'item' || l.category === 'space');
    if (!l.shortTermEnabled && !l.longTermEnabled && !hourly) ctx.addIssue({ code: 'custom', message: 'Active al menos un precio: por día, por hora o por mes.' });
    if (l.shortTermEnabled && !l.dailyPrice) ctx.addIssue({ code: 'custom', message: `Indique el precio por ${l.category === 'property' ? 'noche' : 'día'}.` });
    if (hourly && !l.hourlyPrice) ctx.addIssue({ code: 'custom', message: 'Indique el precio por hora.' });
    if (l.longTermEnabled && !l.monthlyPrice) ctx.addIssue({ code: 'custom', message: 'Indique el precio por mes.' });
    if (l.images.length === 0) ctx.addIssue({ code: 'custom', message: 'Añada al menos una foto antes de publicar.' });
    if (l.description.length < 20) ctx.addIssue({ code: 'custom', message: 'La descripción debe tener al menos 20 caracteres para publicar.' });
  }
});

type ListingValues = z.infer<typeof listingSchema>;

function listingData(l: ListingValues, isIndividual: boolean) {
  const c = l.category;
  const isProperty = c === 'property';
  const isVehicle = c === 'vehicle';
  const isItem = c === 'item';
  const isSpace = c === 'space';
  const allowedSpecs = new Set(specFieldsFor(c, l.kind).map(f => f.key));
  const specs = Object.fromEntries(Object.entries(l.specs ?? {}).filter(([k, v]) => allowedSpecs.has(k) && v));
  return {
    title: l.title,
    description: l.description,
    category: c,
    kind: l.kind,
    status: l.status,
    city: l.city,
    neighborhood: l.neighborhood ?? null,
    address: l.address ?? null,
    lat: l.lat ?? null,
    lng: l.lng ?? null,
    shortTermEnabled: l.shortTermEnabled,
    dailyPrice: l.dailyPrice ?? null,
    minUnits: l.minUnits,
    maxUnits: l.maxUnits ?? null,
    longTermEnabled: l.longTermEnabled,
    monthlyPrice: l.monthlyPrice ?? null,
    minMonths: l.minMonths,
    // By the hour: items and spaces only.
    hourlyEnabled: (isItem || isSpace) && l.hourlyEnabled,
    hourlyPrice: isItem || isSpace ? l.hourlyPrice ?? null : null,
    minHours: isItem || isSpace ? l.minHours : 1,
    // Several identical units: items only.
    quantity: isItem ? l.quantity : 1,
    deposit: l.deposit ?? null,
    priceNotes: l.priceNotes ?? null,
    deliveryOption: isItem ? l.deliveryOption ?? 'none' : null,
    deliveryFee: isItem && l.deliveryOption && l.deliveryOption !== 'none' ? l.deliveryFee ?? null : null,
    specs: isItem ? specs : undefined,
    contactPhone: isIndividual ? l.contactPhone ?? null : null,
    // Fields of other categories are cleared so a listing switched from one
    // to another doesn't keep stale details.
    bedrooms: isProperty ? l.bedrooms ?? null : null,
    bathrooms: isProperty ? l.bathrooms ?? null : null,
    areaM2: isProperty || isSpace ? l.areaM2 ?? null : null,
    maxGuests: isProperty || isSpace ? l.maxGuests ?? null : null,
    furnished: isProperty ? l.furnished ?? null : null,
    brand: isVehicle ? l.brand ?? null : null,
    model: isVehicle ? l.model ?? null : null,
    year: isVehicle ? l.year ?? null : null,
    transmission: isVehicle ? l.transmission ?? null : null,
    fuel: isVehicle ? l.fuel ?? null : null,
    seats: isVehicle ? l.seats ?? null : null,
    driverOption: isVehicle ? l.driverOption ?? 'none' : null,
    driverDailyFee: !isVehicle || l.driverOption === 'none' ? null : l.driverDailyFee ?? null,
    amenities: Array.from(new Set(l.amenities)),
    rules: l.rules ?? null,
  };
}

// Extra publish rules for private advertisers: a phone to arrange the
// rental, and a cap on published listings.
async function privatePublishCheck(a: Advertiser, l: ListingValues, excludeId?: string): Promise<string | undefined> {
  if (!a.isIndividual || l.status !== 'active') return undefined;
  if (!l.contactPhone || l.contactPhone.replace(/\D/g, '').length < 6) return 'Indique un teléfono de contacto para publicar. Solo lo verá quien tenga una reserva aceptada.';
  if (isManagerRole(a.caller.role)) return undefined;
  const active = await prisma.rentalListing.count({ where: { ...a.where, status: 'active', ...(excludeId ? { id: { not: excludeId } } : {}) } });
  if (active >= MAX_PRIVATE_ACTIVE_LISTINGS) return `Como particular puede tener hasta ${MAX_PRIVATE_ACTIVE_LISTINGS} anuncios publicados a la vez.`;
  return undefined;
}

// ---------------------------------------------------------------- listings

export async function createRentalListing(scope: string, input: RentalListingInput): Promise<ActionResult<{ id: string }>> {
  try {
    const check = await resolveAdvertiser(scope, { forWrite: true });
    if (!check.ok) return { success: false, message: check.message };
    const a = check.advertiser;
    await loadRentalKinds();
    const data = listingSchema.parse(input);
    const blocked = await privatePublishCheck(a, data);
    if (blocked) return { success: false, message: blocked };
    const listing = await prisma.rentalListing.create({
      data: {
        ...listingData(data, a.isIndividual),
        ...a.owner,
        slug: await uniqueRentalSlug(data.title),
        publishedAt: data.status === 'active' ? new Date() : null,
        images: { create: data.images.map((url, position) => ({ url, position })) },
      },
    });
    revalidateRentals(a);
    return { success: true, id: listing.id };
  } catch (error) {
    return fail(error, 'No se pudo crear el anuncio.');
  }
}

export async function updateRentalListing(listingId: string, input: RentalListingInput): Promise<ActionResult> {
  try {
    const check = await resolveListingAdvertiser(listingId, { forWrite: true });
    if (!check.ok) return { success: false, message: check.message };
    const a = check.advertiser;
    await loadRentalKinds();
    const data = listingSchema.parse(input);
    const blocked = await privatePublishCheck(a, data, listingId);
    if (blocked) return { success: false, message: blocked };
    const current = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, select: { publishedAt: true, images: { select: { url: true } } } });

    await prisma.$transaction([
      prisma.rentalListing.update({
        where: { id: listingId },
        data: { ...listingData(data, a.isIndividual), publishedAt: data.status === 'active' && !current.publishedAt ? new Date() : undefined },
      }),
      prisma.rentalImage.deleteMany({ where: { listingId } }),
      prisma.rentalImage.createMany({ data: data.images.map((url, position) => ({ listingId, url, position })) }),
    ]);

    const kept = new Set(data.images);
    await deleteOwnImages(a.folder, current.images.map(i => i.url).filter(u => !kept.has(u)));
    revalidateRentals(a);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar el anuncio.');
  }
}

export async function setRentalStatus(listingId: string, status: RentalStatus): Promise<ActionResult> {
  try {
    const check = await resolveListingAdvertiser(listingId, { forWrite: true });
    if (!check.ok) return { success: false, message: check.message };
    const a = check.advertiser;
    z.enum(['draft', 'active', 'archived']).parse(status);
    const l = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, include: rentalInclude });
    if (status === 'active') {
      await loadRentalKinds();
      // Re-run the publish rules on the stored listing.
      const listing = toRentalListing(l);
      const result = listingSchema.safeParse({ ...listing, status: 'active', images: listing.images.map(i => i.url) });
      if (!result.success) return { success: false, message: result.error.issues[0]?.message ?? 'Complete el anuncio antes de publicar.' };
      const blocked = await privatePublishCheck(a, result.data, listingId);
      if (blocked) return { success: false, message: blocked };
    }
    await prisma.rentalListing.update({
      where: { id: listingId },
      data: { status, publishedAt: status === 'active' && !l.publishedAt ? new Date() : undefined },
    });
    revalidateRentals(a);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cambiar el estado del anuncio.');
  }
}

export async function deleteRentalListing(listingId: string): Promise<ActionResult> {
  try {
    const check = await resolveListingAdvertiser(listingId);
    if (!check.ok) return { success: false, message: check.message };
    const a = check.advertiser;
    const active = await prisma.rentalBooking.count({ where: { listingId, status: { in: ['pending', 'accepted'] } } });
    if (active > 0) return { success: false, message: 'Este anuncio tiene reservas pendientes o aceptadas. Archívelo en lugar de eliminarlo.' };
    const l = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, select: { images: { select: { url: true } } } });
    await prisma.rentalListing.delete({ where: { id: listingId } });
    await deleteOwnImages(a.folder, l.images.map(i => i.url));
    revalidateRentals(a);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar el anuncio.');
  }
}

export async function setRentalFeatured(listingId: string, isFeatured: boolean): Promise<ActionResult> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso para realizar esta acción.' };
  await prisma.rentalListing.update({ where: { id: listingId }, data: { isFeatured } });
  revalidateTag('rentals');
  return { success: true };
}

// ---------------------------------------------------------------- advertiser reads

export async function getAdvertiserListings(scope: string): Promise<RentalListing[]> {
  const check = await resolveAdvertiser(scope);
  if (!check.ok) return [];
  const rows = await prisma.rentalListing.findMany({ where: check.advertiser.where, include: rentalInclude, orderBy: { updatedAt: 'desc' } });
  return rows.map(toRentalListing);
}

export async function getListingForEdit(listingId: string): Promise<RentalListing | undefined> {
  const check = await resolveListingAdvertiser(listingId);
  if (!check.ok) return undefined;
  const row = await prisma.rentalListing.findUnique({ where: { id: listingId }, include: rentalInclude });
  return row ? toRentalListing(row) : undefined;
}

// What a signed-in person can do as a private advertiser (for the
// "Mis alquileres" page): their published count and the limit.
export async function getMyPrivateRentalsInfo(): Promise<{ signedIn: boolean; emailVerified: boolean; active: number; limit: number }> {
  const check = await resolveAdvertiser(PRIVATE_SCOPE);
  if (!check.ok) return { signedIn: false, emailVerified: false, active: 0, limit: MAX_PRIVATE_ACTIVE_LISTINGS };
  const writable = await resolveAdvertiser(PRIVATE_SCOPE, { forWrite: true });
  const active = await prisma.rentalListing.count({ where: { ...check.advertiser.where, status: 'active' } });
  return { signedIn: true, emailVerified: writable.ok, active, limit: MAX_PRIVATE_ACTIVE_LISTINGS };
}

// ---------------------------------------------------------------- public

// Fire-and-forget from the listing page; the advertiser's own visits don't count.
export async function recordRentalView(listingId: string): Promise<void> {
  try {
    if (typeof listingId !== 'string' || listingId.length > 128) return;
    const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { status: true, ownerId: true, company: { select: { ownerId: true } } } });
    if (!l || l.status !== 'active') return;
    const caller = await getCurrentCaller();
    if (caller && (caller.uid === l.company?.ownerId || caller.uid === l.ownerId)) return;
    // Raw SQL so the @updatedAt timestamp isn't bumped by views.
    await prisma.$executeRaw`UPDATE rental_listings SET viewCount = viewCount + 1 WHERE id = ${listingId}`;
  } catch {
    // analytics only
  }
}
