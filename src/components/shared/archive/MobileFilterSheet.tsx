'use client';

import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

// Mobile-only "Filtros" trigger that opens the same filter controls (passed
// as children, unchanged) in a bottom sheet instead of the always-visible
// inline grid desktop uses — native-app filter pattern instead of a
// website settings panel. Desktop rendering of the filter grid is
// untouched; this is purely an additional mobile entry point.
export function MobileFilterSheet({
  activeCount = 0,
  children,
}: {
  activeCount?: number;
  children: ReactNode;
}) {
  return (
    <div className="md:hidden mb-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full justify-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            Filtros
            {activeCount > 0 && (
              <span className="ml-1 flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                {activeCount}
              </span>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="space-y-4">{children}</div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
