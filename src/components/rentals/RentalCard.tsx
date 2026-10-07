import Link from 'next/link';
import Image from 'next/image';
import { Fragment } from 'react';
import { BedDouble, Bath, Car, ChevronRight, Home, MapPin, Star, Users } from 'lucide-react';
import { JsonLd } from '@/components/shared/JsonLd';
import { formatXaf } from '@/lib/shop/types';
import { TRANSMISSION_LABELS, kindLabel, unitLabel, type RentalListItem } from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

const SITE_URL = 'https://oltinde.com';

// "45.000 XAF / noche · 600.000 XAF / mes"
export function RentalPrices({ item, size = 'md' }: { item: Pick<RentalListItem, 'category' | 'shortTermEnabled' | 'dailyPrice' | 'longTermEnabled' | 'monthlyPrice'>; size?: 'md' | 'lg' }) {
  const parts: { amount: number; unit: string }[] = [];
  if (item.shortTermEnabled && item.dailyPrice) parts.push({ amount: item.dailyPrice, unit: unitLabel(item.category) });
  if (item.longTermEnabled && item.monthlyPrice) parts.push({ amount: item.monthlyPrice, unit: 'mes' });
  if (parts.length === 0) return <span className="text-sm text-muted-foreground">Consultar precio</span>;
  return (
    <div className={cn('flex flex-wrap items-baseline gap-x-3 gap-y-0.5', size === 'lg' && 'gap-x-5')}>
      {parts.map(p => (
        <span key={p.unit}>
          <span className={cn('font-bold', size === 'lg' ? 'text-2xl' : 'text-base')}>{formatXaf(p.amount)}</span>
          <span className="text-sm text-muted-foreground"> / {p.unit}</span>
        </span>
      ))}
    </div>
  );
}

export function RentalCard({ item, className }: { item: RentalListItem; className?: string }) {
  const isProperty = item.category === 'property';
  return (
    <Link href={`/alquiler/${item.slug}`} className={cn('group flex flex-col rounded-lg border border-outline-variant bg-card overflow-hidden hover:shadow-md transition-shadow', className)}>
      <div className="relative aspect-[4/3] bg-muted">
        {item.image ? (
          <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 320px" className="object-cover group-hover:scale-[1.03] transition-transform" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">{isProperty ? <Home className="w-10 h-10 text-muted-foreground" /> : <Car className="w-10 h-10 text-muted-foreground" />}</div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="rounded bg-white/90 text-black text-[11px] font-semibold px-1.5 py-0.5">{kindLabel(item.category, item.kind)}</span>
          {item.isFeatured && <span className="rounded bg-primary text-primary-foreground text-[11px] font-bold px-1.5 py-0.5">Destacado</span>}
        </div>
      </div>
      <div className="flex flex-col gap-1.5 p-3 flex-1">
        <h3 className="font-semibold leading-snug line-clamp-2 group-hover:underline">{item.title}</h3>
        <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5 shrink-0" />{item.neighborhood ? `${item.neighborhood}, ` : ''}{item.city}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {isProperty ? (
            <>
              {item.bedrooms !== undefined && <span className="flex items-center gap-1"><BedDouble className="w-3.5 h-3.5" />{item.bedrooms} hab.</span>}
              {item.bathrooms !== undefined && <span className="flex items-center gap-1"><Bath className="w-3.5 h-3.5" />{item.bathrooms} baños</span>}
              {item.maxGuests !== undefined && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{item.maxGuests} pers.</span>}
            </>
          ) : (
            <>
              {item.seats !== undefined && <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{item.seats} plazas</span>}
              {item.transmission && <span>{TRANSMISSION_LABELS[item.transmission] ?? item.transmission}</span>}
              {item.driverOption && item.driverOption !== 'none' && <span>Con conductor</span>}
            </>
          )}
          {item.ratingCount > 0 && <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />{item.ratingAvg.toFixed(1)}</span>}
        </div>
        <div className="mt-auto pt-1">
          <RentalPrices item={item} />
          <p className="text-xs text-muted-foreground truncate mt-0.5">{item.companyName}</p>
        </div>
      </div>
    </Link>
  );
}

export function RentalGrid({ items }: { items: RentalListItem[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map(i => <RentalCard key={i.id} item={i} />)}
    </div>
  );
}

export function RentalRail({ title, href, items }: { title: string; href?: string; items: RentalListItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-xl font-bold">{title}</h2>
        {href && <Link href={href} className="text-sm font-medium hover:underline shrink-0">Ver todo</Link>}
      </div>
      <div className="flex gap-4 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {items.map(i => <RentalCard key={i.id} item={i} className="w-64 sm:w-72 shrink-0 snap-start" />)}
      </div>
    </section>
  );
}

export type Crumb = { label: string; href: string };

export function RentalBreadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Inicio', href: '/' }, { label: 'Alquiler', href: '/alquiler' }, ...items];
  return (
    <>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: all.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.label, item: `${SITE_URL}${c.href}` })),
      }} />
      <nav aria-label="Breadcrumb" className="mb-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          {all.map((c, i) => (
            <Fragment key={c.href + i}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
              <li className="min-w-0">
                {i === all.length - 1 ? <span className="text-foreground font-medium line-clamp-1">{c.label}</span> : <Link href={c.href} className="hover:text-black">{c.label}</Link>}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}
