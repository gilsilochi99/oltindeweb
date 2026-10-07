'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarCheck, KeyRound } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RentalsNav({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/companies/${companyId}/rentals`;
  const links = [
    { href: base, label: 'Anuncios', icon: KeyRound, active: !pathname.startsWith(`${base}/bookings`) },
    { href: `${base}/bookings`, label: 'Reservas', icon: CalendarCheck, active: pathname.startsWith(`${base}/bookings`) },
  ];
  return (
    <nav aria-label="Secciones de alquileres" className="mb-6 border-b">
      <ul className="flex gap-1">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} aria-current={l.active ? 'page' : undefined}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px', l.active ? 'border-primary font-semibold' : 'border-transparent text-muted-foreground hover:text-foreground')}>
              <l.icon className="w-4 h-4" />{l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
