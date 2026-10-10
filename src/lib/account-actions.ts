'use server';

import { prisma, userInclude, toUser, toNotification } from './db';
import { cookies } from 'next/headers';
import { getAdminAuth, getCurrentCaller, getSessionClaims, SESSION_COOKIE_NAME } from './firebase-admin';
import { deletePrivateUploads } from './uploads';
import { renderEmail, sendEmail } from './email';
import type { AppUser, Notification } from './types';

// The signed-in user's own account data: profile, favorites, subscriptions,
// notifications and push tokens. These used to be direct client-SDK writes
// to the user's own Firestore doc (allowed by firestore.rules); with MySQL
// the browser can't reach the database, so each one is a Server Action that
// only ever touches the row of the session's own user.

const FAVORITE_TYPES = {
  company: 'companies',
  procedure: 'procedures',
  institution: 'institutions',
  job: 'jobs',
  event: 'events',
  place: 'places',
  itinerary: 'itineraries',
  professional: 'professionals',
} as const;
export type FavoriteKind = keyof typeof FAVORITE_TYPES;

// Loads the caller's profile, creating it on first sign-in. Identity comes
// from the verified session cookie (establishSession must have run first),
// never from values the client sends.
// `nameHint`: the name Sign in with Apple gives the app only on the very
// first sign-in (it isn't in the Firebase token), used when creating the profile.
export async function ensureMyProfile(nameHint?: string): Promise<AppUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;
  const uid = claims.uid;

  const existing = await prisma.user.findUnique({ where: { id: uid }, include: userInclude });
  if (existing) return toUser(existing);

  const email = claims.email?.toLowerCase();
  if (!email) throw new Error('La cuenta no tiene correo electrónico.');

  // Same person, new Firebase account (e.g. the old one was deleted and they
  // signed up again): re-key their existing profile to the new uid so they
  // keep their role, companies and history. Only when Firebase has verified
  // the email — otherwise anyone could register an unverified account with
  // someone else's address and take over their profile.
  const sameEmail = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (sameEmail) {
    if (!claims.email_verified) {
      throw new Error('Ya existe una cuenta con este correo. Verifique su correo electrónico para continuar.');
    }
    const oldId = sameEmail.id;
    await prisma.$transaction([
      // Foreign keys follow via ON UPDATE CASCADE; these columns have none.
      prisma.jobPosting.updateMany({ where: { ownerId: oldId }, data: { ownerId: uid } }),
      prisma.event.updateMany({ where: { ownerId: oldId }, data: { ownerId: uid } }),
      prisma.menuItem.updateMany({ where: { ownerId: oldId }, data: { ownerId: uid } }),
      prisma.review.updateMany({ where: { authorId: oldId }, data: { authorId: uid } }),
      prisma.touristLocation.updateMany({ where: { submittedBy: oldId }, data: { submittedBy: uid } }),
      prisma.user.update({ where: { id: oldId }, data: { id: uid } }),
    ]);
    return toUser((await prisma.user.findUnique({ where: { id: uid }, include: userInclude }))!);
  }

  const isFirstUser = (await prisma.user.count()) === 0;
  const hint = typeof nameHint === 'string' ? nameHint.replace(/s+/g, ' ').trim().slice(0, 80) : '';
  const displayName = claims.name || hint || 'Usuario';
  const created = await prisma.user.create({
    data: {
      id: uid,
      email,
      displayName,
      photoURL: claims.picture ?? null,
      role: isFirstUser ? 'admin' : 'user',
      isPremium: false,
      createdAt: new Date(),
      notifications: {
        create: {
          message: `¡Bienvenido a Oltinde, ${displayName}! Estamos contentos de tenerte aquí.`,
          link: '/profile',
        },
      },
    },
    include: userInclude,
  });
  return toUser(created);
}

async function requireUid(): Promise<string> {
  const caller = await getCurrentCaller();
  if (!caller) throw new Error('Debe iniciar sesión para realizar esta acción.');
  return caller.uid;
}

export async function setFavorite(kind: FavoriteKind, entityId: string, on: boolean): Promise<void> {
  const userId = await requireUid();
  const type = FAVORITE_TYPES[kind];
  if (on) {
    await prisma.userFavorite.upsert({
      where: { userId_type_entityId: { userId, type, entityId } },
      update: {},
      create: { userId, type, entityId },
    });
  } else {
    await prisma.userFavorite.deleteMany({ where: { userId, type, entityId } });
  }
}

export async function setSubscription(kind: 'company' | 'category', value: string, on: boolean): Promise<void> {
  const userId = await requireUid();
  if (on) {
    await prisma.userSubscription.upsert({
      where: { userId_kind_value: { userId, kind, value } },
      update: {},
      create: { userId, kind, value },
    });
  } else {
    await prisma.userSubscription.deleteMany({ where: { userId, kind, value } });
  }
}

export async function getMyNotifications(): Promise<Notification[]> {
  const caller = await getCurrentCaller();
  if (!caller) return [];
  const rows = await prisma.notification.findMany({
    where: { userId: caller.uid },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return rows.map(toNotification);
}

export async function markAllMyNotificationsRead(): Promise<void> {
  const userId = await requireUid();
  await prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } });
}

export async function markMyNotificationRead(notificationId: string): Promise<void> {
  const userId = await requireUid();
  await prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } });
}

export async function addMyPushToken(token: string): Promise<void> {
  const userId = await requireUid();
  // A device token belongs to whoever enabled push on it most recently.
  await prisma.fcmToken.upsert({ where: { token }, update: { userId }, create: { token, userId } });
}

export async function removeMyPushToken(token: string): Promise<void> {
  const userId = await requireUid();
  await prisma.fcmToken.deleteMany({ where: { token, userId } });
}

// Deletes the caller's own account (Términos, /eliminar-cuenta): the Firebase
// login and the profile row — favorites, subscriptions, notifications, push
// tokens, posts, itineraries, professional profiles, claims and verification
// requests go with it (ON DELETE CASCADE). Reviews and product questions stay
// but anonymised, so ratings don't change; orders and bookings keep the
// customer details the seller needs (customerId is set to NULL); companies
// stay published without a manager. Staff must lose their role first, so an
// admin can't lock the team out by accident.
export async function deleteMyAccount(confirmation: string): Promise<{ success: boolean; message?: string }> {
  const claims = await getSessionClaims();
  if (!claims) return { success: false, message: 'Debe iniciar sesión para eliminar su cuenta.' };
  if (String(confirmation ?? '').trim().toUpperCase() !== 'ELIMINAR') {
    return { success: false, message: 'Escriba ELIMINAR para confirmar.' };
  }
  const uid = claims.uid;
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { email: true, displayName: true, role: true } });
  if (user && user.role !== 'user') {
    return { success: false, message: 'Las cuentas del equipo de Oltinde no se eliminan desde aquí. Pida a un administrador que le quite el rol primero.' };
  }

  try {
    const verifications = await prisma.companyVerification.findMany({ where: { userId: uid }, select: { documents: true } });
    const documentKeys = verifications.flatMap(v => (Array.isArray(v.documents) ? v.documents : []) as { key?: string }[])
      .map(d => d?.key).filter((k): k is string => typeof k === 'string');

    await prisma.$transaction([
      prisma.review.updateMany({ where: { authorId: uid }, data: { authorId: null, author: 'Usuario de Oltinde' } }),
      prisma.productQuestion.updateMany({ where: { authorId: uid }, data: { authorId: null, authorName: 'Usuario de Oltinde' } }),
      prisma.assistantLog.deleteMany({ where: { userId: uid } }),
      prisma.inventoryMovement.updateMany({ where: { userId: uid }, data: { userId: null } }),
      prisma.user.deleteMany({ where: { id: uid } }),
    ]);
    await deletePrivateUploads(documentKeys);

    try {
      await getAdminAuth().deleteUser(uid);
    } catch (error) {
      if ((error as { code?: string })?.code !== 'auth/user-not-found') throw error;
    }
    try {
      (await cookies()).delete(SESSION_COOKIE_NAME);
    } catch {
      // the app has no cookie session
    }

    const email = user?.email || claims.email;
    if (email) {
      const { html, text } = renderEmail({
        title: 'Su cuenta de Oltinde se ha eliminado',
        paragraphs: [
          user?.displayName ? `Hola, ${user.displayName}:` : 'Hola:',
          'Hemos eliminado su cuenta de Oltinde y sus datos personales, como se explica en https://oltinde.com/eliminar-cuenta.',
          'Si no ha sido usted, responda a este correo o escriba a privacidad@oltinde.com.',
        ],
      });
      await sendEmail({ to: email, subject: 'Su cuenta de Oltinde se ha eliminado', html, text }).catch(() => false);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting account:', error);
    return { success: false, message: 'No se pudo eliminar la cuenta. Inténtelo de nuevo o escriba a privacidad@oltinde.com.' };
  }
}
