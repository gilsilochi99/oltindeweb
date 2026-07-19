
'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchOverlay } from './search/SearchOverlay';

export function GlobalHeaderSearch({ variant = 'hero' }: { variant?: 'hero' | 'header' }) {
  const [open, setOpen] = useState(false);

  if (variant === 'header') {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center border border-outline-variant rounded overflow-hidden bg-card text-left h-10"
        >
          <div className="flex-1 flex items-center px-3 h-full min-w-0">
            <Search className="w-[18px] h-[18px] text-outline mr-2 shrink-0" />
            <span className="text-sm text-on-surface-variant truncate">¿Qué estás buscando?</span>
          </div>
          <span className="h-full font-bold px-4 lg:px-6 bg-primary-container text-on-primary-container inline-flex items-center shrink-0 text-sm">
            BUSCAR
          </span>
        </button>

        <SearchOverlay open={open} onOpenChange={setOpen} />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center rounded-md border-2 border-outline-variant bg-background overflow-hidden shadow-lg p-1 gap-1 text-left"
      >
        <div className="relative flex-grow min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <span className="block pl-10 pr-8 sm:pr-9 h-12 leading-[3rem] text-sm sm:text-base text-muted-foreground truncate">
            Ej: &quot;empresas de construcción en Bata&quot;
          </span>
        </div>
        <span className="h-12 rounded-md font-bold px-4 sm:px-8 bg-primary-container text-on-primary-container inline-flex items-center shrink-0">
          BUSCAR
        </span>
      </button>

      <SearchOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}
