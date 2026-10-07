'use server';

import { randomInt, randomUUID } from 'node:crypto';
import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { sendNotificationToUser } from '../notifications';
import { forCustomer, getShopFees, orderInclude, recomputeProductAggregates, toSellerSettings, toShopOrder, type ShopFees } from './db';
import {
  CUSTOMER_CANCELLABLE, MAX_CART_QUANTITY, ORDER_STATUS_LABELS, ORDER_TRANSITIONS, couponDiscount, couponProblem, deliveryFeeFor, formatXaf, isVariantPurchasable,
  type ActionResult, type CartDetails, type CartItemDetail, type CartLine, type CartSellerGroup, type CheckoutInput,
  type ShopOrder, type ShopOrderStatus, type ShopSellerSettings,
} from './types';

// Cart, checkout and order lifecycle for the marketplace.
//
// Prices and stock are always read from the database here — the client
// cart only holds variant ids and quantities — so a tampered request can't
// change what an order costs.

const MAX_CART_LINES = 50;
const PAGE_SIZE = 30;

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) return { success: false, message: error.issues[0]?.message ?? fallback };
  if (error instanceof OrderError) return { success: false, message: error.message };
  console.error(fallback, error);
  return { success: false, message: fallback };
}

class OrderError extends Error {}

const cartLinesSchema = z.array(z.object({
  variantId: z.string().min(1).max(128),
  quantity: z.coerce.number().int().min(1).max(MAX_CART_QUANTITY),
})).max(MAX_CART_LINES, `El carrito admite como máximo ${MAX_CART_LINES} productos distintos.`);

// Same variant twice → one line with the summed quantity.
function mergeLines(lines: CartLine[]): CartLine[] {
  const map = new Map<string, number>();
  for (const l of lines) map.set(l.variantId, Math.min(MAX_CART_QUANTITY, (map.get(l.variantId) ?? 0) + l.quantity));
  return Array.from(map, ([variantId, quantity]) => ({ variantId, quantity }));
}

const variantForCartInclude = {
  product: {
    select: {
      id: true, slug: true, title: true, status: true, options: true, companyId: true,
      images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
      company: { select: { id: true, name: true, isActive: true, ownerId: true, shopSettings: true, branches: { select: { city: true, address: true }, orderBy: { position: 'asc' }, take: 1 } } },
    },
  },
} satisfies Prisma.ProductVariantInclude;

type VariantForCart = Prisma.ProductVariantGetPayload<{ include: typeof variantForCartInclude }>;

function isSellable(v: VariantForCart) {
  return v.isActive && v.product.status === 'active' && v.product.company.isActive;
}

function lineDetail(v: VariantForCart, quantity: number): CartItemDetail {
  const unitPrice = Number(v.price);
  const compareAt = v.compareAtPrice ? Number(v.compareAtPrice) : undefined;
  const limited = v.trackInventory && !v.allowBackorder;
  const maxQuantity = limited ? Math.max(0, Math.min(v.stock, MAX_CART_QUANTITY)) : MAX_CART_QUANTITY;
  let issue: CartItemDetail['issue'];
  if (!isSellable(v)) issue = 'unavailable';
  else if (!isVariantPurchasable({ isActive: v.isActive, trackInventory: v.trackInventory, allowBackorder: v.allowBackorder, stock: v.stock })) issue = 'out_of_stock';
  else if (quantity > maxQuantity) issue = 'insufficient_stock';
  return {
    variantId: v.id,
    productId: v.product.id,
    productSlug: v.product.slug,
    productTitle: v.product.title,
    variantTitle: v.title,
    hasOptions: (v.product.options as unknown[]).length > 0,
    image: v.image ?? v.product.images[0]?.url,
    unitPrice,
    compareAtPrice: compareAt && compareAt > unitPrice ? compareAt : undefined,
    quantity,
    maxQuantity,
    lineTotal: unitPrice * quantity,
    issue,
  };
}

async function resolveCart(lines: CartLine[]) {
  const merged = mergeLines(lines);
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: merged.map(l => l.variantId) } },
    include: variantForCartInclude,
  });
  const byId = new Map(variants.map(v => [v.id, v]));
  return { merged, byId };
}

// ---------------------------------------------------------------- cart

export async function getCartDetails(lines: CartLine[]): Promise<CartDetails> {
  const parsed = cartLinesSchema.safeParse(lines);
  if (!parsed.success) return { groups: [], missingVariantIds: [], subtotal: 0, itemCount: 0 };
  const { merged, byId } = await resolveCart(parsed.data);

  const groups = new Map<string, CartSellerGroup>();
  const missingVariantIds: string[] = [];
  for (const line of merged) {
    const v = byId.get(line.variantId);
    // Deleted, or the product went back to draft: drop silently from the cart.
    if (!v || v.product.status !== 'active') {
      missingVariantIds.push(line.variantId);
      continue;
    }
    const company = v.product.company;
    if (!groups.has(company.id)) {
      groups.set(company.id, {
        companyId: company.id,
        companyName: company.name,
        companyCity: company.branches[0]?.city,
        settings: withPickupAddress(toSellerSettings(company.shopSettings), company.branches[0]?.address),
        items: [],
        subtotal: 0,
      });
    }
    const group = groups.get(company.id)!;
    const detail = lineDetail(v, line.quantity);
    group.items.push(detail);
    if (!detail.issue) group.subtotal += detail.lineTotal;
  }

  const list = Array.from(groups.values());
  return {
    groups: list,
    missingVariantIds,
    subtotal: list.reduce((s, g) => s + g.subtotal, 0),
    itemCount: list.reduce((s, g) => s + g.items.reduce((n, i) => n + i.quantity, 0), 0),
  };
}

function withPickupAddress(settings: ShopSellerSettings, branchAddress: string | undefined): ShopSellerSettings {
  return { ...settings, pickupAddress: settings.pickupAddress || branchAddress };
}

// ---------------------------------------------------------------- checkout

const checkoutSchema = z.object({
  lines: cartLinesSchema.min(1, 'Su carrito está vacío.'),
  customerName: z.string().trim().min(2, 'Indique su nombre.').max(255),
  customerPhone: z.string().trim().min(6, 'Indique un teléfono válido.').max(64).regex(/^[+\d\s()-]+$/, 'Indique un teléfono válido.'),
  customerEmail: z.string().trim().email('Correo electrónico no válido.').max(255).optional().or(z.literal('')),
  deliveryCity: z.string().trim().max(128).optional(),
  deliveryAddress: z.string().trim().max(512).optional(),
  notes: z.string().trim().max(2000).optional(),
  sellers: z.array(z.object({
    companyId: z.string().min(1).max(128),
    deliveryMethod: z.enum(['pickup', 'delivery']),
    paymentMethod: z.enum(['cash', 'muni_dinero']),
    couponCode: z.string().trim().toUpperCase().max(32).optional(),
  })).min(1).max(MAX_CART_LINES),
});

const ORDER_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

function newOrderNumber(): string {
  let s = '';
  for (let i = 0; i < 6; i++) s += ORDER_ALPHABET[randomInt(ORDER_ALPHABET.length)];
  return `OLT-${s}`;
}

async function uniqueOrderNumbers(count: number): Promise<string[]> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidates = Array.from({ length: count }, newOrderNumber);
    if (new Set(candidates).size !== count) continue;
    const taken = await prisma.shopOrder.count({ where: { orderNumber: { in: candidates } } });
    if (taken === 0) return candidates;
  }
  throw new Error('No se pudo generar el número de pedido.');
}

function commissionFor(fees: ShopFees, paymentMethod: 'cash' | 'muni_dinero', subtotal: number) {
  const percent = fees.commissionPercent + (paymentMethod === 'muni_dinero' ? fees.muniDineroCommissionPercent : 0);
  return { percent, amount: Math.round(subtotal * percent / 100) };
}

export async function placeOrder(input: CheckoutInput): Promise<ActionResult<{ checkoutId: string; orderNumbers: string[] }>> {
  try {
    const data = checkoutSchema.parse(input);
    const caller = await getCurrentCaller();
    const { merged, byId } = await resolveCart(data.lines);

    // Validate every line against live data before touching anything.
    const problems: string[] = [];
    const bySeller = new Map<string, { variant: VariantForCart; quantity: number }[]>();
    for (const line of merged) {
      const v = byId.get(line.variantId);
      if (!v || !isSellable(v)) {
        problems.push(v ? `${v.product.title} ya no está disponible.` : 'Un producto de su carrito ya no existe.');
        continue;
      }
      const detail = lineDetail(v, line.quantity);
      if (detail.issue === 'out_of_stock') problems.push(`${v.product.title} está agotado.`);
      if (detail.issue === 'insufficient_stock') problems.push(`Solo quedan ${detail.maxQuantity} de ${v.product.title}.`);
      const list = bySeller.get(v.product.companyId) ?? [];
      list.push({ variant: v, quantity: line.quantity });
      bySeller.set(v.product.companyId, list);
    }
    if (problems.length) throw new OrderError(problems.join(' '));

    const fees = await getShopFees();
    const couponRequests = data.sellers.filter(s => s.couponCode).map(s => ({ companyId: s.companyId, code: s.couponCode! }));
    const coupons = couponRequests.length ? await prisma.coupon.findMany({ where: { OR: couponRequests } }) : [];
    const plans = Array.from(bySeller, ([companyId, lines]) => {
      const choice = data.sellers.find(s => s.companyId === companyId);
      const company = lines[0].variant.product.company;
      if (!choice) throw new OrderError(`Elija entrega y pago para ${company.name}.`);
      const settings = toSellerSettings(company.shopSettings);
      const subtotal = lines.reduce((s, l) => s + Number(l.variant.price) * l.quantity, 0);

      if (settings.minOrderAmount !== undefined && subtotal < settings.minOrderAmount) {
        throw new OrderError(`${company.name} tiene un pedido mínimo de ${formatXaf(settings.minOrderAmount)}.`);
      }
      let deliveryFee = 0;
      if (choice.deliveryMethod === 'pickup') {
        if (!settings.pickupEnabled) throw new OrderError(`${company.name} no ofrece recogida en tienda.`);
      } else {
        if (!data.deliveryCity || !data.deliveryAddress || data.deliveryAddress.length < 5) {
          throw new OrderError('Indique la ciudad y la dirección de entrega.');
        }
        const fee = deliveryFeeFor(settings, data.deliveryCity, subtotal);
        if (fee === undefined) throw new OrderError(`${company.name} no hace envíos a ${data.deliveryCity}.`);
        deliveryFee = fee;
      }
      if (choice.paymentMethod === 'cash' && !settings.acceptsCash) throw new OrderError(`${company.name} no acepta pago en efectivo.`);
      if (choice.paymentMethod === 'muni_dinero' && !settings.acceptsMuniDinero) throw new OrderError(`${company.name} no acepta Muni Dinero.`);

      let coupon: { id: string; code: string; discount: number } | undefined;
      if (choice.couponCode) {
        const row = coupons.find(c => c.companyId === companyId && c.code === choice.couponCode);
        if (!row) throw new OrderError(`El cupón ${choice.couponCode} no es válido para ${company.name}.`);
        const shape = {
          type: row.type, value: Number(row.value), isActive: row.isActive, usedCount: row.usedCount,
          maxUses: row.maxUses ?? undefined, minSubtotal: row.minSubtotal === null ? undefined : Number(row.minSubtotal),
          startsAt: row.startsAt?.toISOString(), endsAt: row.endsAt?.toISOString(),
        };
        const problem = couponProblem(shape, subtotal);
        if (problem) throw new OrderError(`${row.code}: ${problem}`);
        coupon = { id: row.id, code: row.code, discount: couponDiscount(shape, subtotal) };
      }
      const discount = coupon?.discount ?? 0;

      // Commission is on what the seller actually sells for (after their discount).
      const commission = commissionFor(fees, choice.paymentMethod, subtotal - discount);
      return { company, choice, lines, subtotal, deliveryFee, discount, coupon, commission };
    });

    const orderNumbers = await uniqueOrderNumbers(plans.length);
    const checkoutId = randomUUID();
    const customerId = caller?.uid ?? null;

    await prisma.$transaction(async (tx) => {
      const touchedProducts = new Set<string>();
      for (const [index, plan] of plans.entries()) {
        const itemsData: Prisma.ShopOrderItemCreateWithoutOrderInput[] = [];
        const movements: { productId: string; variantId: string; quantity: number }[] = [];

        for (const { variant: v, quantity } of plan.lines) {
          let reserved = false;
          if (v.trackInventory) {
            // Conditional decrement is atomic in MySQL: two buyers can't both
            // take the last unit. Backorder variants may go below zero.
            const res = await tx.productVariant.updateMany({
              where: { id: v.id, ...(v.allowBackorder ? {} : { stock: { gte: quantity } }) },
              data: { stock: { decrement: quantity } },
            });
            if (res.count === 0) throw new OrderError(`No queda stock suficiente de ${v.product.title}.`);
            reserved = true;
            movements.push({ productId: v.product.id, variantId: v.id, quantity });
          }
          touchedProducts.add(v.product.id);
          itemsData.push({
            product: { connect: { id: v.product.id } },
            variant: { connect: { id: v.id } },
            productTitle: v.product.title,
            productSlug: v.product.slug,
            variantTitle: v.title,
            sku: v.sku,
            image: v.image ?? v.product.images[0]?.url ?? null,
            unitPrice: v.price,
            quantity,
            lineTotal: Number(v.price) * quantity,
            stockReserved: reserved,
          });
        }

        if (plan.coupon) {
          // Atomic: the usage limit holds even with simultaneous checkouts.
          const used = await tx.$executeRaw`UPDATE coupons SET usedCount = usedCount + 1 WHERE id = ${plan.coupon.id} AND isActive = true AND (maxUses IS NULL OR usedCount < maxUses)`;
          if (used === 0) throw new OrderError(`El cupón ${plan.coupon.code} ya no está disponible.`);
        }

        const order = await tx.shopOrder.create({
          data: {
            orderNumber: orderNumbers[index],
            checkoutId,
            companyId: plan.company.id,
            companyName: plan.company.name,
            customerId,
            customerName: data.customerName,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail || null,
            deliveryMethod: plan.choice.deliveryMethod,
            deliveryCity: plan.choice.deliveryMethod === 'delivery' ? data.deliveryCity : null,
            deliveryAddress: plan.choice.deliveryMethod === 'delivery' ? data.deliveryAddress : null,
            paymentMethod: plan.choice.paymentMethod,
            subtotal: plan.subtotal,
            deliveryFee: plan.deliveryFee,
            discount: plan.discount,
            total: plan.subtotal - plan.discount + plan.deliveryFee,
            couponId: plan.coupon?.id ?? null,
            couponCode: plan.coupon?.code ?? null,
            commissionPercent: plan.commission.percent,
            commissionAmount: plan.commission.amount,
            notes: data.notes || null,
            items: { create: itemsData },
            events: { create: { status: 'pending', actorId: customerId } },
          },
        });

        for (const m of movements) {
          const after = await tx.productVariant.findUniqueOrThrow({ where: { id: m.variantId }, select: { stock: true } });
          await tx.inventoryMovement.create({
            data: { productId: m.productId, variantId: m.variantId, delta: -m.quantity, stockAfter: after.stock, reason: 'sale', orderId: order.id, userId: customerId },
          });
        }
        for (const { variant: v, quantity } of plan.lines) {
          await tx.$executeRaw`UPDATE products SET salesCount = salesCount + ${quantity} WHERE id = ${v.product.id}`;
        }
      }
      for (const productId of touchedProducts) await recomputeProductAggregates(tx, productId);
    }, { timeout: 15000 });

    // Notifications are best-effort and happen after the commit.
    await Promise.allSettled(plans.map(async (plan, i) => {
      if (plan.company.ownerId) {
        await sendNotificationToUser(plan.company.ownerId, {
          message: `Nuevo pedido ${orderNumbers[i]} de ${data.customerName} (${formatXaf(plan.subtotal - plan.discount + plan.deliveryFee)}).`,
          link: `/dashboard/companies/${plan.company.id}/shop/orders`,
        });
      }
    }));

    revalidateTag('shop-products');
    for (const plan of plans) revalidatePath(`/dashboard/companies/${plan.company.id}/shop/orders`);
    return { success: true, checkoutId, orderNumbers };
  } catch (error) {
    return fail(error, 'No se pudo completar el pedido. Inténtelo de nuevo.');
  }
}

// ---------------------------------------------------------------- customer side

// The checkoutId is an unguessable UUID that works as the receipt link for
// guests; signed-in customers can also see their orders from their account.
export async function getCheckoutOrders(checkoutId: string): Promise<ShopOrder[]> {
  if (typeof checkoutId !== 'string' || !/^[0-9a-f-]{36}$/.test(checkoutId)) return [];
  const rows = await prisma.shopOrder.findMany({ where: { checkoutId }, include: orderInclude, orderBy: { createdAt: 'asc' } });
  return rows.map(r => forCustomer(toShopOrder(r)));
}

export async function getMyOrders(): Promise<ShopOrder[]> {
  const caller = await getCurrentCaller();
  if (!caller) return [];
  const rows = await prisma.shopOrder.findMany({ where: { customerId: caller.uid }, include: orderInclude, orderBy: { createdAt: 'desc' }, take: 100 });
  return rows.map(r => forCustomer(toShopOrder(r)));
}

async function restoreStock(tx: Prisma.TransactionClient, orderId: string, actorId: string | null) {
  const items = await tx.shopOrderItem.findMany({ where: { orderId } });
  const touched = new Set<string>();
  for (const item of items) {
    if (item.productId) {
      touched.add(item.productId);
      await tx.$executeRaw`UPDATE products SET salesCount = GREATEST(0, salesCount - ${item.quantity}) WHERE id = ${item.productId}`;
    }
    if (!item.stockReserved || !item.variantId || !item.productId) continue;
    const updated = await tx.productVariant.update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } });
    await tx.inventoryMovement.create({
      data: { productId: item.productId, variantId: item.variantId, delta: item.quantity, stockAfter: updated.stock, reason: 'cancellation', orderId, userId: actorId },
    });
  }
  for (const productId of touched) {
    const exists = await tx.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (exists) await recomputeProductAggregates(tx, productId);
  }
}

async function cancelOrder(orderId: string, reason: string | undefined, actorId: string | null) {
  await prisma.$transaction(async (tx) => {
    // Re-read inside the transaction and flip status conditionally, so a
    // double click or a seller/customer race can't restore stock twice.
    const res = await tx.shopOrder.updateMany({
      where: { id: orderId, status: { notIn: ['delivered', 'cancelled'] } },
      data: { status: 'cancelled', cancelReason: reason || null },
    });
    if (res.count === 0) throw new OrderError('Este pedido ya no se puede cancelar.');
    await tx.shopOrderEvent.create({ data: { orderId, status: 'cancelled', note: reason || null, actorId } });
    await restoreStock(tx, orderId, actorId);
    // Give the coupon use back so a cancelled order doesn't burn a limited coupon.
    const order = await tx.shopOrder.findUnique({ where: { id: orderId }, select: { couponId: true } });
    if (order?.couponId) await tx.$executeRaw`UPDATE coupons SET usedCount = GREATEST(0, usedCount - 1) WHERE id = ${order.couponId}`;
  }, { timeout: 15000 });
  revalidateTag('shop-products');
}

// Customer cancellation: the signed-in owner of the order, or anyone holding
// the guest receipt link (checkoutId).
export async function cancelMyOrder(orderId: string, checkoutId?: string, reason?: string): Promise<ActionResult> {
  try {
    const order = await prisma.shopOrder.findUnique({ where: { id: orderId }, select: { customerId: true, checkoutId: true, status: true, companyId: true, orderNumber: true, customerName: true, company: { select: { ownerId: true } } } });
    if (!order) return { success: false, message: 'Pedido no encontrado.' };
    const caller = await getCurrentCaller();
    const allowed = (caller && order.customerId === caller.uid) || (!!checkoutId && checkoutId === order.checkoutId);
    if (!allowed) return { success: false, message: 'No tiene permiso para cancelar este pedido.' };
    if (!CUSTOMER_CANCELLABLE.includes(order.status)) {
      return { success: false, message: 'El vendedor ya está preparando este pedido. Contacte con él para cancelarlo.' };
    }
    await cancelOrder(orderId, reason?.trim().slice(0, 512) || 'Cancelado por el cliente', caller?.uid ?? null);
    if (order.company.ownerId) {
      await sendNotificationToUser(order.company.ownerId, {
        message: `${order.customerName} canceló el pedido ${order.orderNumber}.`,
        link: `/dashboard/companies/${order.companyId}/shop/orders/${orderId}`,
      }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${order.companyId}/shop/orders`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cancelar el pedido.');
  }
}

// ---------------------------------------------------------------- seller side

async function sellerCaller(companyId: string) {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid ? caller : null;
}

export async function getSellerOrders(companyId: string, status?: ShopOrderStatus | 'open', page = 1): Promise<{ orders: ShopOrder[]; total: number; counts: Record<string, number> }> {
  const empty = { orders: [], total: 0, counts: {} };
  if (!(await sellerCaller(companyId))) return empty;
  const where: Prisma.ShopOrderWhereInput = {
    companyId,
    ...(status === 'open' ? { status: { in: ['pending', 'confirmed', 'processing', 'shipped'] } } : status ? { status } : {}),
  };
  const [rows, total, grouped] = await Promise.all([
    prisma.shopOrder.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: (Math.max(1, page) - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.shopOrder.count({ where }),
    prisma.shopOrder.groupBy({ by: ['status'], where: { companyId }, _count: { _all: true } }),
  ]);
  return {
    orders: rows.map(toShopOrder),
    total,
    counts: Object.fromEntries(grouped.map(g => [g.status, g._count._all])),
  };
}

export async function getSellerOrder(orderId: string): Promise<ShopOrder | undefined> {
  const row = await prisma.shopOrder.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!row || !(await sellerCaller(row.companyId))) return undefined;
  return toShopOrder(row);
}

export async function updateOrderStatus(orderId: string, status: ShopOrderStatus, note?: string): Promise<ActionResult> {
  try {
    const order = await prisma.shopOrder.findUnique({ where: { id: orderId }, select: { companyId: true, status: true, customerId: true, orderNumber: true, companyName: true, paymentMethod: true, deliveryMethod: true } });
    if (!order) return { success: false, message: 'Pedido no encontrado.' };
    const caller = await sellerCaller(order.companyId);
    if (!caller) return { success: false, message: 'No tiene permiso para gestionar este pedido.' };
    if (!ORDER_TRANSITIONS[order.status].includes(status)) {
      return { success: false, message: `Un pedido ${ORDER_STATUS_LABELS[order.status].toLowerCase()} no puede pasar a ${ORDER_STATUS_LABELS[status].toLowerCase()}.` };
    }
    const cleanNote = note?.trim().slice(0, 512) || undefined;

    if (status === 'cancelled') {
      if (!cleanNote) return { success: false, message: 'Indique el motivo de la cancelación para el cliente.' };
      await cancelOrder(orderId, cleanNote, caller.uid);
    } else {
      await prisma.$transaction(async (tx) => {
        const res = await tx.shopOrder.updateMany({
          where: { id: orderId, status: order.status },
          // Cash orders are settled at hand-over.
          data: { status, ...(status === 'delivered' && order.paymentMethod === 'cash' ? { paymentStatus: 'paid' } : {}) },
        });
        if (res.count === 0) throw new OrderError('El pedido cambió mientras tanto. Recargue la página.');
        await tx.shopOrderEvent.create({ data: { orderId, status, note: cleanNote ?? null, actorId: caller.uid } });
      });
    }

    if (order.customerId) {
      const label = status === 'shipped' && order.deliveryMethod === 'pickup' ? 'listo para recoger' : ORDER_STATUS_LABELS[status].toLowerCase();
      await sendNotificationToUser(order.customerId, {
        message: `Su pedido ${order.orderNumber} de ${order.companyName}: ${label}.`,
        link: '/dashboard/compras',
      }).catch(() => {});
    }
    revalidatePath(`/dashboard/companies/${order.companyId}/shop/orders`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo actualizar el pedido.');
  }
}

export async function setOrderPaymentStatus(orderId: string, paymentStatus: 'pending' | 'paid' | 'refunded'): Promise<ActionResult> {
  try {
    z.enum(['pending', 'paid', 'refunded']).parse(paymentStatus);
    const order = await prisma.shopOrder.findUnique({ where: { id: orderId }, select: { companyId: true } });
    if (!order) return { success: false, message: 'Pedido no encontrado.' };
    if (!(await sellerCaller(order.companyId))) return { success: false, message: 'No tiene permiso para gestionar este pedido.' };
    await prisma.shopOrder.update({ where: { id: orderId }, data: { paymentStatus } });
    revalidatePath(`/dashboard/companies/${order.companyId}/shop/orders`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo actualizar el pago.');
  }
}

// ---------------------------------------------------------------- seller settings

export async function getSellerSettings(companyId: string): Promise<ShopSellerSettings | undefined> {
  if (!(await sellerCaller(companyId))) return undefined;
  const row = await prisma.shopSettings.findUnique({ where: { companyId } });
  return toSellerSettings(row);
}

const settingsSchema = z.object({
  pickupEnabled: z.boolean(),
  pickupAddress: z.string().trim().max(512).optional(),
  deliveryEnabled: z.boolean(),
  deliveryFee: z.coerce.number().min(0).max(1e9),
  deliveryFeeByCity: z.array(z.object({ city: z.string().trim().min(1).max(128), fee: z.coerce.number().min(0).max(1e9) })).max(100),
  deliveryCities: z.array(z.string().trim().min(1).max(128)).max(100),
  freeDeliveryOver: z.coerce.number().min(0).max(1e10).optional(),
  minOrderAmount: z.coerce.number().min(0).max(1e10).optional(),
  acceptsCash: z.boolean(),
  acceptsMuniDinero: z.boolean(),
  orderNotes: z.string().trim().max(2000).optional(),
}).refine(s => s.pickupEnabled || s.deliveryEnabled, 'Active al menos la recogida o el envío.')
  .refine(s => s.acceptsCash || s.acceptsMuniDinero, 'Acepte al menos un método de pago.');

export async function saveSellerSettings(companyId: string, input: ShopSellerSettings): Promise<ActionResult> {
  try {
    if (!(await sellerCaller(companyId))) return { success: false, message: 'No tiene permiso para gestionar esta tienda.' };
    const s = settingsSchema.parse(input);
    const data = {
      pickupEnabled: s.pickupEnabled,
      pickupAddress: s.pickupAddress || null,
      deliveryEnabled: s.deliveryEnabled,
      deliveryFee: s.deliveryFee,
      deliveryFeeByCity: s.deliveryFeeByCity as Prisma.InputJsonValue,
      deliveryCities: Array.from(new Set(s.deliveryCities)) as Prisma.InputJsonValue,
      freeDeliveryOver: s.freeDeliveryOver ?? null,
      minOrderAmount: s.minOrderAmount ?? null,
      acceptsCash: s.acceptsCash,
      acceptsMuniDinero: s.acceptsMuniDinero,
      orderNotes: s.orderNotes || null,
    };
    await prisma.shopSettings.upsert({ where: { companyId }, create: { companyId, ...data }, update: data });
    revalidatePath(`/dashboard/companies/${companyId}/shop/settings`);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudieron guardar los ajustes.');
  }
}

// ---------------------------------------------------------------- admin

export async function getAllShopOrders(status?: ShopOrderStatus, page = 1): Promise<{ orders: ShopOrder[]; total: number; totals: { gross: number; commission: number } }> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { orders: [], total: 0, totals: { gross: 0, commission: 0 } };
  const where: Prisma.ShopOrderWhereInput = status ? { status } : {};
  const [rows, total, sums] = await Promise.all([
    prisma.shopOrder.findMany({ where, include: orderInclude, orderBy: { createdAt: 'desc' }, skip: (Math.max(1, page) - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    prisma.shopOrder.count({ where }),
    prisma.shopOrder.aggregate({ where: { status: 'delivered' }, _sum: { total: true, commissionAmount: true } }),
  ]);
  return {
    orders: rows.map(toShopOrder),
    total,
    totals: { gross: Number(sums._sum.total ?? 0), commission: Number(sums._sum.commissionAmount ?? 0) },
  };
}

export async function getShopFeesForAdmin(): Promise<ShopFees | undefined> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return undefined;
  return getShopFees();
}

export async function saveShopFees(fees: ShopFees): Promise<ActionResult> {
  try {
    const caller = await getCurrentCaller();
    if (!caller || caller.role !== 'admin') return { success: false, message: 'Solo un administrador puede cambiar las comisiones.' };
    const data = z.object({
      commissionPercent: z.coerce.number().min(0).max(50),
      muniDineroCommissionPercent: z.coerce.number().min(0).max(50),
    }).parse(fees);
    await prisma.siteSettings.update({ where: { id: 'main' }, data: { shopFees: data } });
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudieron guardar las comisiones.');
  }
}
