'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { prisma } from './db';
import { getCurrentCaller } from './firebase-admin';
import { parsePremiumFeatureRules, PREMIUM_FEATURE_KEYS, type PremiumFeatureRules } from './premium-features';

type CategoryCount = { name: string; companies: number; premium: number };

// Admin page data: current rules plus every company category in use, with how
// many companies (and Premium companies) each has.
export async function getPremiumFeatureAdminData(): Promise<{ rules: PremiumFeatureRules; categories: CategoryCount[] } | null> {
  const caller = await getCurrentCaller();
  if (!caller || caller.role !== 'admin') return null;
  const [settings, all, premium] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { premiumFeatureRules: true } }),
    prisma.company.groupBy({ by: ['category'], where: { category: { not: '' } }, _count: { _all: true } }),
    prisma.company.groupBy({ by: ['category'], where: { category: { not: '' }, isPremium: true }, _count: { _all: true } }),
  ]);
  const premiumBy = new Map(premium.map(p => [p.category, p._count._all]));
  const categories = all
    .map(c => ({ name: c.category, companies: c._count._all, premium: premiumBy.get(c.category) ?? 0 }))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'));
  return { rules: parsePremiumFeatureRules(settings?.premiumFeatureRules), categories };
}

export async function savePremiumFeatureRules(raw: unknown): Promise<{ success: boolean; message?: string }> {
  const caller = await getCurrentCaller();
  if (!caller || caller.role !== 'admin') return { success: false, message: 'Solo un administrador puede cambiar estas reglas.' };
  const rules = parsePremiumFeatureRules(raw);
  const empty = PREMIUM_FEATURE_KEYS.filter(f => rules[f]?.mode === 'categories' && (rules[f] as { categories: string[] }).categories.length === 0);
  if (empty.length > 0) return { success: false, message: 'Elija al menos una categoría, o "Todas las categorías", en cada función.' };
  await prisma.siteSettings.update({ where: { id: 'main' }, data: { premiumFeatureRules: rules } });
  revalidateTag('site-settings');
  revalidatePath('/dashboard', 'layout');
  return { success: true };
}
