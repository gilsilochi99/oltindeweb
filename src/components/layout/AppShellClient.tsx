
'use client';

import type React from 'react';
import Breadcrumbs from '../shared/Breadcrumbs';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export default function AppShellClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  return (
    <div className={cn(!isHomePage && "container mx-auto py-4 px-4 md:py-10 md:px-8")}>
      {!isHomePage && <Breadcrumbs />}
      {children}
    </div>
  );
}
