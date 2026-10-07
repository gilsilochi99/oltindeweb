'use server';

import { unstable_cache } from 'next/cache';
import { prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { productInclude, toProduct, toProductCategory } from './db';
import type { Product, ProductCategory } from './types';

// Read side of the marketplace. Public reads are cached like src/lib/data.ts;
// seller/admin reads check the caller and are never cached.

const getProductCategoriesCached = unstable_cache(async (): Promise<ProductCategory[]> => {
  const rows = await prisma.productCategory.findMany({ orderBy: [{ position: 'asc' }, { name: 'asc' }] });
  return rows.map(toProductCategory);
}, ['product-categories'], { revalidate: 300, tags: ['product-categories'] });

// All categories (incl. inactive ones — callers filter), flat; build the tree
// client-side from parentId.
export async function getProductCategories(): Promise<ProductCategory[]> {
  return getProductCategoriesCached();
}

export async function getProductCategoryCounts(): Promise<Record<string, number>> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return {};
  const rows = await prisma.product.groupBy({ by: ['categoryId'], _count: { _all: true } });
  return Object.fromEntries(rows.filter(r => r.categoryId).map(r => [r.categoryId as string, r._count._all]));
}

async function callerCanManageCompany(companyId: string): Promise<boolean> {
  const caller = await getCurrentCaller();
  if (!caller) return false;
  if (isManagerRole(caller.role)) return true;
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true } });
  return company?.ownerId === caller.uid;
}

// Seller dashboard: every product of the company, drafts and archived included.
export async function getSellerProducts(companyId: string): Promise<Product[]> {
  if (!(await callerCanManageCompany(companyId))) return [];
  const rows = await prisma.product.findMany({
    where: { companyId },
    include: productInclude,
    orderBy: { updatedAt: 'desc' },
  });
  return rows.map(toProduct);
}

// Seller edit form: any status, but only for the owner or a manager.
export async function getProductForEdit(productId: string): Promise<Product | undefined> {
  if (!productId) return undefined;
  const row = await prisma.product.findUnique({ where: { id: productId }, include: productInclude });
  if (!row || !(await callerCanManageCompany(row.companyId))) return undefined;
  return toProduct(row);
}

export async function getInventoryHistory(productId: string) {
  const row = await prisma.product.findUnique({ where: { id: productId }, select: { companyId: true } });
  if (!row || !(await callerCanManageCompany(row.companyId))) return [];
  const moves = await prisma.inventoryMovement.findMany({
    where: { productId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { variant: { select: { title: true } } },
  });
  return moves.map(m => ({
    id: m.id,
    variantTitle: m.variant?.title ?? '(variante eliminada)',
    delta: m.delta,
    stockAfter: m.stockAfter,
    reason: m.reason,
    note: m.note ?? undefined,
    createdAt: m.createdAt.toISOString(),
  }));
}
