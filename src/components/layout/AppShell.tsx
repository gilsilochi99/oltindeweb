
'use client';

import type React from 'react';
import Breadcrumbs from '../shared/Breadcrumbs';
import { usePathname } from 'next/navigation';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  
  return (
    <main className="flex-1 bg-background">
      <div className={!isHomePage ? "container mx-auto py-4 px-4 md:py-10 md:px-8" : ""}>
        {!isHomePage && <Breadcrumbs />}
        {children}
      </div>
    </main>
  );
}
