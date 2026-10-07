'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma } from '../db';
import { getCurrentCaller, isManagerRole, type Caller } from '../firebase-admin';
import { deleteUploadByUrl } from '../uploads';
import { rentalInclude, toRentalListing, uniqueRentalSlug } from './db';
import { PROPERTY_KINDS, VEHICLE_KINDS, type RentalListing, type RentalListingInput, type RentalStatus } from './types';
import type { ActionResult } from '../shop/types';

// Advertiser-side writes for the rentals module. Every action re-checks the
// caller and validates its input with zod.

const MAX_IMAGES = 15;

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  console.error(fallback, error);
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

function revalidateRentals(companyId: string) {
  revalidateTag('rentals');
  revalidatePath(`/dashboard/companies/${companyId}/rentals`);
}

// Only files in this company's own rentals/<companyId>/ folder are ever
// deleted — image URLs come from the client.
async function deleteOwnImages(companyId: string, urls: string[]) {
  const own = Array.from(new Set(urls)).filter(u => u.includes(`/rentals/${companyId}/`));
  await Promise.allSettled(own.map(u => deleteUploadByUrl(u)));
}

// ---------------------------------------------------------------- permissions

type Check = { ok: true; caller: Caller } | { ok: false; message: string };

// Same rule as the shop: the owner of a Premium company, or a manager.
async function checkAdvertiser(companyId: string): Promise<Check> {
  const caller = await getCurrentCaller();
  if (!caller) return { ok: false, message: 'Debe iniciar sesión para realizar esta acción.' };
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true, isPremium: true } });
  if (!company) return { ok: false, message: 'Empresa no encontrada.' };
  if (isManagerRole(caller.role)) return { ok: true, caller };
  if (company.ownerId !== caller.uid) return { ok: false, message: 'No tiene permiso para gestionar los alquileres de esta empresa.' };
  if (!company.isPremium) return { ok: false, message: 'Los alquileres están disponibles para empresas Premium.' };
  return { ok: true, caller };
}

async function checkListing(listingId: string): Promise<Check & { companyId?: string }> {
  const listing = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { companyId: true } });
  if (!listing) return { ok: false, message: 'Anuncio no encontrado.' };
  return { ...(await checkAdvertiser(listing.companyId)), companyId: listing.companyId };
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
  category: z.enum(['property', 'vehicle']),
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
  deposit: optMoney,
  priceNotes: optText(512),
  bedrooms: optInt(0, 100),
  bathrooms: optInt(0, 100),
  areaM2: optInt(1, 1000000),
  maxGuests: optInt(1, 500),
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
  const kinds = l.category === 'property' ? PROPERTY_KINDS : VEHICLE_KINDS;
  if (!(l.kind in kinds)) ctx.addIssue({ code: 'custom', message: 'Elija el tipo de inmueble o vehículo.' });
  if (l.maxUnits !== undefined && l.maxUnits < l.minUnits) ctx.addIssue({ code: 'custom', message: 'El máximo no puede ser menor que el mínimo.' });
  if (l.status === 'active') {
    if (!l.shortTermEnabled && !l.longTermEnabled) ctx.addIssue({ code: 'custom', message: 'Active el alquiler por días/noches, por meses, o ambos.' });
    if (l.shortTermEnabled && !l.dailyPrice) ctx.addIssue({ code: 'custom', message: `Indique el precio por ${l.category === 'property' ? 'noche' : 'día'}.` });
    if (l.longTermEnabled && !l.monthlyPrice) ctx.addIssue({ code: 'custom', message: 'Indique el precio por mes.' });
    if (l.images.length === 0) ctx.addIssue({ code: 'custom', message: 'Añada al menos una foto antes de publicar.' });
    if (l.description.length < 20) ctx.addIssue({ code: 'custom', message: 'La descripción debe tener al menos 20 caracteres para publicar.' });
  }
});

function listingData(l: z.infer<typeof listingSchema>) {
  const isProperty = l.category === 'property';
  return {
    title: l.title,
    description: l.description,
    category: l.category,
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
    deposit: l.deposit ?? null,
    priceNotes: l.priceNotes ?? null,
    // Fields of the other category are cleared so a listing switched from
    // vehicle to property doesn't keep stale details.
    bedrooms: isProperty ? l.bedrooms ?? null : null,
    bathrooms: isProperty ? l.bathrooms ?? null : null,
    areaM2: isProperty ? l.areaM2 ?? null : null,
    maxGuests: isProperty ? l.maxGuests ?? null : null,
    furnished: isProperty ? l.furnished ?? null : null,
    brand: isProperty ? null : l.brand ?? null,
    model: isProperty ? null : l.model ?? null,
    year: isProperty ? null : l.year ?? null,
    transmission: isProperty ? null : l.transmission ?? null,
    fuel: isProperty ? null : l.fuel ?? null,
    seats: isProperty ? null : l.seats ?? null,
    driverOption: isProperty ? null : l.driverOption ?? 'none',
    driverDailyFee: isProperty || l.driverOption === 'none' ? null : l.driverDailyFee ?? null,
    amenities: Array.from(new Set(l.amenities)),
    rules: l.rules ?? null,
  };
}

// ---------------------------------------------------------------- listings

export async function createRentalListing(companyId: string, input: RentalListingInput): Promise<ActionResult<{ id: string }>> {
  try {
    const check = await checkAdvertiser(companyId);
    if (!check.ok) return { success: false, message: check.message };
    const data = listingSchema.parse(input);
    const listing = await prisma.rentalListing.create({
      data: {
        ...listingData(data),
        companyId,
        slug: await uniqueRentalSlug(data.title),
        publishedAt: data.status === 'active' ? new Date() : null,
        images: { create: data.images.map((url, position) => ({ url, position })) },
      },
    });
    revalidateRentals(companyId);
    return { success: true, id: listing.id };
  } catch (error) {
    return fail(error, 'No se pudo crear el anuncio.');
  }
}

export async function updateRentalListing(listingId: string, input: RentalListingInput): Promise<ActionResult> {
  try {
    const check = await checkListing(listingId);
    if (!check.ok) return { success: false, message: check.message };
    const data = listingSchema.parse(input);
    const current = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, select: { publishedAt: true, images: { select: { url: true } } } });

    await prisma.$transaction([
      prisma.rentalListing.update({
        where: { id: listingId },
        data: { ...listingData(data), publishedAt: data.status === 'active' && !current.publishedAt ? new Date() : undefined },
      }),
      prisma.rentalImage.deleteMany({ where: { listingId } }),
      prisma.rentalImage.createMany({ data: data.images.map((url, position) => ({ listingId, url, position })) }),
    ]);

    const kept = new Set(data.images);
    await deleteOwnImages(check.companyId!, current.images.map(i => i.url).filter(u => !kept.has(u)));
    revalidateRentals(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar el anuncio.');
  }
}

export async function setRentalStatus(listingId: string, status: RentalStatus): Promise<ActionResult> {
  try {
    const check = await checkListing(listingId);
    if (!check.ok) return { success: false, message: check.message };
    z.enum(['draft', 'active', 'archived']).parse(status);
    const l = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, include: rentalInclude });
    if (status === 'active') {
      // Re-run the publish rules on the stored listing.
      const listing = toRentalListing(l);
      const result = listingSchema.safeParse({ ...listing, status: 'active', images: listing.images.map(i => i.url) });
      if (!result.success) return { success: false, message: result.error.issues[0]?.message ?? 'Complete el anuncio antes de publicar.' };
    }
    await prisma.rentalListing.update({
      where: { id: listingId },
      data: { status, publishedAt: status === 'active' && !l.publishedAt ? new Date() : undefined },
    });
    revalidateRentals(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cambiar el estado del anuncio.');
  }
}

export async function deleteRentalListing(listingId: string): Promise<ActionResult> {
  try {
    const check = await checkListing(listingId);
    if (!check.ok) return { success: false, message: check.message };
    const active = await prisma.rentalBooking.count({ where: { listingId, status: { in: ['pending', 'accepted'] } } });
    if (active > 0) return { success: false, message: 'Este anuncio tiene reservas pendientes o aceptadas. Archívelo en lugar de eliminarlo.' };
    const l = await prisma.rentalListing.findUniqueOrThrow({ where: { id: listingId }, select: { images: { select: { url: true } } } });
    await prisma.rentalListing.delete({ where: { id: listingId } });
    await deleteOwnImages(check.companyId!, l.images.map(i => i.url));
    revalidateRentals(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar el anuncio.');
  }
}

export async function setRentalFeatured(listingId: string, isFeatured: boolean): Promise<ActionResult> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso para realizar esta acción.' };
  const l = await prisma.rentalListing.update({ where: { id: listingId }, data: { isFeatured }, select: { companyId: true } });
  revalidateRentals(l.companyId);
  return { success: true };
}

// ---------------------------------------------------------------- advertiser reads

async function canManage(companyId: string): Promise<boolean> {
  const caller = await getCurrentCaller();
  if (!caller) return false;
  if (isManagerRole(caller.role)) return true;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid;
}

export async function getAdvertiserListings(companyId: string): Promise<RentalListing[]> {
  if (!(await canManage(companyId))) return [];
  const rows = await prisma.rentalListing.findMany({ where: { companyId }, include: rentalInclude, orderBy: { updatedAt: 'desc' } });
  return rows.map(toRentalListing);
}

export async function getListingForEdit(listingId: string): Promise<RentalListing | undefined> {
  const row = await prisma.rentalListing.findUnique({ where: { id: listingId }, include: rentalInclude });
  if (!row || !(await canManage(row.companyId))) return undefined;
  return toRentalListing(row);
}

// ---------------------------------------------------------------- public

// Fire-and-forget from the listing page; the advertiser's own visits don't count.
export async function recordRentalView(listingId: string): Promise<void> {
  try {
    if (typeof listingId !== 'string' || listingId.length > 128) return;
    const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { status: true, company: { select: { ownerId: true } } } });
    if (!l || l.status !== 'active') return;
    const caller = await getCurrentCaller();
    if (caller && caller.uid === l.company.ownerId) return;
    // Raw SQL so the @updatedAt timestamp isn't bumped by views.
    await prisma.$executeRaw`UPDATE rental_listings SET viewCount = viewCount + 1 WHERE id = ${listingId}`;
  } catch {
    // analytics only
  }
}
