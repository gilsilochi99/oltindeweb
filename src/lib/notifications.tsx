
'use server';

import { db } from './firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import type { AppUser, Company, Offer, Announcement } from './types';
import { Resend } from 'resend';
import React from 'react';

// Email Templates
const AnnouncementEmail = ({ companyName, item }: { companyName: string, item: { title: string, link: string } }) => (
  <div style={{ fontFamily: 'sans-serif', color: '#333' }}>
    <h2 style={{ color: '#000' }}>Nuevo Anuncio de {companyName}</h2>
    <p>Se ha publicado un nuevo anuncio que podría interesarte:</p>
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


type NotificationType = 'offer' | 'announcement';

export async function createNotificationsForSubscribers(
  company: Company,
  item: { title: string; link: string },
  type: NotificationType
) {
  try {
    const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
    const fromEmail = process.env.FROM_EMAIL || 'Oltinde <no-reply@your-domain.com>';

    const usersSnapshot = await getDocs(collection(db, 'users'));
    const allUsers: AppUser[] = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AppUser));

    const subscriberIds = new Set<string>();

    allUsers.forEach(user => {
      // User is subscribed directly to the company
      if (user.subscriptions?.companies?.includes(company.id)) {
        subscriberIds.add(user.id);
      }
      // User is subscribed to the company's category
      if (user.subscriptions?.categories?.includes(company.category)) {
        subscriberIds.add(user.id);
      }
    });

    if (subscriberIds.size === 0) {
      console.log('No subscribers found for this update.');
      return;
    }

    const batch = writeBatch(db);
    const notificationsCol = collection(db, 'notifications');

    let message = '';
    if (type === 'offer') {
      message = `Nueva oferta de ${company.name}: "${item.title}"`;
    } else {
      message = `Nuevo anuncio de ${company.name}: "${item.title}"`;
    }

    for (const userId of subscriberIds) {
      const user = allUsers.find(u => u.id === userId);
      if (!user) continue;

      // Create in-app notification
      const newNotifRef = doc(notificationsCol);
      batch.set(newNotifRef, {
        userId,
        message,
        link: item.link,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
      
      // Check if user wants email notifications for this type
      const wantsEmailForOffers = type === 'offer' && user.notificationSettings?.email?.newOffers;
      const wantsEmailForAnnouncements = type === 'announcement' && user.notificationSettings?.email?.newAnnouncements;

      if (resend && user.email && (wantsEmailForOffers || wantsEmailForAnnouncements)) {
        try {
          await resend.emails.send({
            from: fromEmail,
            to: user.email,
            subject: type === 'offer' 
              ? `Nueva Oferta de ${company.name}` 
              : `Nuevo Anuncio de ${company.name}`,
            react: type === 'offer' 
              ? <OfferEmail companyName={company.name} item={item} />
              : <AnnouncementEmail companyName={company.name} item={item} />,
          });
        } catch (emailError) {
            console.error(`Failed to send email to ${user.email}:`, emailError);
        }
      }
    }

    await batch.commit();
    console.log(`Created ${subscriberIds.size} in-app notifications.`);

  } catch (error) {
    console.error('Error creating notifications:', error);
  }
}
