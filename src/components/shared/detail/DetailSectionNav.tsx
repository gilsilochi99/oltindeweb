'use client';

export type DetailNavItem = { id: string; label: string };

// Mobile-only tap-to-jump pill nav under the hero, for detail pages long
// enough to stack several sections (companies can have Info/Menú/Fotos/
// Empleos/Eventos/Documentos/Reseñas). Scrolls the DOM directly rather than
// managing app state, so it stays a thin, independent add-on: no coupling
// to DetailAccordion's internals beyond the id/scroll-mt-24 contract each
// AccordionItem already exposes. If the target is a currently-collapsed
// accordion item (Radix marks it data-state="closed" — the Item itself
// stays mounted even though its Content unmounts), clicking its own
// trigger button opens it before the scroll fires.
export function DetailSectionNav({ items }: { items: DetailNavItem[] }) {
  if (items.length === 0) return null;

  const handleClick = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;

    if (target.getAttribute('data-state') === 'closed') {
      target.querySelector('button')?.click();
    }

    // A plain timeout (not requestAnimationFrame, which browsers fully
    // suspend for backgrounded tabs) gives the just-opened accordion item a
    // moment to mount its content and reflow before we measure/scroll.
    setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80);
  };

  return (
    <div className="md:hidden -mx-4 mb-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      <div className="flex gap-2 px-4 w-max">
        {items.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={handleClick(item.id)}
            className="shrink-0 px-4 py-2 rounded-full border border-stitch-outline-variant text-sm font-semibold text-stitch-on-background whitespace-nowrap active:bg-stitch-surface-container-low transition-colors"
          >
            {item.label}
          </a>
        ))}
      </div>
    </div>
  );
}
