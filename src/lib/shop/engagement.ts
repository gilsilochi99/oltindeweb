'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { sendNotificationToUser } from '../notifications';
import { productListSelect, publicProductWhere, toProductListItem } from './db';
import {
  couponDiscount, couponProblem, formatXaf,
  type ActionResult, type Coupon, type CouponInput, type ProductListItem, type ProductQuestion, type ProductReviewsData, type SellerStats,
} from './types';

// Reviews, Q&A, wishlist, coupons and seller statistics for the marketplace.

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  console.error(fallback, error);
  return { success: false, message: fallback };
}

async function displayName(uid: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { displayName: true } });
  return user?.displayName?.trim() || 'Cliente';
}

// Owner of the product's company, or a manager.
async function canManageProduct(productId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { companyId: true, slug: true, title: true, company: { select: { ownerId: true } } } });
  if (!product) return null;
  if (!isManagerRole(caller.role) && product.company.ownerId !== caller.uid) return null;
  return { caller, product };
}

async function canManageCompany(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid ? caller : null;
}

// ---------------------------------------------------------------- reviews

export async function getProductReviews(productId: string): Promise<ProductReviewsData> {
  const rows = await prisma.review.findMany({
    where: { targetType: 'product', targetId: productId },
    orderBy: { date: 'desc' },
    take: 200,
  });
  const distribution = [0, 0, 0, 0, 0];
  for (const r of rows) distribution[Math.min(5, Math.max(1, r.rating)) - 1]++;
  return {
    reviews: rows.map(r => ({
      id: r.id,
      author: r.author,
      rating: r.rating,
      comment: r.comment,
      date: r.date.toISOString(),
      isVerifiedPurchase: r.isVerifiedPurchase,
      replyText: r.replyText ?? undefined,
      replyDate: r.replyDate?.toISOString(),
    })),
    count: rows.length,
    average: rows.length ? rows.reduce((s, r) => s + r.rating, 0) / rows.length : 0,
    distribution,
  };
}

async function hasReceivedProduct(uid: string, productId: string) {
  const n = await prisma.shopOrderItem.count({ where: { productId, order: { customerId: uid, status: 'delivered' } } });
  return n > 0;
}

// Only customers who received the product (a delivered order) may review it,
// so every product review is a verified purchase.
export async function getReviewEligibility(productId: string): Promise<{ canReview: boolean; reason?: 'signin' | 'not_purchased'; existing?: { rating: number; comment: string } }> {
  const caller = await getCurrentCaller();
  if (!caller) return { canReview: false, reason: 'signin' };
  if (!(await hasReceivedProduct(caller.uid, productId))) return { canReview: false, reason: 'not_purchased' };
  const existing = await prisma.review.findFirst({ where: { targetType: 'product', targetId: productId, authorId: caller.uid }, select: { rating: true, comment: true } });
  return { canReview: true, existing: existing ?? undefined };
}

async function recomputeRating(tx: Prisma.TransactionClient | typeof prisma, productId: string) {
  const agg = await tx.review.aggregate({ where: { targetType: 'product', targetId: productId }, _avg: { rating: true }, _count: { _all: true } });
  const avg = Math.round((agg._avg.rating ?? 0) * 100) / 100;
  // Raw SQL so a review doesn't bump the product's "last edited" timestamp.
  await tx.$executeRaw`UPDATE products SET ratingAvg = ${avg}, ratingCount = ${agg._count._all} WHERE id = ${productId}`;
}

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Elija de 1 a 5 estrellas.').max(5),
  comment: z.string().trim().min(10, 'Escriba al menos 10 caracteres.').max(3000),
});

export async function submitProductReview(productId: string, input: { rating: number; comment: string }): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    if (!caller) return { success: false, message: 'Inicie sesión para valorar este producto.' };
    const data = reviewSchema.parse(input);
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { slug: true, title: true, companyId: true, company: { select: { ownerId: true } } } });
    if (!product) return { success: false, message: 'Producto no encontrado.' };
    if (!(await hasReceivedProduct(caller.uid, productId))) {
      return { success: false, message: 'Solo pueden valorar los clientes que han recibido este producto.' };
    }

    const existing = await prisma.review.findFirst({ where: { targetType: 'product', targetId: productId, authorId: caller.uid }, select: { id: true } });
    await prisma.$transaction(async (tx) => {
      if (existing) {
        await tx.review.update({ where: { id: existing.id }, data: { rating: data.rating, comment: data.comment, date: new Date() } });
      } else {
        await tx.review.create({
          data: {
            targetType: 'product', targetId: productId, authorId: caller.uid, author: await displayName(caller.uid),
            rating: data.rating, comment: data.comment, date: new Date(), isVerifiedPurchase: true,
          },
        });
      }
      await recomputeRating(tx, productId);
    });

    if (!existing && product.company.ownerId) {
      await sendNotificationToUser(product.company.ownerId, {
        message: `Nueva valoración de ${data.rating}★ en ${product.title}.`,
        link: `/tienda/p/${product.slug}#valoraciones`,
      }).catch(() => {});
    }
    revalidateTag('shop-products');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar la valoración.');
  }
}

export async function replyToProductReview(reviewId: string, text: string): Promise<ActionResult> {
  try {
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { targetType: true, targetId: true, authorId: true } });
    if (!review || review.targetType !== 'product') return { success: false, message: 'Valoración no encontrada.' };
    const access = await canManageProduct(review.targetId);
    if (!access) return { success: false, message: 'No tiene permiso para responder.' };
    const reply = z.string().trim().min(2, 'Escriba una respuesta.').max(2000).parse(text);
    await prisma.review.update({ where: { id: reviewId }, data: { replyText: reply, replyDate: new Date() } });
    if (review.authorId) {
      await sendNotificationToUser(review.authorId, {
        message: `El vendedor respondió a su valoración de ${access.product.title}.`,
        link: `/tienda/p/${access.product.slug}#valoraciones`,
      }).catch(() => {});
    }
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo publicar la respuesta.');
  }
}

export async function deleteProductReview(reviewId: string): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    const review = await prisma.review.findUnique({ where: { id: reviewId }, select: { targetType: true, targetId: true, authorId: true } });
    if (!caller || !review || review.targetType !== 'product') return { success: false, message: 'Valoración no encontrada.' };
    if (review.authorId !== caller.uid && !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso para eliminarla.' };
    await prisma.$transaction(async (tx) => {
      await tx.review.delete({ where: { id: reviewId } });
      await recomputeRating(tx, review.targetId);
    });
    revalidateTag('shop-products');
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar la valoración.');
  }
}

// ---------------------------------------------------------------- questions

function toQuestion(q: Prisma.ProductQuestionGetPayload<{}>): ProductQuestion {
  return {
    id: q.id,
    productId: q.productId,
    authorName: q.authorName,
    question: q.question,
    answer: q.answer ?? undefined,
    answeredAt: q.answeredAt?.toISOString(),
    createdAt: q.createdAt.toISOString(),
  };
}

export async function getProductQuestions(productId: string): Promise<ProductQuestion[]> {
  const rows = await prisma.productQuestion.findMany({
    where: { productId, isHidden: false },
    orderBy: [{ answeredAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
    take: 100,
  });
  return rows.map(toQuestion);
}

export async function askProductQuestion(productId: string, question: string): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    if (!caller) return { success: false, message: 'Inicie sesión para hacer una pregunta.' };
    const text = z.string().trim().min(10, 'Escriba una pregunta de al menos 10 caracteres.').max(1000).parse(question);
    const product = await prisma.product.findFirst({ where: { id: productId, ...publicProductWhere }, select: { title: true, companyId: true, company: { select: { ownerId: true } } } });
    if (!product) return { success: false, message: 'Producto no encontrado.' };

    // Light flood protection: at most 5 open questions per user per product.
    const open = await prisma.productQuestion.count({ where: { productId, authorId: caller.uid, answer: null } });
    if (open >= 5) return { success: false, message: 'Ya tiene varias preguntas pendientes en este producto. Espere la respuesta del vendedor.' };

    await prisma.productQuestion.create({ data: { productId, authorId: caller.uid, authorName: await displayName(caller.uid), question: text } });
    if (product.company.ownerId) {
      await sendNotificationToUser(product.company.ownerId, {
        message: `Nueva pregunta sobre ${product.title}.`,
        link: `/dashboard/companies/${product.companyId}/shop/questions`,
      }).catch(() => {});
    }
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo enviar la pregunta.');
  }
}

export async function answerProductQuestion(questionId: string, answer: string): Promise<ActionResult> {
  try {
    const q = await prisma.productQuestion.findUnique({ where: { id: questionId }, select: { productId: true, authorId: true } });
    if (!q) return { success: false, message: 'Pregunta no encontrada.' };
    const access = await canManageProduct(q.productId);
    if (!access) return { success: false, message: 'No tiene permiso para responder.' };
    const text = z.string().trim().min(2, 'Escriba una respuesta.').max(2000).parse(answer);
    await prisma.productQuestion.update({ where: { id: questionId }, data: { answer: text, answeredAt: new Date(), answeredBy: access.caller.uid } });
    if (q.authorId) {
      await sendNotificationToUser(q.authorId, {
        message: `El vendedor respondió a su pregunta sobre ${access.product.title}.`,
        link: `/tienda/p/${access.product.slug}#preguntas`,
      }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${access.product.companyId}/shop/questions`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar la respuesta.');
  }
}

export async function hideProductQuestion(questionId: string): Promise<ActionResult> {
  const q = await prisma.productQuestion.findUnique({ where: { id: questionId }, select: { productId: true } });
  if (!q || !(await canManageProduct(q.productId))) return { success: false, message: 'No tiene permiso.' };
  await prisma.productQuestion.update({ where: { id: questionId }, data: { isHidden: true } });
  return { success: true };
}

export type SellerQuestion = ProductQuestion & { productTitle: string; productSlug: string };

export async function getSellerQuestions(companyId: string, unansweredOnly = true): Promise<SellerQuestion[]> {
  if (!(await canManageCompany(companyId))) return [];
  const rows = await prisma.productQuestion.findMany({
    where: { isHidden: false, product: { companyId }, ...(unansweredOnly ? { answer: null } : {}) },
    include: { product: { select: { title: true, slug: true } } },
    orderBy: { createdAt: 'desc' },
    take: 200,
  });
  return rows.map(r => ({ ...toQuestion(r), productTitle: r.product.title, productSlug: r.product.slug }));
}

// ---------------------------------------------------------------- wishlist

export async function getWishlistIds(): Promise<string[]> {
  const caller = await getCurrentCaller();
  if (!caller) return [];
  const rows = await prisma.userFavorite.findMany({ where: { userId: caller.uid, type: 'products' }, select: { entityId: true } });
  return rows.map(r => r.entityId);
}

export async function setWishlist(productId: string, on: boolean): Promise<ActionResult> {
  const caller = await getCurrentCaller();
  if (!caller) return { success: false, message: 'Inicie sesión para guardar productos en su lista de deseos.' };
  if (typeof productId !== 'string' || productId.length > 128) return { success: false, message: 'Producto no válido.' };
  if (on) {
    const exists = await prisma.product.count({ where: { id: productId } });
    if (!exists) return { success: false, message: 'Producto no encontrado.' };
    await prisma.userFavorite.upsert({
      where: { userId_type_entityId: { userId: caller.uid, type: 'products', entityId: productId } },
      update: {},
      create: { userId: caller.uid, type: 'products', entityId: productId },
    });
  } else {
    await prisma.userFavorite.deleteMany({ where: { userId: caller.uid, type: 'products', entityId: productId } });
  }
  return { success: true };
}

export async function getWishlistProducts(): Promise<ProductListItem[]> {
  const ids = await getWishlistIds();
  if (ids.length === 0) return [];
  const rows = await prisma.product.findMany({ where: { id: { in: ids }, ...publicProductWhere }, select: productListSelect });
  const order = new Map(ids.map((id, i) => [id, i]));
  return rows.map(toProductListItem).sort((a, b) => (order.get(b.id)! - order.get(a.id)!));
}

// ---------------------------------------------------------------- coupons

function toCoupon(c: Prisma.CouponGetPayload<{}>): Coupon {
  return {
    id: c.id,
    code: c.code,
    description: c.description ?? undefined,
    type: c.type,
    value: Number(c.value),
    minSubtotal: c.minSubtotal === null ? undefined : Number(c.minSubtotal),
    maxUses: c.maxUses ?? undefined,
    usedCount: c.usedCount,
    startsAt: c.startsAt?.toISOString(),
    endsAt: c.endsAt?.toISOString(),
    isActive: c.isActive,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function getSellerCoupons(companyId: string): Promise<Coupon[]> {
  if (!(await canManageCompany(companyId))) return [];
  const rows = await prisma.coupon.findMany({ where: { companyId }, orderBy: { createdAt: 'desc' } });
  return rows.map(toCoupon);
}

const couponSchema = z.object({
  code: z.string().trim().toUpperCase().min(3, 'El código debe tener al menos 3 caracteres.').max(32).regex(/^[A-Z0-9_-]+$/, 'Use solo letras, números, guiones y guiones bajos.'),
  description: z.string().trim().max(255).optional(),
  type: z.enum(['percent', 'fixed']),
  value: z.coerce.number().positive('Indique el valor del descuento.'),
  minSubtotal: z.coerce.number().min(0).optional(),
  maxUses: z.coerce.number().int().min(1).optional(),
  startsAt: z.string().datetime({ offset: true }).optional().or(z.string().length(0).transform(() => undefined)),
  endsAt: z.string().datetime({ offset: true }).optional().or(z.string().length(0).transform(() => undefined)),
  isActive: z.boolean(),
}).refine(c => c.type !== 'percent' || c.value <= 90, 'El descuento máximo es del 90%.')
  .refine(c => !c.startsAt || !c.endsAt || new Date(c.startsAt) < new Date(c.endsAt), 'La fecha de fin debe ser posterior al inicio.');

export async function saveCoupon(companyId: string, input: CouponInput, couponId?: string): Promise<ActionResult<{ id: string }>> {
  try {
    if (!(await canManageCompany(companyId))) return { success: false, message: 'No tiene permiso para gestionar cupones.' };
    const c = couponSchema.parse(input);
    const data = {
      code: c.code,
      description: c.description || null,
      type: c.type,
      value: c.value,
      minSubtotal: c.minSubtotal ?? null,
      maxUses: c.maxUses ?? null,
      startsAt: c.startsAt ? new Date(c.startsAt) : null,
      endsAt: c.endsAt ? new Date(c.endsAt) : null,
      isActive: c.isActive,
    };
    const clash = await prisma.coupon.findUnique({ where: { companyId_code: { companyId, code: c.code } }, select: { id: true } });
    if (clash && clash.id !== couponId) return { success: false, message: `Ya tiene un cupón con el código ${c.code}.` };

    if (couponId) {
      const existing = await prisma.coupon.findUnique({ where: { id: couponId }, select: { companyId: true } });
      if (existing?.companyId !== companyId) return { success: false, message: 'Cupón no encontrado.' };
      await prisma.coupon.update({ where: { id: couponId }, data });
      return { success: true, id: couponId };
    }
    const created = await prisma.coupon.create({ data: { ...data, companyId } });
    return { success: true, id: created.id };
  } catch (error) {
    return fail(error, 'No se pudo guardar el cupón.');
  }
}

export async function deleteCoupon(couponId: string): Promise<ActionResult> {
  const coupon = await prisma.coupon.findUnique({ where: { id: couponId }, select: { companyId: true, usedCount: true } });
  if (!coupon || !(await canManageCompany(coupon.companyId))) return { success: false, message: 'Cupón no encontrado.' };
  // Used coupons stay (orders reference them) — just switched off.
  if (coupon.usedCount > 0) await prisma.coupon.update({ where: { id: couponId }, data: { isActive: false } });
  else await prisma.coupon.delete({ where: { id: couponId } });
  return { success: true };
}

// Checkout preview. placeOrder re-validates and applies it atomically.
export async function checkCoupon(companyId: string, code: string, subtotal: number): Promise<ActionResult<{ code: string; discount: number; label: string }>> {
  const clean = typeof code === 'string' ? code.trim().toUpperCase().slice(0, 32) : '';
  if (!clean) return { success: false, message: 'Escriba un código.' };
  const row = await prisma.coupon.findUnique({ where: { companyId_code: { companyId, code: clean } } });
  if (!row) return { success: false, message: 'Código no válido para esta tienda.' };
  const coupon = toCoupon(row);
  const problem = couponProblem(coupon, subtotal);
  if (problem) return { success: false, message: problem };
  const discount = couponDiscount(coupon, subtotal);
  const label = coupon.type === 'percent' ? `${coupon.value}% de descuento` : `${formatXaf(coupon.value)} de descuento`;
  return { success: true, code: clean, discount, label };
}

// ---------------------------------------------------------------- seller stats

export async function getSellerStats(companyId: string, days = 30): Promise<SellerStats | undefined> {
  if (!(await canManageCompany(companyId))) return undefined;
  const span = [7, 30, 90, 365].includes(days) ? days : 30;
  const since = new Date(Date.now() - span * 86400000);

  const [periodOrders, open, viewsAgg, lowStock, unanswered] = await Promise.all([
    prisma.shopOrder.findMany({
      where: { companyId, createdAt: { gte: since } },
      select: { status: true, total: true, commissionAmount: true, createdAt: true, items: { select: { productId: true, productTitle: true, quantity: true, lineTotal: true } } },
    }),
    prisma.shopOrder.count({ where: { companyId, status: { in: ['pending', 'confirmed', 'processing', 'shipped'] } } }),
    prisma.product.aggregate({ where: { companyId }, _sum: { viewCount: true } }),
    prisma.product.findMany({
      where: { companyId, status: 'active', totalStock: { lte: 5 }, variants: { some: { trackInventory: true, allowBackorder: false, isActive: true } } },
      select: { id: true, title: true, totalStock: true },
      orderBy: { totalStock: 'asc' },
      take: 10,
    }),
    prisma.productQuestion.count({ where: { isHidden: false, answer: null, product: { companyId } } }),
  ]);

  const delivered = periodOrders.filter(o => o.status === 'delivered');
  const revenue = delivered.reduce((s, o) => s + Number(o.total), 0);
  const commission = delivered.reduce((s, o) => s + Number(o.commissionAmount), 0);

  const dayKey = (d: Date) => d.toISOString().slice(0, 10);
  const daily = new Map<string, { revenue: number; orders: number }>();
  for (let i = span - 1; i >= 0; i--) daily.set(dayKey(new Date(Date.now() - i * 86400000)), { revenue: 0, orders: 0 });
  for (const o of periodOrders) {
    const bucket = daily.get(dayKey(o.createdAt));
    if (!bucket) continue;
    if (o.status !== 'cancelled') bucket.orders++;
    if (o.status === 'delivered') bucket.revenue += Number(o.total);
  }

  const products = new Map<string, { productId?: string; title: string; units: number; revenue: number }>();
  for (const o of periodOrders) {
    if (o.status === 'cancelled') continue;
    for (const i of o.items) {
      const key = i.productId ?? i.productTitle;
      const p = products.get(key) ?? { productId: i.productId ?? undefined, title: i.productTitle, units: 0, revenue: 0 };
      p.units += i.quantity;
      p.revenue += Number(i.lineTotal);
      products.set(key, p);
    }
  }

  return {
    days: span,
    revenue,
    netRevenue: revenue - commission,
    orders: periodOrders.length,
    delivered: delivered.length,
    cancelled: periodOrders.filter(o => o.status === 'cancelled').length,
    open,
    averageOrder: delivered.length ? Math.round(revenue / delivered.length) : 0,
    unitsSold: Array.from(products.values()).reduce((s, p) => s + p.units, 0),
    views: viewsAgg._sum.viewCount ?? 0,
    daily: Array.from(daily, ([date, v]) => ({ date, ...v })),
    topProducts: Array.from(products.values()).sort((a, b) => b.units - a.units).slice(0, 5),
    lowStock: lowStock.map(p => ({ productId: p.id, title: p.title, stock: p.totalStock })),
    unansweredQuestions: unanswered,
  };
}

// ---------------------------------------------------------------- admin moderation

export async function getAdminProducts(params: { q?: string; status?: 'draft' | 'active' | 'archived'; featured?: boolean; page?: number }) {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { items: [], total: 0 };
  const q = params.q?.trim().slice(0, 100);
  const where: Prisma.ProductWhereInput = {
    ...(params.status ? { status: params.status } : {}),
    ...(params.featured ? { isFeatured: true } : {}),
    ...(q ? { OR: [{ title: { contains: q } }, { brand: { contains: q } }, { company: { name: { contains: q } } }] } : {}),
  };
  const page = Math.max(1, params.page ?? 1);
  const [rows, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { ...productListSelect, status: true, salesCount: true, viewCount: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * 30,
      take: 30,
    }),
    prisma.product.count({ where }),
  ]);
  return {
    items: rows.map(r => ({ ...toProductListItem(r), status: r.status, salesCount: r.salesCount, viewCount: r.viewCount, updatedAt: r.updatedAt.toISOString() })),
    total,
  };
}

// Whether the viewer may reply to this product's reviews (its seller or a manager).
export async function canReplyToReviews(productId: string): Promise<boolean> {
  return !!(await canManageProduct(productId));
}

// ---------------------------------------------------------------- site search

// Top products for the site-wide smart search (which indexes the directory
// client-side; the catalogue is queried here instead so it can grow freely).
export async function quickProductSearch(q: string, city?: string): Promise<{ items: ProductListItem[]; total: number }> {
  const text = typeof q === 'string' ? q.trim().slice(0, 100) : '';
  if (text.length < 2) return { items: [], total: 0 };
  const { searchProducts } = await import('./storefront');
  const result = await searchProducts({ q: text, city: typeof city === 'string' && city ? city.slice(0, 128) : undefined, inStockOnly: true });
  return { items: result.items.slice(0, 6), total: result.total };
}
