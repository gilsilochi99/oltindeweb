'use client';

import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export type DetailAccordionSection = { id: string; title: string; content: ReactNode };

// Mobile-only: secondary detail-page sections (Galería, Novedades,
// Documentos, etc.) are collapsed into tap-to-expand rows instead of a wall
// of always-expanded InfoCards — a page like a restaurant's company profile
// can have 5+ of these stacked back to back, which is a lot of scrolling
// before reaching Reviews. "Más Información" (and any section deep-linked
// from elsewhere, like Menú via /companies/[id]#menu from the Food page)
// stays a plain always-open InfoCard and is never passed in here. Desktop
// keeps every section expanded as InfoCards, unchanged — see the sibling
// `hidden md:block` rendering wherever this component is used.
//
// Each AccordionItem carries `id={section.id}` and `scroll-mt-24` (clears
// the sticky Header) so DetailSectionNav can jump straight to it — Radix
// unmounts AccordionContent while closed, but the Item itself stays
// mounted, so it's always a valid scroll target regardless of open state.
export function DetailAccordion({ sections, defaultOpen }: { sections: DetailAccordionSection[]; defaultOpen?: string[] }) {
  if (sections.length === 0) return null;

  return (
    <div className="md:hidden bg-card border border-stitch-outline-variant rounded-sm shadow-sm px-6">
      <Accordion type="multiple" defaultValue={defaultOpen}>
        {sections.map((section) => (
          <AccordionItem key={section.id} value={section.id} id={section.id} className="border-b scroll-mt-24 last:border-0">
            <AccordionTrigger className="text-base font-bold text-stitch-on-background hover:no-underline">
              {section.title}
            </AccordionTrigger>
            <AccordionContent>{section.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
