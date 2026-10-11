import { prisma, Prisma } from '../db';
import { getCurrentCaller, getSessionClaims, isManagerRole, type Caller } from '../firebase-admin';
import { premiumFeatureDenied } from '../premium-access';

// Who advertises: a company (scope = its id) or the signed-in person
// (scope = 'me'). Server-only helpers shared by the rentals actions,
// bookings and stats; not a 'use server' module.

export const PRIVATE_SCOPE = 'me';

export type Advertiser = {
  caller: Caller;
  isIndividual: boolean;
  /** Prisma filter selecting this advertiser's listings / bookings. */
  where: { companyId: string } | { companyId: null; ownerId: string };
  /** Fields to store on a new listing / booking. */
  owner: { companyId: string; ownerId: null } | { companyId: null; ownerId: string };
  /** Folder for uploaded photos: rentals/<this>/ */
  folder: string;
  /** Dashboard page for bookings, for notification links. */
  bookingsPath: string;
};

export type AdvertiserCheck = { ok: true; advertiser: Advertiser } | { ok: false; message: string };

export function privateFolder(uid: string) {
  return `u-${uid}`;
}

export function bookingsPathFor(companyId: string | null | undefined): string {
  return companyId ? `/dashboard/companies/${companyId}/rentals/bookings` : '/dashboard/alquileres/bookings';
}

function forCompany(caller: Caller, companyId: string): Advertiser {
  return {
    caller, isIndividual: false,
    where: { companyId },
    owner: { companyId, ownerId: null },
    folder: companyId,
    bookingsPath: bookingsPathFor(companyId),
  };
}

function forPerson(caller: Caller, uid: string): Advertiser {
  return {
    caller, isIndividual: true,
    where: { companyId: null, ownerId: uid },
    owner: { companyId: null, ownerId: uid },
    folder: privateFolder(uid),
    bookingsPath: bookingsPathFor(null),
  };
}

// For writes. A company needs the Premium "rentals" feature (unless the
// caller is a manager); a private person needs a verified email.
export async function resolveAdvertiser(scope: string, opts: { forWrite?: boolean } = {}): Promise<AdvertiserCheck> {
  const caller = await getCurrentCaller();
  if (!caller) return { ok: false, message: 'Debe iniciar sesión para realizar esta acción.' };
  if (typeof scope !== 'string' || !scope || scope.length > 128) return { ok: false, message: 'Anunciante no válido.' };

  if (scope === PRIVATE_SCOPE) {
    if (opts.forWrite) {
      const claims = await getSessionClaims();
      if (!claims?.email_verified) return { ok: false, message: 'Verifique su correo electrónico antes de publicar anuncios de alquiler.' };
      const user = await prisma.user.findUnique({ where: { id: caller.uid }, select: { isActive: true } });
      if (!user || user.isActive === false) return { ok: false, message: 'Su cuenta no puede publicar anuncios.' };
    }
    return { ok: true, advertiser: forPerson(caller, caller.uid) };
  }

  const company = await prisma.company.findUnique({ where: { id: scope }, select: { ownerId: true, isPremium: true, category: true } });
  if (!company) return { ok: false, message: 'Empresa no encontrada.' };
  if (isManagerRole(caller.role)) return { ok: true, advertiser: forCompany(caller, scope) };
  if (company.ownerId !== caller.uid) return { ok: false, message: 'No tiene permiso para gestionar los alquileres de esta empresa.' };
  if (opts.forWrite) {
    const denied = await premiumFeatureDenied(company, 'rentals');
    if (denied) return { ok: false, message: denied };
  }
  return { ok: true, advertiser: forCompany(caller, scope) };
}

// The advertiser behind an existing listing (company owner, the private
// owner, or a manager).
export async function resolveListingAdvertiser(listingId: string, opts: { forWrite?: boolean } = {}): Promise<AdvertiserCheck & { listingId?: string }> {
  const l = await prisma.rentalListing.findUnique({ where: { id: listingId }, select: { companyId: true, ownerId: true } });
  if (!l) return { ok: false, message: 'Anuncio no encontrado.' };
  if (l.companyId) return resolveAdvertiser(l.companyId, opts);
  const caller = await getCurrentCaller();
  if (!caller) return { ok: false, message: 'Debe iniciar sesión para realizar esta acción.' };
  if (isManagerRole(caller.role)) return { ok: true, advertiser: forPerson(caller, l.ownerId ?? '') };
  if (!l.ownerId || l.ownerId !== caller.uid) return { ok: false, message: 'No tiene permiso para gestionar este anuncio.' };
  return resolveAdvertiser(PRIVATE_SCOPE, opts);
}

// Same check for a booking's advertiser side.
export async function canManageBooking(b: { companyId: string | null; ownerId: string | null }): Promise<Caller | null> {
  const caller = await getCurrentCaller();
  if (!caller) return null;
  if (isManagerRole(caller.role)) return caller;
  if (b.companyId) {
    const c = await prisma.company.findUnique({ where: { id: b.companyId }, select: { ownerId: true } });
    return c?.ownerId === caller.uid ? caller : null;
  }
  return b.ownerId && b.ownerId === caller.uid ? caller : null;
}

// Who to notify about a booking: the company's owner or the private advertiser.
export async function advertiserUserId(b: { companyId: string | null; ownerId: string | null }): Promise<string | null> {
  if (b.companyId) {
    const c = await prisma.company.findUnique({ where: { id: b.companyId }, select: { ownerId: true } });
    return c?.ownerId ?? null;
  }
  return b.ownerId;
}

export type AdvertiserWhere = Prisma.RentalListingWhereInput & Prisma.RentalBookingWhereInput;
