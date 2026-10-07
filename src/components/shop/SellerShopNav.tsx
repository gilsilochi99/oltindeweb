'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Inbox, MessageCircleQuestion, Package, Settings, TicketPercent } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SellerShopNav({ companyId }: { companyId: string }) {
  const pathname = usePathname();
  const base = `/dashboard/companies/${companyId}/shop`;
  const links = [
    { href: base, label: 'Productos', icon: Package, exact: true },
    { href: `${base}/orders`, label: 'Pedidos', icon: Inbox },
    { href: `${base}/questions`, label: 'Preguntas', icon: MessageCircleQuestion },
    { href: `${base}/coupons`, label: 'Cupones', icon: TicketPercent },
    { href: `${base}/stats`, label: 'Estadísticas', icon: BarChart3 },
    { href: `${base}/settings`, label: 'Ajustes', icon: Settings },
  ];
  const isActive = (l: (typeof links)[number]) =>
    l.exact ? pathname === l.href || (pathname.startsWith(`${base}/`) && !links.slice(1).some(o => pathname.startsWith(o.href))) : pathname.startsWith(l.href);

  return (
    <nav aria-label="Secciones de la tienda" className="mb-6 -mx-1 overflow-x-auto">
      <ul className="flex gap-1 border-b min-w-max px-1">
        {links.map(l => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={isActive(l) ? 'page' : undefined}
              className={cn('flex items-center gap-1.5 px-3 py-2 text-sm border-b-2 -mb-px transition-colors', isActive(l) ? 'border-primary font-semibold text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              <l.icon className="w-4 h-4" />{l.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
