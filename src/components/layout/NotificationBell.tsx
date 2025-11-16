
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Bell, BellRing } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';

export function NotificationBell() {
  const { notifications, unreadCount, markAllAsRead } = useNotifications();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && unreadCount > 0) {
      // Mark as read when the user opens the dropdown
      markAllAsRead();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
          )}
          <span className="sr-only">Notificaciones</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex justify-between items-center">
          Notificaciones
          {unreadCount > 0 && (
             <span className="text-xs font-normal bg-primary text-primary-foreground rounded-full px-2 py-0.5">{unreadCount} nuevo</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-[300px]">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4 text-center">No tiene notificaciones.</p>
          ) : (
            notifications.map(notif => (
              <DropdownMenuItem key={notif.id} asChild className={cn(!notif.isRead && 'bg-blue-50/50 dark:bg-blue-900/20')}>
                <Link href={notif.link} className="flex items-start gap-2 whitespace-normal">
                   <div className="flex-shrink-0 pt-1">
                        <div className={cn(
                            'w-2 h-2 rounded-full',
                            !notif.isRead ? 'bg-primary' : 'bg-muted-foreground/30'
                        )}></div>
                    </div>
                  <div className="flex-grow">
                    <p className="text-sm">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            ))
          )}
        </ScrollArea>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="justify-center">
            Ver todas las notificaciones
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
