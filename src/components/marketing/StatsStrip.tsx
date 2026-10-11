import Link from 'next/link';
import { BadgeCheck } from 'lucide-react';
import type { ShowcaseCompany } from '@/lib/public-stats';

// A row of live figures. Tiny ones are dropped (no "0 alquileres" or "1 itinerarios"), and with
// fewer than two figures left the strip isn't shown at all.
export function StatsStrip({ items }: { items: { value: number; label: string; href?: string }[] }) {
  const shown = items.filter(i => i.value >= 3);
  if (shown.length < 2) return null;
  return (
    <section className="container mx-auto px-4 -mt-8 md:-mt-12">
      <div className="max-w-5xl mx-auto grid grid-cols-2 gap-px md:grid-cols-none md:grid-flow-col md:auto-cols-fr overflow-hidden rounded-xl border border-outline-variant bg-outline-variant">
        {shown.map(item => {
          const body = (
            <>
              <p className="text-2xl md:text-3xl font-bold tabular-nums">{item.value.toLocaleString('es-ES')}</p>
              <p className="text-sm text-muted-foreground">{item.label}</p>
            </>
          );
          const cls = 'block bg-card px-5 py-4 max-md:[&:last-child:nth-child(odd)]:col-span-2';
          return item.href
            ? <Link key={item.label} href={item.href} className={`${cls} hover:bg-muted`}>{body}</Link>
            : <div key={item.label} className={cls}>{body}</div>;
        })}
      </div>
    </section>
  );
}

const usableLogo = (src: string | null) => !!src && /^(https?:\/\/|\/)/.test(src) && !src.includes('placehold');

// Real companies already on Oltinde (featured first, then verified).
export function CompanyShowcase({ companies }: { companies: ShowcaseCompany[] }) {
  if (companies.length < 3) return null;
  return (
    <section className="container mx-auto px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-end justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">Ya están en Oltinde</p>
            <h2 className="text-2xl font-bold font-headline normal-case">Empresas que ya le esperan aquí</h2>
          </div>
          <Link href="/companies" className="text-sm font-medium hover:underline shrink-0">Ver todas</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {companies.map(c => (
            <Link key={c.id} href={`/companies/${c.id}`} className="flex items-center gap-3 rounded-lg border border-outline-variant bg-card p-3 hover:shadow-md transition-shadow min-w-0">
              {usableLogo(c.logo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.logo!} alt="" className="w-10 h-10 rounded-full object-cover border shrink-0" loading="lazy" />
              ) : (
                <span className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-bold shrink-0">{c.name.charAt(0).toUpperCase()}</span>
              )}
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold text-sm"><span className="truncate">{c.name}</span>{c.isVerified ? <BadgeCheck className="w-4 h-4 shrink-0" aria-label="Verificada" /> : null}</span>
                <span className="block text-xs text-muted-foreground truncate">{c.category}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
