'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Plus, User, ShoppingBag } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePublishSheet } from './PublishSheet';
import { cn } from '@/lib/utils';

// Same tabs as the app (mobile/app/(tabs)/_layout.tsx): Inicio, Buscar, +,
// Tienda, Cuenta. Notifications are the bell in the header; favourites live
// in the header menu and the panel.
// Hidden on forms and checkout so it never covers their buttons.
const HIDE_ON = /\/(new|edit|editar|checkout|suggest)(\/|$)|^\/dashboard\/(add-company|add-business|professional)/;

export default function MobileTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const { open } = usePublishSheet();

  if (HIDE_ON.test(pathname)) return null;

  const tabs = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/search', label: 'Buscar', icon: Search },
    null,
    { href: '/tienda', label: 'Tienda', icon: ShoppingBag },
    { href: user ? '/dashboard' : '/signin', label: 'Cuenta', icon: User, also: ['/profile', '/signin', '/signup'] },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-stretch justify-around h-14">
        {tabs.map(tab => {
          if (!tab) {
            return (
              <button key="publish" type="button" onClick={open} aria-label="Publicar algo nuevo" className="flex flex-1 items-center justify-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md ring-4 ring-background -mt-4">
                  <Plus className="w-6 h-6" strokeWidth={2.5} />
                </span>
              </button>
            );
          }
          const { href, label, icon: Icon, also = [] } = tab;
          const isActive = href === '/' ? pathname === '/' : [href, ...also].some(p => pathname.startsWith(p));
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
