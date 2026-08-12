
'use server';

import { db } from './firebase';
import { collection, getDocs, writeBatch, doc, query, where, setDoc, getDoc } from 'firebase/firestore';
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
      data: { title: payload.title, body: payload.body, link: payload.link },
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

    // Two targeted array-contains queries instead of scanning every user doc
    // to find the handful who are actually subscribed — this used to read the
    // entire users collection on every single offer/announcement/job/event
    // post, regardless of subscriber count.
    const usersCol = collection(db, 'users');
    const [byCompany, byCategory] = await Promise.all([
      getDocs(query(usersCol, where('subscriptions.companies', 'array-contains', company.id))),
      getDocs(query(usersCol, where('subscriptions.categories', 'array-contains', company.category))),
    ]);

    const subscribersById = new Map<string, AppUser>();
    [...byCompany.docs, ...byCategory.docs].forEach(userDoc => {
      subscribersById.set(userDoc.id, { id: userDoc.id, ...userDoc.data() } as AppUser);
    });

    if (subscribersById.size === 0) {
      console.log('No subscribers found for this update.');
      return;
    }

    const batch = writeBatch(db);
    const notificationsCol = collection(db, 'notifications');
    const message = copy.message(company.name, item.title);
    const pushTokens: string[] = [];

    for (const [userId, user] of subscribersById) {
      // Create in-app notification
      const newNotifRef = doc(notificationsCol);
      batch.set(newNotifRef, {
        userId,
        message,
        link: item.link,
        isRead: false,
        createdAt: new Date().toISOString(),
      });

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

    await batch.commit();
    await sendPushToTokens(pushTokens, { title: company.name, body: message, link: item.link });
    console.log(`Created ${subscribersById.size} in-app notifications.`);

  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}

// Push-only half of sendNotificationToUser below — for callers that already
// write the in-app notification doc themselves (e.g. as part of an atomic
// writeBatch alongside other document updates) and just need the push sent
// afterwards, without a second Firestore write.
export async function sendPushForUser(userId: string, notification: { message: string; link: string }) {
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const tokens = userSnap.exists() ? (userSnap.data() as AppUser).fcmTokens : undefined;
    if (tokens?.length) {
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
    const notificationsCol = collection(db, 'notifications');
    await setDoc(doc(notificationsCol), {
      userId,
      message: notification.message,
      link: notification.link,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    await sendPushForUser(userId, notification);
  } catch (error) {
    console.error('Error sending notification to user:', error);
  }
}
