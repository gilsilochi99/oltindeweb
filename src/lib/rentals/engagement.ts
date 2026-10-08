'use server';

import { revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { sendNotificationToUser } from '../notifications';
import type { ActionResult } from '../shop/types';
import { addDaysIso, isoDate, todayIsoGQ, type RentalReviewEligibility, type RentalReviewsData, type RentalStats } from './types';

// Reviews, advertiser statistics and admin moderation for the rentals module.

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  console.error(fallback, error);
  return { success: false, message: fallback };
}

async function canManageCompany(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid ? caller : null;
}

// ---------------------------------------------------------------- reviews

export async function getRentalReviews(listingId: string): Promise<RentalReviewsData> {
  const rows = typeof listingId === 'string' && listingId.length <= 128
    ? await prisma.review.findMany({ where: { targetType: 'rental', targetId: listingId }, orderBy: { date: 'desc' }, take: 200 })
    : [];
  const distribution = [0, 0, 0, 0, 0];
  for (const r of rows) distribution[Math.min(5, Math.max(1, r.rating)) - 1]++;
  return {
    reviews: rows.map(r => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      date: r.date.toISOString(),
      replyText: r.replyText ?? undefined,
      replyDate: r.replyDate?.toISOString(),
    })),
    count: rows.length,
    average: rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0,
    distribution,
  };
}

// A customer may review a listing once a booking of theirs for it has ended
// (marked finished, or accepted and its last day has passed).
async function hasStayed(uid: string, listingId: string): Promise<boolean> {
  const tomorrow = new Date(`${addDaysIso(todayIsoGQ(), 1)}T00:00:00.000Z`);
  const n = await prisma.rentalBooking.count({
    where: {
      listingId,
      customerId: uid,
      OR: [{ status: 'completed' }, { status: 'accepted', endDate: { lte: tomorrow } }],
    },
  });
  return n > 0;
}

export async function getRentalReviewEligibility(listingId: string): Promise<RentalReviewEligibility> {
  const caller = await getCurrentCaller();
  if (!caller) return { canReview: false, reason: 'signin' };
  if (!(await hasStayed(caller.uid, listingId))) return { canReview: false, reason: 'not_stayed' };
  const existing = await prisma.review.findFirst({ where: { targetType: 'rental', targetId: listingId, authorId: caller.uid }, select: { rating: true, comment: true } });
  return { canReview: true, existing: existing ?? undefined };
}

async function recomputeRating(tx: Prisma.TransactionClient | typeof prisma, listingId: string) {
  const agg = await tx.review.aggregate({ where: { targetType: 'rental', targetId: listingId }, _avg: { rating: true }, _count: { _all: true } });
  const avg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
  // Raw SQL so a review doesn't bump the listing's "last edited" timestamp.
  await tx.$executeRaw`UPDATE rental_listings SET ratingAvg = ${avg}, ratingCount = ${agg._count._all} WHERE id = ${listingId}`;
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Elija de 1 a 5 estrellas.').max(5),
  comment: z.string().trim().min(10, 'Escriba al menos 10 caracteres.').max(3000),
});

export async function submitRentalReview(listingId: string, input: { rating: number; comment: string }): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    if (!caller) return { success: false, message: 'Inicie sesión para valorar este alquiler.' };
    const data = reviewSchema.parse(input);
    const listing = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { slug: true, title: true, company: { select: { ownerId: true } } } });
    if (!listing) return { success: false, message: 'Anuncio no encontrado.' };
    if (!(await hasStayed(caller.uid, listingId))) {
      return { success: false, message: 'Solo pueden valorar los clientes cuya reserva ya ha terminado.' };
    }
    const existing = await prisma.review.findFirst({ where: { targetType: 'rental', targetId: listingId, authorId: caller.uid }, select: { id: true } });
    const user = await prisma.user.findUnique({ where: { id: caller.uid }, select: { displayName: true } });
    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.review.update({ where: { id: existing.id }, data: { rating: data.rating, comment: data.comment, date: new Date() } });
      } else {
        await tx.review.create({
          data: {
            targetType: 'rental', targetId: listingId, authorId: caller.uid, author: user?.displayName?.trim() || 'Cliente',
            rating: data.rating, comment: data.comment, date: new Date(), isVerifiedPurchase: true,
          },
        });
      }
      await recomputeRating(tx, listingId);
    });
    if (!existing && listing.company.ownerId) {
      await sendNotificationToUser(listing.company.ownerId, {
        message: `Nueva valoración de ${data.rating}★ en ${listing.title}.`,
        link: `/alquiler/${listing.slug}#valoraciones`,
      }).catch(() => {});
    }
    revalidateTag('rentals');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar la valoración.');
  }
}

async function canManageListing(listingId: string) {
  const listing = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { companyId: true, slug: true, title: true } });
  if (!listing) return null;
  const caller = await canManageCompany(listing.companyId);
  return caller ? { caller, listing } : null;
}

export async function canReplyToRentalReviews(listingId: string): Promise<boolean> {
  return !!(await canManageListing(listingId));
}

export async function replyToRentalReview(reviewId: string, text: string): Promise<ActionResult> {
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { targetType: true, targetId: true, authorId: true } });
    if (!review || review.targetType !== 'rental') return { success: false, message: 'Valoración no encontrada.' };
    const access = await canManageListing(review.targetId);
    if (!access) return { success: false, message: 'No tiene permiso para responder.' };
    const reply = z.string().trim().min(2, 'Escriba una respuesta.').max(2000).parse(text);
    await prisma.review.update({ where: { id: reviewId }, data: { replyText: reply, replyDate: new Date() } });
    if (review.authorId) {
      await sendNotificationToUser(review.authorId, {
        message: `La empresa respondió a su valoración de ${access.listing.title}.`,
        link: `/alquiler/${access.listing.slug}#valoraciones`,
      }).catch(() => {});
    }
    revalidateTag('rentals');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo publicar la respuesta.');
  }
}

export async function deleteRentalReview(reviewId: string): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { targetType: true, targetId: true, authorId: true } });
    if (!caller || !review || review.targetType !== 'rental') return { success: false, message: 'Valoración no encontrada.' };
    if (review.authorId !== caller.uid && !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso para eliminarla.' };
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recomputeRating(tx, review.targetId);
    });
    revalidateTag('rentals');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar la valoración.');
  }
}

// ---------------------------------------------------------------- advertiser statistics

export async function getRentalStats(companyId: string, days = 30): Promise<RentalStats | undefined> {
  if (!(await canManageCompany(companyId))) return undefined;
  const span = [7, 30, 90, 365].includes(days) ? days : 30;
  const since = new Date(Date.now() - span * 86400000);
  const today = new Date(`${todayIsoGQ()}T00:00:00.000Z`);

  const [bookings, pending, listings, upcoming] = await Promise.all([
    prisma.rentalBooking.findMany({
      where: { companyId, createdAt: { gte: since } },
      select: { listingId: true, listingTitle: true, listingSlug: true, status: true, term: true, units: true, total: true, commissionAmount: true, createdAt: true },
    }),
    prisma.rentalBooking.count({ where: { companyId, status: 'pending' } }),
    prisma.rentalListing.findMany({ where: { companyId }, select: { id: true, title: true, slug: true, viewCount: true } }),
    prisma.rentalBooking.findMany({
      where: { companyId, status: 'accepted', startDate: { gte: today } },
      select: { id: true, bookingNumber: true, listingTitle: true, customerName: true, startDate: true, endDate: true },
      orderBy: { startDate: 'asc' },
      take: 10,
    }),
  ]);

  const won = bookings.filter(b => b.status === 'accepted' || b.status === 'completed');
  const rejected = bookings.filter(b => b.status === 'rejected').length;
  const answered = won.length + rejected;

  const daily = new Map<string, { requests: number; accepted: number }>();
  for (let i = span - 1; i >= 0; i--) daily.set(isoDate(new Date(Date.now() - i * 86400000)), { requests: 0, accepted: 0 });
  for (const b of bookings) {
    const bucket = daily.get(isoDate(b.createdAt));
    if (!bucket) continue;
    bucket.requests++;
    if (b.status === 'accepted' || b.status === 'completed') bucket.accepted++;
  }

  const views = new Map(listings.map(l => [l.id, l.viewCount]));
  const top = new Map<string, RentalStats['topListings'][number]>();
  for (const b of bookings) {
    const key = b.listingId ?? b.listingTitle;
    const row = top.get(key) ?? { listingId: b.listingId ?? undefined, title: b.listingTitle, slug: b.listingSlug ?? undefined, requests: 0, accepted: 0, revenue: 0, views: b.listingId ? views.get(b.listingId) ?? 0 : 0 };
    row.requests++;
    if (b.status === 'accepted' || b.status === 'completed') {
      row.accepted++;
      row.revenue += Number(b.total);
    }
    top.set(key, row);
  }
  // Listings with views but no requests yet still belong in the ranking.
  for (const l of listings) {
    if (!top.has(l.id) && l.viewCount > 0) top.set(l.id, { listingId: l.id, title: l.title, slug: l.slug, requests: 0, accepted: 0, revenue: 0, views: l.viewCount });
  }

  return {
    days: span,
    views: listings.reduce((s, l) => s + l.viewCount, 0),
    requests: bookings.length,
    accepted: won.length,
    rejected,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
    pending,
    acceptanceRate: answered ? won.length / answered : 0,
    unitsBooked: won.filter(b => b.term === 'short').reduce((s, b) => s + b.units, 0),
    monthsBooked: won.filter(b => b.term === 'long').reduce((s, b) => s + b.units, 0),
    revenue: won.reduce((s, b) => s + Number(b.total), 0),
    commission: won.reduce((s, b) => s + Number(b.commissionAmount), 0),
    daily: Array.from(daily, ([date, v]) => ({ date, ...v })),
    topListings: Array.from(top.values()).sort((a, b) => b.requests - a.requests || b.views - a.views).slice(0, 5),
    upcoming: upcoming.map(b => ({ id: b.id, bookingNumber: b.bookingNumber, listingTitle: b.listingTitle, customerName: b.customerName, startDate: isoDate(b.startDate), endDate: isoDate(b.endDate) })),
  };
}

// ---------------------------------------------------------------- admin moderation

const ADMIN_PAGE_SIZE = 30;

export async function getAdminRentals(params: { q?: string; status?: 'draft' | 'active' | 'archived'; featured?: boolean; page?: number }) {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return undefined;
  const page = Math.max(1, Math.floor(params.page ?? 1));
  const q = params.q?.trim().slice(0, 100);
  const where: Prisma.RentalListingWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.featured ? { isFeatured: true } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { city: { contains: q } }, { company: { name: { contains: q } } }] } : {}),
  };
  const [rows, total, counts, bookingCounts] = await Promise.all([
    prisma.rentalListing.findMany({
      where,
      select: {
        id: true, slug: true, title: true, category: true, kind: true, city: true, status: true, isFeatured: true,
        dailyPrice: true, monthlyPrice: true, shortTermEnabled: true, longTermEnabled: true, viewCount: true, bookingCount: true,
        ratingAvg: true, ratingCount: true, updatedAt: true,
        company: { select: { id: true, name: true } },
        images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * ADMIN_PAGE_SIZE,
      take: ADMIN_PAGE_SIZE,
    }),
    prisma.rentalListing.count({ where }),
    prisma.rentalListing.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.rentalBooking.groupBy({ by: ['status'], _count: { _all: true } }),
  ]);
  return {
    listings: rows.map(r => ({
      id: r.id, slug: r.slug, title: r.title, category: r.category, kind: r.kind, city: r.city, status: r.status, isFeatured: r.isFeatured,
      dailyPrice: r.shortTermEnabled && r.dailyPrice ? Number(r.dailyPrice) : undefined,
      monthlyPrice: r.longTermEnabled && r.monthlyPrice ? Number(r.monthlyPrice) : undefined,
      viewCount: r.viewCount, bookingCount: r.bookingCount, ratingAvg: Number(r.ratingAvg), ratingCount: r.ratingCount,
      updatedAt: r.updatedAt.toISOString(), companyId: r.company.id, companyName: r.company.name, image: r.images[0]?.url,
    })),
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / ADMIN_PAGE_SIZE)),
    statusCounts: Object.fromEntries(counts.map(c => [c.status, c._count._all])) as Record<string, number>,
    bookingCounts: Object.fromEntries(bookingCounts.map(c => [c.status, c._count._all])) as Record<string, number>,
  };
}

// Managers can unpublish or archive any listing (e.g. reported content).
export async function adminSetRentalStatus(listingId: string, status: 'draft' | 'active' | 'archived'): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    if (!caller || !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso para realizar esta acción.' };
    z.enum(['draft', 'active', 'archived']).parse(status);
    const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { publishedAt: true } });
    if (!l) return { success: false, message: 'Anuncio no encontrado.' };
    // Re-publishing is only for listings the advertiser published before
    // (they passed the publish checks); a draft is published by its owner.
    if (status === 'active' && !l.publishedAt) return { success: false, message: 'Este anuncio nunca se ha publicado: debe publicarlo la empresa.' };
    await prisma.rentalListing.update({ where: { id: listingId }, data: { status } });
    revalidateTag('rentals');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cambiar el estado.');
  }
}
