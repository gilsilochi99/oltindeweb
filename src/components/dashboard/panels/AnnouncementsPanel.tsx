
'use client';

import React, { useState, useEffect } from 'react';
import ManagementPanel from '@/components/dashboard/ManagementPanel';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Announcement } from '@/lib/types';
import { useRouter } from 'next/navigation';

export default function AnnouncementsPanel() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const querySnapshot = await getDocs(collection(db, 'announcements'));
      const announcementsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Announcement));
      setAnnouncements(announcementsData);
    };

    fetchAnnouncements();
  }, []);

  const handleAddItem = () => {
    // Redirect to a new announcement form
    router.push('/dashboard/announcements/new');
  };

  const handleEditItem = (item: Announcement) => {
    router.push(`/dashboard/announcements/${item.id}/edit`);
  };

  const handleDeleteItem = async (item: Announcement) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      await deleteDoc(doc(db, 'announcements', item.id));
      setAnnouncements(announcements.filter(a => a.id !== item.id));
    }
  };

  const columns = [
    { header: 'Title', accessor: (item: Announcement) => item.title },
    { header: 'Company', accessor: (item: Announcement) => item.companyName },
    { header: 'Date', accessor: (item: Announcement) => new Date(item.createdAt).toLocaleDateString() },
  ];

  return (
    <ManagementPanel
      title="Manage Announcements"
      data={announcements}
      columns={columns}
      onAddItem={handleAddItem}
      onEditItem={handleEditItem}
      onDeleteItem={handleDeleteItem}
    />
  );
}
