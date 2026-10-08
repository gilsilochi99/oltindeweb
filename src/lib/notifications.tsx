
'use server';

import { prisma, userInclude, toUser } from './db';
import type { AppUser } from './types';
import { Resend } from 'resend';
import React from 'react';
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

// Email Templates
const AnnouncementEmail = ({ companyName, item }: { companyName: string, item: { title: string, link: string } }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h2 style={{ color: '#000' }}>Nuevo Anuncio de {companyName}</h2>
    <p>Se ha publicado un nuevo anuncio que podrías interesarte:</p>
    <h3>{item.title}</h3>
    <a href={item.link} style={{ padding: '10px 15px', backgroundColor: '#FF7A00', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Leer Anuncio Completo</a>
    <p style={{ fontSize: '12px', color: '#777', marginTop: '20px' }}>
      Recibes este correo porque estás suscrito a {companyName} o a su categoría.
    </p>
  </div>
);

const OfferEmail = ({ companyName, item }: { companyName: string, item: { title: string, link: string } }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h2 style={{ color: '#000' }}>¡Nueva Oferta de {companyName}!</h2>
    <p>Se ha publicado una nueva oferta que podría interesarte:</p>
    <h3>{item.title}</h3>
    <a href={item.link} style={{ padding: '10px 15px', backgroundColor: '#FF7A00', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Ver Oferta</a>
    <p style={{ fontSize: '12px', color: '#777', marginTop: '20px' }}>
      Recibes este correo porque estás suscrito a {companyName} o a su categoría.
    </p>
  </div>
);

const JobEmail = ({ companyName, item }: { companyName: string, item: { title: string, link: string } }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h2 style={{ color: '#000' }}>Nueva Oferta de Empleo de {companyName}</h2>
    <p>Se ha publicado una nueva oferta de empleo que podría interesarte:</p>
    <h3>{item.title}</h3>
    <a href={item.link} style={{ padding: '10px 15px', backgroundColor: '#FF7A00', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Ver Empleo</a>
    <p style={{ fontSize: '12px', color: '#777', marginTop: '20px' }}>
      Recibes este correo porque estás suscrito a {companyName} o a su categoría.
    </p>
  </div>
);

const EventEmail = ({ companyName, item }: { companyName: string, item: { title: string, link: string } }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h2 style={{ color: '#000' }}>Nuevo Evento de {companyName}</h2>
    <p>Se ha publicado un nuevo evento que podría interesarte:</p>
    <h3>{item.title}</h3>
    <a href={item.link} style={{ padding: '10px 15px', backgroundColor: '#FF7A00', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>Ver Evento</a>
    <p style={{ fontSize: '12px', color: '#777', marginTop: '20px' }}>
      Recibes este correo porque estás suscrito a {companyName} o a su categoría.
    </p>
  </div>
);

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
  EmailTemplate: (props: { companyName: string; item: { title: string; link: string } }) => React.ReactElement;
  wantsEmail: (user: AppUser) => boolean;
  wantsPush: (user: AppUser) => boolean;
}> = {
  offer: {
    message: (companyName, title) => `Nueva oferta de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nueva Oferta de ${companyName}`,
    EmailTemplate: OfferEmail,
    wantsEmail: (user) => !!user.notificationSettings?.email?.newOffers,
    wantsPush: (user) => !!user.notificationSettings?.push?.newOffers,
  },
  announcement: {
    message: (companyName, title) => `Nuevo anuncio de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nuevo Anuncio de ${companyName}`,
    EmailTemplate: AnnouncementEmail,
    wantsEmail: (user) => !!user.notificationSettings?.email?.newAnnouncements,
    wantsPush: (user) => !!user.notificationSettings?.push?.newAnnouncements,
  },
  job: {
    message: (companyName, title) => `Nueva oferta de empleo de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nueva Oferta de Empleo de ${companyName}`,
    EmailTemplate: JobEmail,
    wantsEmail: (user) => !!user.notificationSettings?.email?.newJobs,
    wantsPush: (user) => !!user.notificationSettings?.push?.newJobs,
  },
  event: {
    message: (companyName, title) => `Nuevo evento de ${companyName}: "${title}"`,
    emailSubject: (companyName) => `Nuevo Evento de ${companyName}`,
    EmailTemplate: EventEmail,
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
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    const fromEmail = process.env.FROM_EMAIL || 'Oltinde <noreply@oltinde.com>';
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
      if (resend && user.email && copy.wantsEmail(user)) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: copy.emailSubject(company.name),
            react: <copy.EmailTemplate companyName={company.name} item={item} />,
          });
        } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
        }
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
