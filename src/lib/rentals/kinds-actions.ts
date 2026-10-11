'use server';

import { revalidateTag } from 'next/cache';
import * as z from 'zod';
import { prisma } from '../db';
import { getCurrentCaller, isManagerRole } from '../firebase-admin';
import { slugify } from '../slug';
import type { ActionResult } from '../shop/types';
import { loadRentalKinds } from './kinds';
import { RENTAL_CATEGORIES, isBuiltinKind, kindsFor, registerRentalKinds, type CustomRentalKind, type RentalCategory } from './types';

// Admin management of rental subcategories ("tipos"): the built-in ones are
// fixed; managers add, rename and remove their own. Everyone can read the
// list (the app needs it for its forms and filters).

export async function getRentalKinds(): Promise<CustomRentalKind[]> {
  return loadRentalKinds();
}

export type AdminRentalKind = { category: RentalCategory; key: string; label: string; builtin: boolean; listings: number };

export async function getRentalKindsForAdmin(): Promise<AdminRentalKind[] | undefined> {
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return undefined;
  await loadRentalKinds();
  const counts = await prisma.rentalListing.groupBy({ by: ['category', 'kind'], _count: { _all: true } });
  const used = new Map(counts.map(c => [`${c.category}:${c.kind}`, c._count._all]));
  return RENTAL_CATEGORIES.flatMap(category =>
    Object.entries(kindsFor(category)).map(([key, label]) => ({
      category, key, label, builtin: isBuiltinKind(category, key), listings: used.get(`${category}:${key}`) ?? 0,
    })),
  );
}

async function save(list: CustomRentalKind[]) {
  await prisma.siteSettings.update({ where: { id: 'main' }, data: { rentalKinds: list } });
  registerRentalKinds(list);
  revalidateTag('rental-kinds');
  revalidateTag('rentals');
}

async function requireManager(): Promise<string | undefined> {
  const caller = await getCurrentCaller();
  return caller && isManagerRole(caller.role) ? undefined : 'No tiene permiso para realizar esta acción.';
}

const labelSchema = z.string().trim().min(2, 'Escriba al menos 2 letras.').max(60, 'Máximo 60 caracteres.');
const categorySchema = z.enum(['property', 'vehicle', 'item', 'space']);

export async function addRentalKind(category: RentalCategory, label: string): Promise<ActionResult<{ key: string }>> {
  const denied = await requireManager();
  if (denied) return { success: false, message: denied };
  const c = categorySchema.safeParse(category);
  const l = labelSchema.safeParse(label);
  if (!c.success) return { success: false, message: 'Categoría no válida.' };
  if (!l.success) return { success: false, message: l.error.issues[0]?.message ?? 'Nombre no válido.' };
  const list = await loadRentalKinds();
  const existing = kindsFor(c.data);
  const sameName = Object.values(existing).some(v => slugify(v) === slugify(l.data));
  if (sameName) return { success: false, message: 'Ya existe un tipo con ese nombre en esta categoría.' };
  const base = slugify(l.data).slice(0, 50) || 'tipo';
  let key = base;
  for (let i = 2; key in existing; i++) key = `${base}-${i}`;
  if (list.length >= 200) return { success: false, message: 'Hay demasiados tipos personalizados.' };
  await save([...list, { category: c.data, key, label: l.data }]);
  return { success: true, key };
}

export async function renameRentalKind(category: RentalCategory, key: string, label: string): Promise<ActionResult> {
  const denied = await requireManager();
  if (denied) return { success: false, message: denied };
  const l = labelSchema.safeParse(label);
  if (!l.success) return { success: false, message: l.error.issues[0]?.message ?? 'Nombre no válido.' };
  const list = await loadRentalKinds();
  const index = list.findIndex(k => k.category === category && k.key === key);
  if (index < 0) return { success: false, message: 'Los tipos predeterminados no se pueden cambiar.' };
  const next = [...list];
  next[index] = { ...next[index], label: l.data };
  await save(next);
  return { success: true };
}

// Only when no listing uses it, so no listing is left with an unknown type.
export async function deleteRentalKind(category: RentalCategory, key: string): Promise<ActionResult> {
  const denied = await requireManager();
  if (denied) return { success: false, message: denied };
  const list = await loadRentalKinds();
  if (!list.some(k => k.category === category && k.key === key)) return { success: false, message: 'Los tipos predeterminados no se pueden eliminar.' };
  const inUse = await prisma.rentalListing.count({ where: { category, kind: key } });
  if (inUse > 0) return { success: false, message: `Hay ${inUse} ${inUse === 1 ? 'anuncio' : 'anuncios'} con este tipo. Cámbielos de tipo antes de eliminarlo.` };
  await save(list.filter(k => !(k.category === category && k.key === key)));
  return { success: true };
}
