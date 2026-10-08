import Link from 'next/link';
import type { RentalLandingCombo } from '@/lib/rentals/public';
import { rentalHref } from '@/lib/rentals/query-params';
import { rentalSearchName } from '@/lib/rentals/seo';
import type { RentalCategory } from '@/lib/rentals/types';

type LinkItem = { label: string; href: string; count: number };

// "Búsquedas populares": links named the way people search ("Alquiler de
// coches en Malabo", "Pisos y apartamentos en alquiler en Bata"), built only
// from combinations that have listings, so no link leads to an empty page.
function linksFor(category: RentalCategory, combos: RentalLandingCombo[]): LinkItem[] {
  const own = combos.filter(c => c.category === category);
  const sum = (rows: RentalLandingCombo[]) => rows.reduce((s, r) => s + r.count, 0);
  const byKind = new Map<string, RentalLandingCombo[]>();
  const byCity = new Map<string, RentalLandingCombo[]>();
  for (const c of own) {
    byKind.set(c.kind, [...(byKind.get(c.kind) ?? []), c]);
    byCity.set(c.city, [...(byCity.get(c.city) ?? []), c]);
  }
  const items: LinkItem[] = [
    ...own.map(c => ({ label: rentalSearchName(category, c.kind, c.city), href: rentalHref({ category, kinds: [c.kind], city: c.city }), count: c.count })),
    ...[...byKind].map(([kind, rows]) => ({ label: rentalSearchName(category, kind), href: rentalHref({ category, kinds: [kind] }), count: sum(rows) })),
    ...[...byCity].map(([city, rows]) => ({ label: rentalSearchName(category, undefined, city), href: rentalHref({ category, city }), count: sum(rows) })),
  ];
  return items.sort((a, b) => b.count - a.count).slice(0, 16);
}

export function PopularRentalSearches({ combos }: { combos: RentalLandingCombo[] }) {
  const groups = [
    { title: 'Inmuebles', links: linksFor('property', combos) },
    { title: 'Vehículos', links: linksFor('vehicle', combos) },
  ].filter(g => g.links.length > 0);
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby="popular-rentals" className="space-y-4">
      <h2 id="popular-rentals" className="text-xl font-bold">Búsquedas populares</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {groups.map(g => (
          <div key={g.title}>
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">{g.title}</h3>
            <ul className="flex flex-wrap gap-2">
              {g.links.map(l => (
                <li key={l.href}>
                  <Link href={l.href} className="inline-block rounded-full border bg-card px-3 py-1.5 text-sm hover:bg-primary hover:border-primary transition-colors">
                    {l.label} <span className="text-muted-foreground">({l.count})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
