import { unstable_cache } from 'next/cache';
import { prisma } from '../db';
import { registerRentalKinds, type CustomRentalKind } from './types';

// Rental subcategories added by admins, stored in site_settings.rentalKinds.
// Server-only (not a 'use server' module): server code awaits
// loadRentalKinds() before validating or labelling listings.

const readCustomKinds = unstable_cache(async (): Promise<CustomRentalKind[]> => {
  const s = await prisma.siteSettings.findUnique({ where: { id: 'main' }, select: { rentalKinds: true } });
  return Array.isArray(s?.rentalKinds) ? (s!.rentalKinds as CustomRentalKind[]) : [];
}, ['rental-kinds'], { revalidate: 300, tags: ['rental-kinds'] });

export async function loadRentalKinds(): Promise<CustomRentalKind[]> {
  const list = await readCustomKinds().catch(() => [] as CustomRentalKind[]);
  registerRentalKinds(list);
  return list;
}
