
'use server';

import { prisma, userInclude, toUser } from './db';
import type { AppUser } from './types';
import { renderEmail, sendEmail } from './email';
import { getAdminMessaging } from './firebase-admin';

// Best-effort push send to one or more of a user's saved device tokens.
// Never throws — an expired/invalid token (the common case: uninstalled
// PWA, revoked permission, browser data cleared) shouldn't break the
// in-app notification or email that already succeeded alongside it.
async function sendPushToTokens(tokens: string[], payload: { title: string; body: string; link: string }) {
  if (tokens.length === 0) return;
  try {
    await getAdminMessaging().sendEachForMulticast({
      tokens,
      // Web: data-only, the service worker (src/app/sw.js) shows it.
      data: { title: payload.title, body: payload.body, link: payload.link },
      // Android app: a visible notification (applies to app tokens only, not
      // to web push); tapping it hands `data.link` to the app.
      android: {
        priority: 'high',
        notification: { title: payload.title, body: payload.body, channelId: 'default', color: '#FFCD00' },
      },
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
  }
}

type NotificationType = 'offer' | 'announcement' | 'job' | 'event';

// Both Company and Institution satisfy this shape structurally, so events organized
// by either can share the same notification path without a Company-specific cast.
type NotifiableOrganizer = { id: string; name: string; category: string };

// A Record<NotificationType, ...> here (rather than binary if/else or ternaries)
// means the compiler forces every notification type to define its own message,
// email subject, template, and opt-in check — adding a type without updating this
// map is a compile error, not a silent fallthrough to another type's copy.
const NOTIFICATION_COPY: Record<NotificationType, {
  message: (companyName: string, title: string) => string;
  emailSubject: (companyName: string) => string;
  emailIntro: string;
  emailCta: string;
  wantsEmail: (user: AppUser) => boolean;
  wantsPush: (user: AppUser) => boolean;
}> = {
  offer: {
    message: (companyName, title) => `Nueva oferta de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nueva Oferta de ${companyName}`,
    emailIntro: 'Se ha publicado una nueva oferta que puede interesarle:',
    emailCta: 'Ver oferta',
    wantsEmail: (user) => !!user.notificationSettings?.email?.newOffers,
    wantsPush: (user) => !!user.notificationSettings?.push?.newOffers,
  },
  announcement: {
    message: (companyName, title) => `Nuevo anuncio de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nuevo Anuncio de ${companyName}`,
    emailIntro: 'Se ha publicado un nuevo anuncio que puede interesarle:',
    emailCta: 'Leer anuncio',
    wantsEmail: (user) => !!user.notificationSettings?.email?.newAnnouncements,
    wantsPush: (user) => !!user.notificationSettings?.push?.newAnnouncements,
  },
  job: {
    message: (companyName, title) => `Nueva oferta de empleo de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nueva Oferta de Empleo de ${companyName}`,
    emailIntro: 'Se ha publicado una nueva oferta de empleo que puede interesarle:',
    emailCta: 'Ver empleo',
    wantsEmail: (user) => !!user.notificationSettings?.email?.newJobs,
    wantsPush: (user) => !!user.notificationSettings?.push?.newJobs,
  },
  event: {
    message: (companyName, title) => `Nuevo evento de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nuevo Evento de ${companyName}`,
    emailIntro: 'Se ha publicado un nuevo evento que puede interesarle:',
    emailCta: 'Ver evento',
    wantsEmail: (user) => !!user.notificationSettings?.email?.newEvents,
    wantsPush: (user) => !!user.notificationSettings?.push?.newEvents,
  },
};

export async function createNotificationsForSubscribers(
  company: NotifiableOrganizer,
  item: { title: string; link: string },
  type: NotificationType
) {
  try {
    const copy = NOTIFICATION_COPY[type];

    // One indexed lookup on user_subscriptions for users subscribed to this
    // organizer or its category, instead of scanning every user.
    const subscribers = await prisma.user.findMany({
      where: {
        subscriptions: {
          some: {
            OR: [
              { kind: 'company', value: company.id },
              { kind: 'category', value: company.category },
            ],
          },
        },
      },
      include: userInclude,
    });
    const subscribersById = new Map<string, AppUser>(subscribers.map(u => [u.id, toUser(u)]));

    if (subscribersById.size === 0) {
      console.log('No subscribers found for this update.');
      return;
    }

    const message = copy.message(company.name, item.title);
    const pushTokens: string[] = [];

    await prisma.notification.createMany({
      data: [...subscribersById.keys()].map(userId => ({ userId, message, link: item.link })),
    });

    for (const user of subscribersById.values()) {
      if (user.email && copy.wantsEmail(user)) {
        const { html, text } = renderEmail({
          title: copy.emailSubject(company.name),
          paragraphs: [copy.emailIntro, item.title],
          cta: { label: copy.emailCta, link: item.link },
          footer: `Recibe este correo porque sigue a ${company.name} o a su categoría en Oltinde.`,
        });
        await sendEmail({ to: user.email, subject: copy.emailSubject(company.name), html, text });
      }

      if (copy.wantsPush(user) && user.fcmTokens?.length) {
        pushTokens.push(...user.fcmTokens);
      }
    }

    await sendPushToTokens(pushTokens, { title: company.name, body: message, link: item.link });
    console.log(`Created ${subscribersById.size} in-app notifications.`);

  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

// Push-only half of sendNotificationToUser below — for callers that already
// write the in-app notification row themselves (e.g. inside a transaction
// alongside other updates) and just need the push sent afterwards.
export async function sendPushForUser(userId: string, notification: { message: string; link: string }) {
  try {
    const tokens = (await prisma.fcmToken.findMany({ where: { userId }, select: { token: true } })).map(t => t.token);
    if (tokens.length) {
      await sendPushToTokens(tokens, { title: 'Oltinde', body: notification.message, link: notification.link });
    }
  } catch (error) {
    console.error('Error sending push to user:', error);
  }
  await sendAccountEmail(userId, notification);
}

// The email copy of an account notice (order, booking, claim, approval,
// reply…). On by default; the user can turn it off in their profile
// (notificationSettings.email.account === false).
async function sendAccountEmail(userId: string, notification: { message: string; link: string }) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, displayName: true, notificationSettings: true } });
    if (!user?.email) return;
    const settings = user.notificationSettings as { email?: { account?: boolean } } | null;
    if (settings?.email?.account === false) return;
    const subject = notification.message.length > 90 ? `${notification.message.slice(0, 87)}…` : notification.message;
    const { html, text } = renderEmail({
      title: 'Tiene un aviso en Oltinde',
      paragraphs: [user.displayName ? `Hola, ${user.displayName}:` : 'Hola:', notification.message],
      cta: { label: 'Ver en Oltinde', link: notification.link || '/notifications' },
    });
    await sendEmail({ to: user.email, subject, html, text });
  } catch (error) {
    console.error('Error sending account email:', error);
  }
}

// Single-recipient counterpart to createNotificationsForSubscribers, for the
// direct/transactional notifications (review replies, verification,
// claim approvals, order status changes) that aren't tied to a
// subscription and don't have a per-category opt-out — if the user has
// enabled push at all (has a saved token), they get it.
export async function sendNotificationToUser(userId: string, notification: { message: string; link: string }) {
  try {
    await prisma.notification.create({
      data: { userId, message: notification.message, link: notification.link },
    });
    await sendPushForUser(userId, notification);
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}

// Admin → Ajustes: checks the SMTP settings by sending a test email to the
// admin's own address.
export async function sendTestEmail(): Promise<{ success: boolean; message: string }> {
  const { getCurrentCaller, isManagerRole } = await import('./firebase-admin');
  const caller = await getCurrentCaller();
  if (!caller || !isManagerRole(caller.role)) return { success: false, message: 'No tiene permiso.' };
  const { isEmailConfigured } = await import('./email');
  if (!isEmailConfigured()) {
    return { success: false, message: 'El correo no está configurado: faltan SMTP_HOST, SMTP_USER o SMTP_PASS en el servidor.' };
  }
  const user = await prisma.user.findUnique({ where: { id: caller.uid }, select: { email: true } });
  if (!user?.email) return { success: false, message: 'Su cuenta no tiene email.' };
  const { html, text } = renderEmail({
    title: 'Correo de prueba',
    paragraphs: ['Si está leyendo esto, Oltinde ya puede enviar correos por SMTP.'],
    cta: { label: 'Abrir Oltinde', link: '/' },
    footer: 'Correo de prueba enviado desde Admin → Ajustes.',
  });
  const ok = await sendEmail({ to: user.email, subject: 'Oltinde: correo de prueba', html, text });
  return ok
    ? { success: true, message: `Enviado a ${user.email}. Revise también la carpeta de spam.` }
    : { success: false, message: 'El servidor SMTP rechazó el envío. Revise los datos SMTP y el registro del servidor.' };
}
