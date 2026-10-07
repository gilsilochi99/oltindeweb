'use server';

import { prisma, userInclude, toUser, toNotification } from './db';
import { getCurrentCaller, getSessionClaims } from './firebase-admin';
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
export async function ensureMyProfile(): Promise<AppUser | null> {
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
  const displayName = claims.name || 'Usuario';
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
