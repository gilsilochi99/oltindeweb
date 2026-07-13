
'use client';

import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { SearchOverlay } from './search/SearchOverlay';

export function GlobalHeaderSearch() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center rounded-md border-2 border-[#64748B] bg-background overflow-hidden shadow-lg p-1 gap-1 text-left"
      >
        <div className="relative flex-grow min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <span className="block pl-10 pr-8 sm:pr-9 h-12 leading-[3rem] text-sm sm:text-base text-muted-foreground truncate">
            Ej: &quot;empresas de construcción en Bata&quot;
          </span>
          <Sparkles className="hidden sm:block absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/70 animate-pulse" aria-hidden />
        </div>
        <span className="h-12 rounded-md font-bold px-4 sm:px-8 bg-primary text-primary-foreground inline-flex items-center shrink-0">
          BUSCAR
        </span>
      </button>

      <SearchOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}
