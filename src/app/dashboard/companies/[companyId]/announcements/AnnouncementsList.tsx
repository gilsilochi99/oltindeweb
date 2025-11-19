'use client';

import { deleteAnnouncement } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Announcement } from '@/lib/types';
import Image from 'next/image';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2 } from 'lucide-react';

interface AnnouncementsListProps {
  companyId: string;
  announcements: Announcement[];
  onAnnouncementDeleted: (announcementId: string) => void;
}

export default function AnnouncementsList({ companyId, announcements, onAnnouncementDeleted }: AnnouncementsListProps) {
  const { toast } = useToast();

  const handleDelete = async (announcementId: string) => {
    const result = await deleteAnnouncement(companyId, announcementId);
    if (result.success) {
      onAnnouncementDeleted(announcementId);
      toast({ title: 'Anuncio eliminado', description: 'El anuncio ha sido eliminado con éxito.' });
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }
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
              <div key={announcement.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-4">
                  {announcement.image && <Image src={announcement.image} alt={announcement.title} width={60} height={60} className="rounded-md" />}
                  <div>
                    <p className="font-semibold">{announcement.title}</p>
                    <p className="text-sm text-muted-foreground">{announcement.content}</p>
                  </div>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                      <AlertDialogHeader>
                          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                          <AlertDialogDescription>
                              Esta acción eliminará permanentemente el anuncio. No se puede deshacer.
                          </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(announcement.id)}>Eliminar</AlertDialogAction>
                      </AlertDialogFooter>
                  </AlertDialogContent>
              </AlertDialog>
              </div>
            ))
          ) : (
            <p className="text-center py-8 text-muted-foreground">No hay anuncios publicados.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
