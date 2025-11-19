'use client';

import { useState, useTransition } from 'react';
import { deleteAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Announcement } from '@/lib/types';
import Image from 'next/image';

interface AnnouncementsListProps {
  companyId: string;
  initialAnnouncements: Announcement[];
}

export default function AnnouncementsList({ companyId, initialAnnouncements }: AnnouncementsListProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [announcements, setAnnouncements] = useState<Announcement[]>(initialAnnouncements);

  const handleDelete = (announcementId: string) => {
    startTransition(async () => {
      const result = await deleteAnnouncement(companyId, announcementId);
      if (result.success) {
        setAnnouncements(announcements.filter(announcement => announcement.id !== announcementId));
        toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido eliminado con éxito.' });
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Anuncios Actuales</CardTitle>
        <CardDescription>Lista de todos los anuncios publicados.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {announcements.length > 0 ? (
            announcements.map(announcement => (
              <div key={announcement.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  {announcement.image && <Image src={announcement.image} alt={announcement.title} width={60} height={60} className="rounded-md" />}
                  <div>
                    <p className="font-semibold">{announcement.title}</p>
                    <p className="text-sm text-gray-500">{announcement.content}</p>
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(announcement.id)}
                  disabled={isPending}
                >
                  {isPending ? 'Eliminando...' : 'Eliminar'}
                </Button>
              </div>
            ))
          ) : (
            <p>No hay anuncios publicados.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
