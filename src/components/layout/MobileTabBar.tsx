'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Star, Bell, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const tabs = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/search', label: 'Buscar', icon: Search },
    { href: '/favorites', label: 'Favoritos', icon: Star },
    { href: '/notifications', label: 'Alertas', icon: Bell, badge: unreadCount > 0 },
    { href: user ? '/profile' : '/signin', label: 'Cuenta', icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around h-14">
        {tabs.map(({ href, label, icon: Icon, badge }) => {
          const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 relative',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span className="relative">
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                {badge && (
                  <span className="absolute -top-1 -right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                  </span>
                )}
              </span>
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
