import { prisma, Prisma } from '../db';
import { slugify } from '../slug';
import type { Product, ProductCategory, ProductListItem, ProductVariant, ShopOrder, ShopSellerSettings } from './types';
import { DEFAULT_SELLER_SETTINGS, isVariantPurchasable } from './types';

// Row → app type mappers and shared write helpers for the marketplace.
// Server-only (imports the Prisma client); not a 'use server' module.

const iso = (d: Date) => d.toISOString();
const opt = <T>(v: T | null | undefined): T | undefined => v ?? undefined;
const json = <T>(v: Prisma.JsonValue | null | undefined, fallback: T): T => (v ?? fallback) as T;
const dec = (v: Prisma.Decimal | number) => Number(v);

export const productInclude = {
  company: { select: { name: true } },
  images: { orderBy: { position: 'asc' } },
  variants: { orderBy: { position: 'asc' } },
} satisfies Prisma.ProductInclude;

type ProductRow = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

export function toProductCategory(c: Prisma.ProductCategoryGetPayload<{}>): ProductCategory {
  return {
    id: c.id,
    parentId: c.parentId,
    name: c.name,
    slug: c.slug,
    description: opt(c.description),
    image: opt(c.image),
    position: c.position,
    isActive: c.isActive,
  };
}

export function toProductVariant(v: Prisma.ProductVariantGetPayload<{}>): ProductVariant {
  return {
    id: v.id,
    title: v.title,
    optionValues: json(v.optionValues, []),
    sku: opt(v.sku),
    price: dec(v.price),
    compareAtPrice: v.compareAtPrice === null ? undefined : dec(v.compareAtPrice),
    stock: v.stock,
    trackInventory: v.trackInventory,
    allowBackorder: v.allowBackorder,
    image: opt(v.image),
    position: v.position,
    isActive: v.isActive,
  };
}

export function toProduct(p: ProductRow): Product {
  return {
    id: p.id,
    companyId: p.companyId,
    companyName: p.company.name,
    categoryId: opt(p.categoryId),
    title: p.title,
    slug: p.slug,
    shortDescription: opt(p.shortDescription),
    description: p.description,
    brand: opt(p.brand),
    condition: p.condition,
    status: p.status,
    options: json(p.options, []),
    specs: json(p.specs, []),
    tags: json(p.tags, []),
    images: p.images.map(i => ({ id: i.id, url: i.url, alt: opt(i.alt) })),
    variants: p.variants.map(toProductVariant),
    minPrice: dec(p.minPrice),
    maxPrice: dec(p.maxPrice),
    totalStock: p.totalStock,
    inStock: p.inStock,
    isOnSale: p.isOnSale,
    isFeatured: p.isFeatured,
    ratingAvg: dec(p.ratingAvg),
    ratingCount: p.ratingCount,
    salesCount: p.salesCount,
    viewCount: p.viewCount,
    publishedAt: p.publishedAt ? iso(p.publishedAt) : undefined,
    createdAt: iso(p.createdAt),
    updatedAt: iso(p.updatedAt),
  };
}

// Recomputes the denormalised price/stock columns on Product from its
// active variants. Must run inside the same transaction as any variant
// write so listings never see a product whose summary disagrees with it.
export async function recomputeProductAggregates(tx: Prisma.TransactionClient, productId: string) {
  const rows = await tx.productVariant.findMany({ where: { productId, isActive: true } });
  const variants = rows.map(toProductVariant);
  const prices = variants.map(v => v.price);
  await tx.product.update({
    where: { id: productId },
    data: {
      minPrice: prices.length ? Math.min(...prices) : 0,
      maxPrice: prices.length ? Math.max(...prices) : 0,
      totalStock: variants.filter(v => v.trackInventory).reduce((sum, v) => sum + Math.max(0, v.stock), 0),
      inStock: variants.some(isVariantPurchasable),
      isOnSale: variants.some(v => v.compareAtPrice !== undefined && v.compareAtPrice > v.price),
    },
  });
}

// Slugs get a short random suffix so two sellers can list "iPhone 15" without
// colliding, and are never regenerated on edit so shared links keep working.
export async function uniqueProductSlug(title: string): Promise<string> {
  const base = slugify(title).slice(0, 80) || 'producto';
  for (let attempt = 0; attempt < 5; attempt++) {
    const slug = `${base}-${Math.random().toString(36).slice(2, 8)}`;
    const taken = await prisma.product.findUnique({ where: { slug }, select: { id: true } });
    if (!taken) return slug;
  }
  throw new Error('No se pudo generar un enlace único para el producto.');
}

export async function uniqueCategorySlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name) || 'categoria';
  let slug = base;
  for (let n = 2; ; n++) {
    const taken = await prisma.productCategory.findUnique({ where: { slug }, select: { id: true } });
    if (!taken || taken.id === excludeId) return slug;
    slug = `${base}-${n}`;
  }
}

// ---------------------------------------------------------------- storefront

// Only what a product card needs: cover image and the cheapest active variant
// (for the struck-through price).
export const productListSelect = {
  id: true, slug: true, title: true, brand: true, condition: true,
  minPrice: true, maxPrice: true, isOnSale: true, inStock: true, isFeatured: true,
  ratingAvg: true, ratingCount: true, companyId: true,
  company: { select: { name: true } },
  images: { select: { url: true }, orderBy: { position: 'asc' }, take: 1 },
  variants: { where: { isActive: true }, select: { price: true, compareAtPrice: true }, orderBy: { price: 'asc' }, take: 1 },
} satisfies Prisma.ProductSelect;

type ProductListRow = Prisma.ProductGetPayload<{ select: typeof productListSelect }>;

export function toProductListItem(p: ProductListRow): ProductListItem {
  const cheapest = p.variants[0];
  const compareAt = cheapest?.compareAtPrice ? dec(cheapest.compareAtPrice) : undefined;
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    image: p.images[0]?.url,
    brand: opt(p.brand),
    condition: p.condition,
    minPrice: dec(p.minPrice),
    maxPrice: dec(p.maxPrice),
    compareAtPrice: compareAt !== undefined && compareAt > dec(p.minPrice) ? compareAt : undefined,
    isOnSale: p.isOnSale,
    inStock: p.inStock,
    isFeatured: p.isFeatured,
    ratingAvg: dec(p.ratingAvg),
    ratingCount: p.ratingCount,
    companyId: p.companyId,
    companyName: p.company.name,
  };
}

// What the public may see: published products of active companies.
export const publicProductWhere = {
  status: 'active',
  company: { isActive: true },
} satisfies Prisma.ProductWhereInput;

// ---------------------------------------------------------------- orders

export const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.ShopOrderInclude;

type OrderRow = Prisma.ShopOrderGetPayload<{ include: typeof orderInclude }>;

export function toShopOrder(o: OrderRow): ShopOrder {
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    checkoutId: o.checkoutId,
    companyId: o.companyId,
    companyName: o.companyName,
    customerId: opt(o.customerId),
    customerName: o.customerName,
    customerPhone: o.customerPhone,
    customerEmail: opt(o.customerEmail),
    deliveryMethod: o.deliveryMethod,
    deliveryCity: opt(o.deliveryCity),
    deliveryAddress: opt(o.deliveryAddress),
    paymentMethod: o.paymentMethod,
    paymentStatus: o.paymentStatus,
    status: o.status,
    subtotal: dec(o.subtotal),
    deliveryFee: dec(o.deliveryFee),
    discount: dec(o.discount),
    total: dec(o.total),
    commissionPercent: dec(o.commissionPercent),
    commissionAmount: dec(o.commissionAmount),
    notes: opt(o.notes),
    cancelReason: opt(o.cancelReason),
    couponCode: opt(o.couponCode),
    items: o.items.map(i => ({
      id: i.id,
      productId: opt(i.productId),
      productSlug: opt(i.productSlug),
      productTitle: i.productTitle,
      variantTitle: i.variantTitle,
      sku: opt(i.sku),
      image: opt(i.image),
      unitPrice: dec(i.unitPrice),
      quantity: i.quantity,
      lineTotal: dec(i.lineTotal),
    })),
    events: o.events.map(e => ({ id: e.id, status: e.status, note: opt(e.note), createdAt: iso(e.createdAt) })),
    createdAt: iso(o.createdAt),
    updatedAt: iso(o.updatedAt),
  };
}

// Customers never see the platform commission (it's between Oltinde and the seller).
export function forCustomer(order: ShopOrder): ShopOrder {
  return { ...order, commissionPercent: 0, commissionAmount: 0 };
}

export function toSellerSettings(s: Prisma.ShopSettingsGetPayload<{}> | null): ShopSellerSettings {
  if (!s) return { ...DEFAULT_SELLER_SETTINGS };
  return {
    pickupEnabled: s.pickupEnabled,
    pickupAddress: opt(s.pickupAddress),
    deliveryEnabled: s.deliveryEnabled,
    deliveryFee: dec(s.deliveryFee),
    deliveryFeeByCity: json(s.deliveryFeeByCity, []),
    deliveryCities: json(s.deliveryCities, []),
    freeDeliveryOver: s.freeDeliveryOver === null ? undefined : dec(s.freeDeliveryOver),
    minOrderAmount: s.minOrderAmount === null ? undefined : dec(s.minOrderAmount),
    acceptsCash: s.acceptsCash,
    acceptsMuniDinero: s.acceptsMuniDinero,
    orderNotes: opt(s.orderNotes),
  };
}

export type ShopFees = { commissionPercent: number; muniDineroCommissionPercent: number };

export async function getShopFees(): Promise<ShopFees> {
  const row = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { shopFees: true } });
  const fees = (row?.shopFees ?? {}) as Partial<ShopFees>;
  return { commissionPercent: fees.commissionPercent ?? 0, muniDineroCommissionPercent: fees.muniDineroCommissionPercent ?? 0 };
}
