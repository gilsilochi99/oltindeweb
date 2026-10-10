'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircleQuestion } from 'lucide-react';
import { getAssistantPublicState } from '@/lib/assistant';
import { SearchOverlay } from '@/components/shared/search/SearchOverlay';

// Floating "¿Necesita ayuda?" button on every public page. It opens the same
// Asistente Oltinde as the header search and /search.
export function AssistantWidget() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getAssistantPublicState().then((s) => !cancelled && setEnabled(s.enabled)).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!enabled || pathname?.startsWith('/admin') || pathname?.startsWith('/search')) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] md:bottom-6 z-40 flex items-center gap-2 rounded-full bg-black text-white pl-3.5 pr-4 h-12 shadow-lg hover:bg-black/85 transition-colors"
        aria-label="Abrir el Asistente Oltinde"
      >
        <MessageCircleQuestion className="w-5 h-5 text-primary" />
        <span className="text-sm font-semibold hidden sm:inline">¿Necesita ayuda?</span>
      </button>
      <SearchOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}
