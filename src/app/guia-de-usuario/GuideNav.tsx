'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export type GuideNavGroup = { title: string; items: { id: string; title: string; icon: React.ReactNode }[] };

// Highlights the section currently being read: the last one whose top has
// scrolled past the sticky header.
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const onScroll = () => {
      let current = ids[0];
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 140) current = id;
      }
      // At the very bottom the last (short) sections can never reach the top.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) current = ids[ids.length - 1];
      setActive(current);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [ids]);
  return active;
}

export function GuideSidebar({ groups }: { groups: GuideNavGroup[] }) {
  const active = useActiveSection(groups.flatMap(g => g.items.map(i => i.id)));
  return (
    <nav aria-label="Secciones de la guía" className="space-y-6">
      {groups.map(group => (
        <div key={group.title}>
          <p className="px-3 mb-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">{group.title}</p>
          <ul className="space-y-0.5">
            {group.items.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  aria-current={active === item.id ? 'location' : undefined}
                  className={cn(
                    'flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors [&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0',
                    active === item.id ? 'bg-primary text-primary-foreground font-semibold' : 'text-on-surface-variant hover:bg-muted hover:text-foreground'
                  )}
                >
                  {item.icon}
                  <span className="leading-snug">{item.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// Mobile: a sticky, horizontally scrolling row under the header.
export function GuideChips({ groups }: { groups: GuideNavGroup[] }) {
  const items = groups.flatMap(g => g.items);
  const active = useActiveSection(items.map(i => i.id));
  useEffect(() => {
    document.getElementById(`chip-${active}`)?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [active]);
  return (
    <nav aria-label="Secciones de la guía" className="flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
      {items.map(item => (
        <a
          key={item.id}
          id={`chip-${item.id}`}
          href={`#${item.id}`}
          className={cn(
            'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-sm [&_svg]:w-4 [&_svg]:h-4',
            active === item.id ? 'bg-primary text-primary-foreground border-primary font-semibold' : 'bg-card'
          )}
        >
          {item.icon}
          {item.title}
        </a>
      ))}
    </nav>
  );
}
