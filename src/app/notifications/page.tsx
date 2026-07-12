
'use client';

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, BellOff, Bell } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export default function NotificationsPage() {
  const { notifications, isLoading, markAllAsRead } = useNotifications();

  // Mark all as read when the page is viewed
  useEffect(() => {
    if (notifications.some(n => !n.isRead)) {
      markAllAsRead();
    }
  }, [notifications, markAllAsRead]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Notificaciones</CardTitle>
          <CardDescription>Aquí están todas sus actualizaciones y alertas.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-16 px-4 rounded-lg border-2 border-dashed">
                <BellOff className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-muted-foreground">No tiene notificaciones</h3>
                <p className="text-muted-foreground mt-2">
                    Suscríbase a empresas o categorías para recibir actualizaciones.
                </p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map(notif => (
                <Link key={notif.id} href={notif.link} className="block">
                  <div
                    className={cn(
                      'p-4 rounded-lg border flex items-start gap-4 transition-colors hover:bg-muted/50',
                      !notif.isRead && 'bg-primary/5 border-primary/20'
                    )}
                  >
                    <div className="flex-shrink-0 pt-1">
                        <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            notif.isRead ? 'bg-muted' : 'bg-primary/20'
                        )}>
                           <Bell className={cn('w-4 h-4', notif.isRead ? 'text-muted-foreground' : 'text-primary')} />
                        </div>
                    </div>
                    <div className="flex-grow">
                        <p className="font-medium text-sm">{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleString('es-ES', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                            })}
                        </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2.5 h-2.5 rounded-full bg-primary flex-shrink-0 mt-2" title="No leído"></div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
