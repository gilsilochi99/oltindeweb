'use server';

import { randomBytes, randomInt } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { sendNotificationToUser } from '../notifications';
import type { ActionResult } from '../shop/types';
import { publicRentalWhere, rentalInclude, toRentalListing } from './db';
import {
  HOLDING_STATUSES, addDaysIso, isoDate, parseIsoDate, quoteBooking, rangesOverlap, todayIsoGQ, unitLabel,
  type BookingRequestInput, type BusyRange, type RentalBooking, type RentalBookingStatus,
} from './types';

// Booking requests and availability for the rentals module.
//
// A request holds its dates while pending; the advertiser accepts or
// rejects it. Overlap checks run inside a transaction holding a row lock on
// the listing (SELECT ... FOR UPDATE), so two simultaneous requests for the
// same dates can't both get through — MySQL has no exclusion constraints.
// Prices are always computed here, never taken from the client.

class BookingError extends Error {}

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  if (error instanceof BookingError) return { success: false, message: error.message };
  console.error(fallback, error);
  return { success: false, message: fallback };
}

const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha no válida.').refine(s => !Number.isNaN(parseIsoDate(s).getTime()), 'Fecha no válida.');
const MAX_SHORT_UNITS = 365;
const MAX_MONTHS = 60;
const MAX_AHEAD_DAYS = 548; // ~18 months

const bookingInclude = { events: { orderBy: { createdAt: 'asc' } }, company: { select: { name: true } } } satisfies Prisma.RentalBookingInclude;
type BookingRow = Prisma.RentalBookingGetPayload<{ include: typeof bookingInclude }>;

function toBooking(b: BookingRow, opts: { withToken?: boolean; withCommission?: boolean } = {}): RentalBooking {
  return {
    id: b.id,
    bookingNumber: b.bookingNumber,
    accessToken: opts.withToken ? b.accessToken : undefined,
    listingId: b.listingId ?? undefined,
    companyId: b.companyId,
    companyName: b.company.name,
    customerId: b.customerId ?? undefined,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail ?? undefined,
    listingTitle: b.listingTitle,
    listingSlug: b.listingSlug ?? undefined,
    listingImage: b.listingImage ?? undefined,
    category: b.category,
    term: b.term,
    startDate: isoDate(b.startDate),
    endDate: isoDate(b.endDate),
    units: b.units,
    guests: b.guests ?? undefined,
    withDriver: b.withDriver,
    unitPrice: Number(b.unitPrice),
    driverFee: Number(b.driverFee),
    subtotal: Number(b.subtotal),
    deposit: Number(b.deposit),
    total: Number(b.total),
    commissionPercent: opts.withCommission ? Number(b.commissionPercent) : 0,
    commissionAmount: opts.withCommission ? Number(b.commissionAmount) : 0,
    message: b.message ?? undefined,
    status: b.status,
    ownerNote: b.ownerNote ?? undefined,
    // A customer cancellation leaves ownerNote empty; their reason lives on the event.
    cancelReason: b.status === 'cancelled' && !b.ownerNote ? (b.events.findLast(e => e.status === 'cancelled')?.note ?? undefined) : undefined,
    events: b.events.map(e => ({ id: e.id, status: e.status, note: e.note ?? undefined, createdAt: e.createdAt.toISOString() })),
    createdAt: b.createdAt.toISOString(),
  };
}

// Pending requests whose start date has passed no longer hold the calendar.
function holdingWhere(today: string): Prisma.RentalBookingWhereInput {
  return {
    OR: [
      { status: 'accepted' },
      { status: 'pending', startDate: { gte: parseIsoDate(today) } },
    ],
  };
}

async function busyRanges(tx: Prisma.TransactionClient | typeof prisma, listingId: string, from: string, to: string): Promise<BusyRange[]> {
  const today = todayIsoGQ();
  const [bookings, blocks] = await Promise.all([
    tx.rentalBooking.findMany({
      where: { listingId, AND: [holdingWhere(today)], startDate: { lt: parseIsoDate(to) }, endDate: { gt: parseIsoDate(from) } },
      select: { startDate: true, endDate: true },
    }),
    tx.rentalBlock.findMany({
      where: { listingId, startDate: { lt: parseIsoDate(to) }, endDate: { gt: parseIsoDate(from) } },
      select: { startDate: true, endDate: true },
    }),
  ]);
  return [
    ...bookings.map(b => ({ start: isoDate(b.startDate), end: isoDate(b.endDate), kind: 'booking' as const })),
    ...blocks.map(b => ({ start: isoDate(b.startDate), end: isoDate(b.endDate), kind: 'block' as const })),
  ];
}

// ---------------------------------------------------------------- public

// Busy date ranges for the booking calendar (dates only, no customer data).
export async function getAvailability(listingId: string): Promise<BusyRange[]> {
  if (typeof listingId !== 'string' || listingId.length > 128) return [];
  const today = todayIsoGQ();
  const ranges = await busyRanges(prisma, listingId, today, addDaysIso(today, MAX_AHEAD_DAYS));
  return ranges.map(r => ({ ...r, kind: 'booking' as const })); // don't reveal which are manual blocks
}

const requestSchema = z.object({
  listingId: z.string().min(1).max(128),
  term: z.enum(['short', 'long']),
  startDate: isoDateSchema,
  endDate: isoDateSchema.optional(),
  months: z.coerce.number().int().min(1).max(MAX_MONTHS).optional(),
  guests: z.coerce.number().int().min(1).max(500).optional(),
  withDriver: z.boolean().optional(),
  customerName: z.string().trim().min(2, 'Indique su nombre.').max(255),
  customerPhone: z.string().trim().min(6, 'Indique un teléfono válido.').max(64).regex(/^[+\d\s()-]+$/, 'Indique un teléfono válido.'),
  customerEmail: z.string().trim().email('Correo electrónico no válido.').max(255).optional().or(z.literal('')),
  message: z.string().trim().max(2000).optional(),
});

const NUMBER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function newBookingNumber() {
  let s = '';
  for (let i = 0; i < 6; i++) s += NUMBER_ALPHABET[randomInt(NUMBER_ALPHABET.length)];
  return `ALQ-${s}`;
}

export async function requestBooking(input: BookingRequestInput): Promise<ActionResult<{ token: string; bookingNumber: string }>> {
  try {
    const data = requestSchema.parse(input);
    const caller = await getCurrentCaller();
    const row = await prisma.rentalListing.findFirst({ where: { id: data.listingId, ...publicRentalWhere }, include: { ...rentalInclude, company: { select: { name: true, ownerId: true } } } });
    if (!row) return { success: false, message: 'Este anuncio ya no está disponible.' };
    const listing = toRentalListing(row);
    const today = todayIsoGQ();

    if (data.startDate < today) throw new BookingError('La fecha de inicio no puede ser anterior a hoy.');
    if (data.startDate > addDaysIso(today, MAX_AHEAD_DAYS)) throw new BookingError('Solo se aceptan reservas para los próximos 18 meses.');

    if (data.term === 'short') {
      if (!listing.shortTermEnabled) throw new BookingError(`Este anuncio no se alquila por ${unitLabel(listing.category, true)}.`);
      if (!data.endDate || data.endDate <= data.startDate) throw new BookingError('Elija la fecha de salida o devolución.');
    } else {
      if (!listing.longTermEnabled) throw new BookingError('Este anuncio no se alquila por meses.');
      if (!data.months) throw new BookingError('Indique cuántos meses.');
      if (data.months < listing.minMonths) throw new BookingError(`El mínimo es de ${listing.minMonths} meses.`);
    }
    if (listing.category === 'vehicle' && listing.driverOption === 'none' && data.withDriver) throw new BookingError('Este vehículo se alquila sin conductor.');

    const quote = quoteBooking(listing, data);
    if (!quote) throw new BookingError('No se pudo calcular el precio de estas fechas.');
    if (data.term === 'short') {
      if (quote.units < listing.minUnits) throw new BookingError(`El mínimo es de ${listing.minUnits} ${unitLabel(listing.category, listing.minUnits !== 1)}.`);
      if (quote.units > (listing.maxUnits ?? MAX_SHORT_UNITS)) throw new BookingError(`El máximo es de ${listing.maxUnits ?? MAX_SHORT_UNITS} ${unitLabel(listing.category, true)}.`);
    }
    const capacity = listing.category === 'property' ? listing.maxGuests : listing.seats;
    if (data.guests && capacity && data.guests > capacity) throw new BookingError(`Capacidad máxima: ${capacity} ${listing.category === 'property' ? 'personas' : 'plazas'}.`);

    // Light abuse guard: a phone number can hold at most 3 open requests per listing.
    const open = await prisma.rentalBooking.count({ where: { listingId: listing.id, customerPhone: data.customerPhone, status: 'pending' } });
    if (open >= 3) throw new BookingError('Ya tiene varias solicitudes pendientes para este anuncio. Espere la respuesta de la empresa.');

    const fees = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { rentalFees: true } });
    const commissionPercent = Number((fees?.rentalFees as { commissionPercent?: number } | null)?.commissionPercent ?? 0);
    const commissionAmount = Math.round(quote.subtotal * commissionPercent / 100);
    const token = randomBytes(24).toString('base64url');
    const withDriver = quote.driverFee > 0 || (listing.category === 'vehicle' && listing.driverOption === 'required');

    const booking = await prisma.$transaction(async (tx) => {
      // Serialises requests for this listing until the transaction ends.
      await tx.$queryRaw`SELECT id FROM rental_listings WHERE id = ${listing.id} FOR UPDATE`;
      const busy = await busyRanges(tx, listing.id, data.startDate, quote.endDate);
      if (busy.some(r => rangesOverlap(r.start, r.end, data.startDate, quote.endDate))) {
        throw new BookingError('Esas fechas ya no están disponibles. Elija otras.');
      }
      let bookingNumber = newBookingNumber();
      for (let i = 0; i < 4 && (await tx.rentalBooking.count({ where: { bookingNumber } })); i++) bookingNumber = newBookingNumber();
      return tx.rentalBooking.create({
        data: {
          bookingNumber, accessToken: token,
          listingId: listing.id, companyId: listing.companyId,
          customerId: caller?.uid ?? null,
          customerName: data.customerName, customerPhone: data.customerPhone, customerEmail: data.customerEmail || null,
          listingTitle: listing.title, listingSlug: listing.slug, listingImage: listing.images[0]?.url ?? null,
          category: listing.category, term: data.term,
          startDate: parseIsoDate(data.startDate), endDate: parseIsoDate(quote.endDate),
          units: quote.units, guests: data.guests ?? null, withDriver,
          unitPrice: quote.unitPrice, driverFee: quote.driverFee, subtotal: quote.subtotal, deposit: quote.deposit, total: quote.total,
          commissionPercent, commissionAmount,
          message: data.message || null,
          events: { create: { status: 'pending', actorId: caller?.uid ?? null } },
        },
      });
    }, { timeout: 15000 });

    if (row.company.ownerId) {
      await sendNotificationToUser(row.company.ownerId, {
        message: `Nueva solicitud de alquiler ${booking.bookingNumber} de ${data.customerName}: ${listing.title}.`,
        link: `/dashboard/companies/${listing.companyId}/rentals/bookings`,
      }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${listing.companyId}/rentals/bookings`);
    return { success: true, token, bookingNumber: booking.bookingNumber };
  } catch (error) {
    return fail(error, 'No se pudo enviar la solicitud. Inténtelo de nuevo.');
  }
}

// ---------------------------------------------------------------- customer side

// The token is the guest receipt secret; signed-in customers also see their
// bookings from their account.
export async function getBookingByToken(token: string): Promise<RentalBooking | undefined> {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{20,64}$/.test(token)) return undefined;
  const row = await prisma.rentalBooking.findUnique({ where: { accessToken: token }, include: bookingInclude });
  return row ? toBooking(row, { withToken: true }) : undefined;
}

export async function getMyBookings(): Promise<RentalBooking[]> {
  const caller = await getCurrentCaller();
  if (!caller) return [];
  const rows = await prisma.rentalBooking.findMany({ where: { customerId: caller.uid }, include: bookingInclude, orderBy: { createdAt: 'desc' }, take: 100 });
  return rows.map(r => toBooking(r, { withToken: true }));
}

async function changeStatus(bookingId: string, from: RentalBookingStatus[], to: RentalBookingStatus, actorId: string | null, note?: string, byCustomer = false) {
  await prisma.$transaction(async (tx) => {
    const res = await tx.rentalBooking.updateMany({
      where: { id: bookingId, status: { in: from } },
      data: { status: to, ...(note === undefined || byCustomer ? {} : { ownerNote: note || null }) },
    });
    if (res.count === 0) throw new BookingError('La reserva cambió mientras tanto. Recargue la página.');
    await tx.rentalBookingEvent.create({ data: { bookingId, status: to, note: note || null, actorId } });
    if (to === 'accepted') {
      const b = await tx.rentalBooking.findUniqueOrThrow({ where: { id: bookingId }, select: { listingId: true } });
      if (b.listingId) await tx.$executeRaw`UPDATE rental_listings SET bookingCount = bookingCount + 1 WHERE id = ${b.listingId}`;
    }
  });
  revalidateTag('rentals');
}

// Customer cancellation: their own booking (signed in) or via the guest link,
// while it hasn't started yet.
export async function cancelMyBooking(bookingId: string, token?: string, reason?: string): Promise<ActionResult> {
  try {
    const b = await prisma.rentalBooking.findUnique({ where: { id: bookingId }, select: { customerId: true, accessToken: true, status: true, startDate: true, companyId: true, bookingNumber: true, customerName: true, company: { select: { ownerId: true } } } });
    if (!b) return { success: false, message: 'Reserva no encontrada.' };
    const caller = await getCurrentCaller();
    const allowed = (caller && b.customerId === caller.uid) || (!!token && token === b.accessToken);
    if (!allowed) return { success: false, message: 'No tiene permiso para cancelar esta reserva.' };
    if (!['pending', 'accepted'].includes(b.status)) return { success: false, message: 'Esta reserva ya no se puede cancelar.' };
    if (b.status === 'accepted' && isoDate(b.startDate) <= todayIsoGQ()) return { success: false, message: 'La reserva ya ha empezado. Contacte con la empresa.' };
    await changeStatus(bookingId, ['pending', 'accepted'], 'cancelled', caller?.uid ?? null, reason?.trim().slice(0, 512) || 'Cancelada por el cliente', true);
    if (b.company.ownerId) {
      await sendNotificationToUser(b.company.ownerId, { message: `${b.customerName} canceló la reserva ${b.bookingNumber}.`, link: `/dashboard/companies/${b.companyId}/rentals/bookings` }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${b.companyId}/rentals/bookings`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cancelar la reserva.');
  }
}

// ---------------------------------------------------------------- advertiser side

async function advertiser(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const c = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return c?.ownerId === caller.uid ? caller : null;
}

export async function getAdvertiserBookings(companyId: string, status?: RentalBookingStatus): Promise<{ bookings: RentalBooking[]; counts: Record<string, number> }> {
  if (!(await advertiser(companyId))) return { bookings: [], counts: {} };
  const [rows, grouped] = await Promise.all([
    prisma.rentalBooking.findMany({ where: { companyId, ...(status ? { status } : {}) }, include: bookingInclude, orderBy: [{ status: 'asc' }, { startDate: 'asc' }], take: 200 }),
    prisma.rentalBooking.groupBy({ by: ['status'], where: { companyId }, _count: { _all: true } }),
  ]);
  return { bookings: rows.map(r => toBooking(r, { withCommission: true })), counts: Object.fromEntries(grouped.map(g => [g.status, g._count._all])) };
}

const ADVERTISER_TRANSITIONS: Record<'accepted' | 'rejected' | 'cancelled' | 'completed', RentalBookingStatus[]> = {
  accepted: ['pending'],
  rejected: ['pending'],
  cancelled: ['accepted'],
  completed: ['accepted'],
};

export async function respondToBooking(bookingId: string, to: 'accepted' | 'rejected' | 'cancelled' | 'completed', note?: string): Promise<ActionResult> {
  try {
    z.enum(['accepted', 'rejected', 'cancelled', 'completed']).parse(to);
    const b = await prisma.rentalBooking.findUnique({ where: { id: bookingId }, select: { companyId: true, status: true, endDate: true, customerId: true, bookingNumber: true, listingTitle: true, accessToken: true } });
    if (!b) return { success: false, message: 'Reserva no encontrada.' };
    const caller = await advertiser(b.companyId);
    if (!caller) return { success: false, message: 'No tiene permiso para gestionar esta reserva.' };
    if (!ADVERTISER_TRANSITIONS[to].includes(b.status)) return { success: false, message: 'Esta acción no es posible en el estado actual de la reserva.' };
    const cleanNote = note?.trim().slice(0, 512);
    if ((to === 'rejected' || to === 'cancelled') && !cleanNote) return { success: false, message: 'Indique el motivo para el cliente.' };
    if (to === 'completed' && isoDate(b.endDate) > addDaysIso(todayIsoGQ(), 1)) return { success: false, message: 'Solo puede marcarla como finalizada cuando termine el alquiler.' };

    await changeStatus(bookingId, ADVERTISER_TRANSITIONS[to], to, caller.uid, cleanNote ?? '');
    if (b.customerId) {
      const verb = { accepted: 'ha sido aceptada', rejected: 'ha sido rechazada', cancelled: 'ha sido cancelada por la empresa', completed: 'ha finalizado' }[to];
      await sendNotificationToUser(b.customerId, { message: `Su reserva ${b.bookingNumber} (${b.listingTitle}) ${verb}.`, link: `/alquiler/reserva/${b.accessToken}` }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${b.companyId}/rentals/bookings`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo actualizar la reserva.');
  }
}

// ---------------------------------------------------------------- manual blocks

export async function getListingCalendar(listingId: string): Promise<{ blocks: { id: string; start: string; end: string; note?: string }[]; bookings: { id: string; bookingNumber: string; start: string; end: string; status: RentalBookingStatus; customerName: string }[] } | undefined> {
  const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { companyId: true } });
  if (!l || !(await advertiser(l.companyId))) return undefined;
  const today = todayIsoGQ();
  const [blocks, bookings] = await Promise.all([
    prisma.rentalBlock.findMany({ where: { listingId, endDate: { gt: parseIsoDate(today) } }, orderBy: { startDate: 'asc' } }),
    prisma.rentalBooking.findMany({ where: { listingId, AND: [holdingWhere(today)], endDate: { gt: parseIsoDate(today) } }, orderBy: { startDate: 'asc' } }),
  ]);
  return {
    blocks: blocks.map(b => ({ id: b.id, start: isoDate(b.startDate), end: isoDate(b.endDate), note: b.note ?? undefined })),
    bookings: bookings.map(b => ({ id: b.id, bookingNumber: b.bookingNumber, start: isoDate(b.startDate), end: isoDate(b.endDate), status: b.status, customerName: b.customerName })),
  };
}

export async function addBlock(listingId: string, start: string, end: string, note?: string): Promise<ActionResult> {
  try {
    const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { companyId: true } });
    if (!l || !(await advertiser(l.companyId))) return { success: false, message: 'No tiene permiso.' };
    isoDateSchema.parse(start);
    isoDateSchema.parse(end);
    if (end <= start) return { success: false, message: 'La fecha final debe ser posterior a la inicial.' };
    if (end < todayIsoGQ()) return { success: false, message: 'No se pueden bloquear fechas pasadas.' };
    await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM rental_listings WHERE id = ${listingId} FOR UPDATE`;
      const busy = await busyRanges(tx, listingId, start, end);
      if (busy.some(r => r.kind === 'booking' && rangesOverlap(r.start, r.end, start, end))) {
        throw new BookingError('Hay reservas en esas fechas. Respóndalas antes de bloquearlas.');
      }
      await tx.rentalBlock.create({ data: { listingId, startDate: parseIsoDate(start), endDate: parseIsoDate(end), note: note?.trim().slice(0, 255) || null } });
    });
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudieron bloquear las fechas.');
  }
}

export async function removeBlock(blockId: string): Promise<ActionResult> {
  const b = await prisma.rentalBlock.findUnique({ where: { id: blockId }, select: { listing: { select: { companyId: true } } } });
  if (!b || !(await advertiser(b.listing.companyId))) return { success: false, message: 'No tiene permiso.' };
  await prisma.rentalBlock.delete({ where: { id: blockId } });
  return { success: true };
}

// ---------------------------------------------------------------- admin

export async function getRentalFeesForAdmin(): Promise<number | undefined> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return undefined;
  const s = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { rentalFees: true } });
  return Number((s?.rentalFees as { commissionPercent?: number } | null)?.commissionPercent ?? 0);
}

export async function saveRentalFees(commissionPercent: number): Promise<ActionResult> {
  const caller = await getCurrentCaller();
  if (!caller || caller.role !== 'admin') return { success: false, message: 'Solo un administrador puede cambiar las comisiones.' };
  const pct = z.coerce.number().min(0).max(50).safeParse(commissionPercent);
  if (!pct.success) return { success: false, message: 'Indique un porcentaje entre 0 y 50.' };
  await prisma.siteSettings.update({ where: { id: 'main' }, data: { rentalFees: { commissionPercent: pct.data } } });
  return { success: true };
}

