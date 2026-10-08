'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma, Prisma } from '../db';
import { getCurrentCaller, isManagerRole, type Caller } from '../firebase-admin';
import { deleteUploadByUrl } from '../uploads';
import { recomputeProductAggregates, uniqueCategorySlug, uniqueProductSlug } from './db';
import { variantTitle, type ActionResult, type ProductCategoryInput, type ProductInput, type ProductStatus } from './types';
import { premiumFeatureDenied } from '../premium-access';

// Write side of the marketplace. Every action re-checks the caller on the
// server and validates its input with zod — the dashboard forms validate
// too, but anything reaching a Server Action is untrusted.

const MAX_OPTIONS = 3;
const MAX_VARIANTS = 100;
const MAX_IMAGES = 12;

function fail(error: unknown, fallback: string): { success: false; message: string } {
  if (error instanceof z.ZodError) {
    return { success: false, message: error.issues[0]?.message ?? fallback };
  }
  console.error(fallback, error);
  return { success: false, message: error instanceof Error ? error.message : fallback };
}

// Image URLs come from the client, so only files inside this company's own
// products/<companyId>/ upload folder are ever deleted — a seller can't make
// us remove someone else's file by listing its URL and then removing it.
async function deleteProductImages(companyId: string, urls: string[]) {
  const own = Array.from(new Set(urls)).filter(u => u.includes(`/products/${companyId}/`));
  await Promise.allSettled(own.map(u => deleteUploadByUrl(u)));
}

function revalidateShop(companyId: string) {
  revalidateTag('shop-products');
  revalidatePath(`/dashboard/companies/${companyId}/shop`);
}

// ---------------------------------------------------------------- permissions

type SellerCheck = { ok: true; caller: Caller } | { ok: false; message: string };

// Selling is a premium feature, like online food ordering: the company owner
// may manage products once the company is premium; managers always can.
async function checkSeller(companyId: string): Promise<SellerCheck> {
  const caller = await getCurrentCaller();
  if (!caller) return { ok: false, message: 'Debe iniciar sesión para realizar esta acción.' };
  const company = await prisma.company.findUnique({ where: { id: companyId }, select: { ownerId: true, isPremium: true, category: true } });
  if (!company) return { ok: false, message: 'Empresa no encontrada.' };
  if (isManagerRole(caller.role)) return { ok: true, caller };
  if (company.ownerId !== caller.uid) return { ok: false, message: 'No tiene permiso para gestionar los productos de esta empresa.' };
  const denied = await premiumFeatureDenied(company, 'shop');
  if (denied) return { ok: false, message: denied };
  return { ok: true, caller };
}

async function checkProductSeller(productId: string): Promise<(SellerCheck & { companyId?: string })> {
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { companyId: true } });
  if (!product) return { ok: false, message: 'Producto no encontrado.' };
  const check = await checkSeller(product.companyId);
  return { ...check, companyId: product.companyId };
}

async function checkManager(): Promise<SellerCheck> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { ok: false, message: 'No tiene permiso para realizar esta acción.' };
  return { ok: true, caller };
}

// ---------------------------------------------------------------- validation

const trimmed = (max: number) => z.string().trim().max(max);
const imageUrl = z.string().trim().min(1).max(2048).refine(
  u => u.startsWith('/') || /^https?:\/\//.test(u),
  'URL de imagen no válida.',
);

const variantSchema = z.object({
  id: z.string().max(128).optional(),
  optionValues: z.array(trimmed(128).min(1)).max(MAX_OPTIONS),
  sku: trimmed(64).optional(),
  price: z.coerce.number().min(0, 'El precio no puede ser negativo.').max(1e10),
  compareAtPrice: z.coerce.number().min(0).max(1e10).nullable().optional(),
  stock: z.coerce.number().int('El stock debe ser un número entero.').min(0, 'El stock no puede ser negativo.').max(1e7),
  stockLoaded: z.coerce.number().int().optional(),
  trackInventory: z.boolean(),
  allowBackorder: z.boolean(),
  image: imageUrl.optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

const productSchema = z.object({
  categoryId: z.string().max(128).nullable().optional(),
  title: trimmed(255).min(3, 'El título debe tener al menos 3 caracteres.'),
  shortDescription: trimmed(512).optional(),
  description: z.string().trim().max(20000),
  brand: trimmed(128).optional(),
  condition: z.enum(['new', 'used', 'refurbished']),
  status: z.enum(['draft', 'active', 'archived']),
  options: z.array(z.object({
    name: trimmed(64).min(1, 'Cada opción necesita un nombre.'),
    values: z.array(trimmed(128).min(1)).min(1, 'Cada opción necesita al menos un valor.').max(50),
  })).max(MAX_OPTIONS, `Máximo ${MAX_OPTIONS} opciones por producto.`),
  specs: z.array(z.object({ name: trimmed(128).min(1), value: trimmed(512).min(1) })).max(50),
  tags: z.array(trimmed(64).min(1)).max(30),
  images: z.array(z.object({ url: imageUrl, alt: trimmed(255).optional() })).max(MAX_IMAGES, `Máximo ${MAX_IMAGES} imágenes.`),
  variants: z.array(variantSchema).min(1, 'El producto necesita al menos una variante.').max(MAX_VARIANTS, `Máximo ${MAX_VARIANTS} variantes.`),
}).superRefine((p, ctx) => {
  const optionNames = p.options.map(o => o.name.toLowerCase());
  if (new Set(optionNames).size !== optionNames.length) {
    ctx.addIssue({ code: 'custom', message: 'Hay opciones con el mismo nombre.' });
  }
  const seen = new Set<string>();
  for (const v of p.variants) {
    if (v.optionValues.length !== p.options.length) {
      ctx.addIssue({ code: 'custom', message: 'Cada variante debe tener un valor para cada opción.' });
      return;
    }
    v.optionValues.forEach((value, i) => {
      if (!p.options[i].values.includes(value)) {
        ctx.addIssue({ code: 'custom', message: `"${value}" no es un valor de la opción ${p.options[i].name}.` });
      }
    });
    const key = v.optionValues.join('\u0000');
    if (seen.has(key)) ctx.addIssue({ code: 'custom', message: `La variante ${variantTitle(v.optionValues)} está repetida.` });
    seen.add(key);
  }
  if (p.status === 'active') {
    if (!p.categoryId) ctx.addIssue({ code: 'custom', message: 'Elija una categoría antes de publicar.' });
    if (p.images.length === 0) ctx.addIssue({ code: 'custom', message: 'Añada al menos una imagen antes de publicar.' });
    if (p.description.length < 10) ctx.addIssue({ code: 'custom', message: 'La descripción debe tener al menos 10 caracteres para publicar.' });
    if (!p.variants.some(v => (v.isActive ?? true) && v.price > 0)) {
      ctx.addIssue({ code: 'custom', message: 'Indique un precio mayor que 0 antes de publicar.' });
    }
  }
});

async function assertCategoryExists(categoryId: string | null | undefined) {
  if (!categoryId) return;
  const category = await prisma.productCategory.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!category) throw new Error('La categoría seleccionada no existe.');
}

function productFields(p: z.infer<typeof productSchema>) {
  return {
    categoryId: p.categoryId || null,
    title: p.title,
    shortDescription: p.shortDescription || null,
    description: p.description,
    brand: p.brand || null,
    condition: p.condition,
    status: p.status,
    options: p.options as Prisma.InputJsonValue,
    specs: p.specs as Prisma.InputJsonValue,
    tags: Array.from(new Set(p.tags.map(t => t.toLowerCase()))) as Prisma.InputJsonValue,
  };
}

function variantFields(v: z.infer<typeof variantSchema>, position: number) {
  const compareAt = v.compareAtPrice && v.compareAtPrice > 0 ? v.compareAtPrice : null;
  return {
    title: variantTitle(v.optionValues),
    optionValues: v.optionValues as Prisma.InputJsonValue,
    sku: v.sku || null,
    price: v.price,
    compareAtPrice: compareAt,
    trackInventory: v.trackInventory,
    allowBackorder: v.allowBackorder,
    image: v.image || null,
    position,
    isActive: v.isActive ?? true,
  };
}

// ---------------------------------------------------------------- products

export async function createProduct(companyId: string, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  try {
    const check = await checkSeller(companyId);
    if (!check.ok) return { success: false, message: check.message };
    const data = productSchema.parse(input);
    await assertCategoryExists(data.categoryId);
    const slug = await uniqueProductSlug(data.title);

    const id = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          ...productFields(data),
          companyId,
          slug,
          publishedAt: data.status === 'active' ? new Date() : null,
          images: { create: data.images.map((img, i) => ({ url: img.url, alt: img.alt || null, position: i })) },
        },
      });
      for (const [i, v] of data.variants.entries()) {
        const variant = await tx.productVariant.create({ data: { ...variantFields(v, i), productId: product.id, stock: v.stock } });
        if (v.stock !== 0) {
          await tx.inventoryMovement.create({
            data: { productId: product.id, variantId: variant.id, delta: v.stock, stockAfter: v.stock, reason: 'initial', userId: check.caller.uid },
          });
        }
      }
      await recomputeProductAggregates(tx, product.id);
      return product.id;
    });

    revalidateShop(companyId);
    return { success: true, id };
  } catch (error) {
    return fail(error, 'No se pudo crear el producto.');
  }
}

export async function updateProduct(productId: string, input: ProductInput): Promise<ActionResult> {
  try {
    const check = await checkProductSeller(productId);
    if (!check.ok) return { success: false, message: check.message };
    const data = productSchema.parse(input);
    await assertCategoryExists(data.categoryId);

    const removedImageUrls = await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUniqueOrThrow({
        where: { id: productId },
        select: { publishedAt: true, images: { select: { url: true } }, variants: true },
      });

      await tx.product.update({
        where: { id: productId },
        data: {
          ...productFields(data),
          publishedAt: data.status === 'active' && !current.publishedAt ? new Date() : undefined,
        },
      });

      await tx.productImage.deleteMany({ where: { productId } });
      await tx.productImage.createMany({
        data: data.images.map((img, i) => ({ productId, url: img.url, alt: img.alt || null, position: i })),
      });

      const existing = new Map(current.variants.map(v => [v.id, v]));
      const keptIds = new Set(data.variants.map(v => v.id).filter((id): id is string => !!id && existing.has(id)));
      await tx.productVariant.deleteMany({ where: { productId, id: { notIn: Array.from(keptIds) } } });

      for (const [i, v] of data.variants.entries()) {
        const prev = v.id ? existing.get(v.id) : undefined;
        if (prev) {
          // Apply only what the seller changed relative to what their form
          // loaded, on top of the live value (see ProductVariantInput).
          const delta = v.stock - (v.stockLoaded ?? prev.stock);
          const updated = await tx.productVariant.update({
            where: { id: prev.id },
            data: { ...variantFields(v, i), ...(delta !== 0 ? { stock: { increment: delta } } : {}) },
          });
          if (delta !== 0) {
            await tx.inventoryMovement.create({
              data: { productId, variantId: prev.id, delta, stockAfter: updated.stock, reason: 'adjustment', userId: check.caller.uid },
            });
          }
        } else {
          const created = await tx.productVariant.create({ data: { ...variantFields(v, i), productId, stock: v.stock } });
          if (v.stock !== 0) {
            await tx.inventoryMovement.create({
              data: { productId, variantId: created.id, delta: v.stock, stockAfter: v.stock, reason: 'initial', userId: check.caller.uid },
            });
          }
        }
      }

      await recomputeProductAggregates(tx, productId);

      const keptUrls = new Set([...data.images.map(i => i.url), ...data.variants.map(v => v.image).filter(Boolean)]);
      const oldUrls = [...current.images.map(i => i.url), ...current.variants.map(v => v.image).filter((u): u is string => !!u)];
      return oldUrls.filter(u => !keptUrls.has(u));
    });

    // Best-effort cleanup of images the seller removed; never fails the save.
    await deleteProductImages(check.companyId!, removedImageUrls);

    revalidateShop(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo guardar el producto.');
  }
}

export async function setProductStatus(productId: string, status: ProductStatus): Promise<ActionResult> {
  try {
    const check = await checkProductSeller(productId);
    if (!check.ok) return { success: false, message: check.message };
    z.enum(['draft', 'active', 'archived']).parse(status);

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { categoryId: true, description: true, publishedAt: true, minPrice: true, _count: { select: { images: true } } },
    });
    if (status === 'active') {
      if (!product.categoryId) return { success: false, message: 'Elija una categoría antes de publicar.' };
      if (product._count.images === 0) return { success: false, message: 'Añada al menos una imagen antes de publicar.' };
      if (Number(product.minPrice) <= 0) return { success: false, message: 'Indique un precio mayor que 0 antes de publicar.' };
      if (product.description.trim().length < 10) return { success: false, message: 'La descripción debe tener al menos 10 caracteres para publicar.' };
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status, publishedAt: status === 'active' && !product.publishedAt ? new Date() : undefined },
    });
    revalidateShop(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo cambiar el estado del producto.');
  }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  try {
    const check = await checkProductSeller(productId);
    if (!check.ok) return { success: false, message: check.message };

    const product = await prisma.product.findUniqueOrThrow({
      where: { id: productId },
      select: { images: { select: { url: true } }, variants: { select: { image: true } } },
    });
    await prisma.product.delete({ where: { id: productId } });

    const urls = [...product.images.map(i => i.url), ...product.variants.map(v => v.image).filter((u): u is string => !!u)];
    await deleteProductImages(check.companyId!, urls);

    revalidateShop(check.companyId!);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar el producto.');
  }
}

// Quick restock/adjustment from the product list, without opening the form.
export async function adjustVariantStock(variantId: string, delta: number, note?: string): Promise<ActionResult<{ stock: number }>> {
  try {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId }, select: { productId: true, stock: true } });
    if (!variant) return { success: false, message: 'Variante no encontrada.' };
    const check = await checkProductSeller(variant.productId);
    if (!check.ok) return { success: false, message: check.message };
    const amount = z.coerce.number().int('La cantidad debe ser un número entero.').refine(n => n !== 0, 'Indique una cantidad distinta de 0.').parse(delta);
    if (variant.stock + amount < 0) return { success: false, message: 'El stock no puede quedar negativo.' };

    const stock = await prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({ where: { id: variantId }, data: { stock: { increment: amount } } });
      await tx.inventoryMovement.create({
        data: {
          productId: variant.productId, variantId, delta: amount, stockAfter: updated.stock,
          reason: 'adjustment', note: note?.trim().slice(0, 512) || null, userId: check.caller.uid,
        },
      });
      await recomputeProductAggregates(tx, variant.productId);
      return updated.stock;
    });

    revalidateShop(check.companyId!);
    return { success: true, stock };
  } catch (error) {
    return fail(error, 'No se pudo ajustar el stock.');
  }
}

export async function setProductFeatured(productId: string, isFeatured: boolean): Promise<ActionResult> {
  try {
    const check = await checkManager();
    if (!check.ok) return { success: false, message: check.message };
    const product = await prisma.product.update({ where: { id: productId }, data: { isFeatured }, select: { companyId: true } });
    revalidateShop(product.companyId);
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo actualizar el producto.');
  }
}

// ---------------------------------------------------------------- categories

const categorySchema = z.object({
  parentId: z.string().max(128).nullable().optional(),
  name: trimmed(255).min(2, 'El nombre debe tener al menos 2 caracteres.'),
  description: trimmed(2000).optional(),
  image: imageUrl.optional().or(z.literal('')),
  position: z.coerce.number().int().min(0).max(100000).optional(),
  isActive: z.boolean().optional(),
});

function revalidateCategories() {
  revalidateTag('product-categories');
  revalidatePath('/admin/shop/categories');
}

export async function createProductCategory(input: ProductCategoryInput): Promise<ActionResult<{ id: string }>> {
  try {
    const check = await checkManager();
    if (!check.ok) return { success: false, message: check.message };
    const data = categorySchema.parse(input);
    if (data.parentId) {
      const parent = await prisma.productCategory.findUnique({ where: { id: data.parentId }, select: { id: true } });
      if (!parent) return { success: false, message: 'La categoría padre no existe.' };
    }
    const category = await prisma.productCategory.create({
      data: {
        parentId: data.parentId || null,
        name: data.name,
        slug: await uniqueCategorySlug(data.name),
        description: data.description || null,
        image: data.image || null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    revalidateCategories();
    return { success: true, id: category.id };
  } catch (error) {
    return fail(error, 'No se pudo crear la categoría.');
  }
}

export async function updateProductCategory(categoryId: string, input: ProductCategoryInput): Promise<ActionResult> {
  try {
    const check = await checkManager();
    if (!check.ok) return { success: false, message: check.message };
    const data = categorySchema.parse(input);

    // A category can't be moved under itself or one of its descendants.
    if (data.parentId) {
      const all = await prisma.productCategory.findMany({ select: { id: true, parentId: true } });
      const parentOf = new Map(all.map(c => [c.id, c.parentId]));
      if (!parentOf.has(data.parentId)) return { success: false, message: 'La categoría padre no existe.' };
      for (let id: string | null | undefined = data.parentId; id; id = parentOf.get(id)) {
        if (id === categoryId) return { success: false, message: 'Una categoría no puede estar dentro de sí misma.' };
      }
    }

    const current = await prisma.productCategory.findUniqueOrThrow({ where: { id: categoryId }, select: { name: true, image: true } });
    await prisma.productCategory.update({
      where: { id: categoryId },
      data: {
        parentId: data.parentId || null,
        name: data.name,
        // Slug follows renames; product URLs don't include it, only category pages.
        slug: current.name === data.name ? undefined : await uniqueCategorySlug(data.name, categoryId),
        description: data.description || null,
        image: data.image || null,
        position: data.position ?? 0,
        isActive: data.isActive ?? true,
      },
    });
    if (current.image && current.image !== (data.image || null)) {
      await deleteUploadByUrl(current.image).catch(() => {});
    }
    revalidateCategories();
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo actualizar la categoría.');
  }
}

export async function deleteProductCategory(categoryId: string): Promise<ActionResult> {
  try {
    const check = await checkManager();
    if (!check.ok) return { success: false, message: check.message };
    const category = await prisma.productCategory.findUniqueOrThrow({
      where: { id: categoryId },
      select: { image: true, _count: { select: { children: true, products: true } } },
    });
    if (category._count.children > 0) {
      return { success: false, message: 'Elimine o mueva primero sus subcategorías.' };
    }
    if (category._count.products > 0) {
      return { success: false, message: `Hay ${category._count.products} producto(s) en esta categoría. Desactívela en lugar de eliminarla.` };
    }
    await prisma.productCategory.delete({ where: { id: categoryId } });
    if (category.image) await deleteUploadByUrl(category.image).catch(() => {});
    revalidateCategories();
    return { success: true };
  } catch (error) {
    return fail(error, 'No se pudo eliminar la categoría.');
  }
}

// ---------------------------------------------------------------- storefront

// Fire-and-forget from the product page. Only published products count, and
// the seller's own visits don't inflate their numbers.
export async function recordProductView(productId: string): Promise<void> {
  try {
    if (typeof productId !== 'string' || productId.length > 128) return;
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { status: true, company: { select: { ownerId: true } } } });
    if (!product || product.status !== 'active') return;
    const caller = await getCurrentCaller();
    if (caller && caller.uid === product.company.ownerId) return;
    // Raw SQL so the @updatedAt timestamp (seller "last edited", sitemap) isn't bumped by every view.
    await prisma.$executeRaw`UPDATE products SET viewCount = viewCount + 1 WHERE id = ${productId}`;
  } catch {
    // analytics only
  }
}
