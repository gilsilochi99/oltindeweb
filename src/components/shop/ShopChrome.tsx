import Link from 'next/link';
import { Fragment } from 'react';
import { ChevronRight, Home, Search } from 'lucide-react';
import { JsonLd } from '@/components/shared/JsonLd';
import type { ProductCategory } from '@/lib/shop/types';

const SITE_URL = 'https://oltinde.com';

export type Crumb = { label: string; href: string };

export function ShopBreadcrumbs({ items }: { items: Crumb[] }) {
  const all = [{ label: 'Inicio', href: '/' }, { label: 'Tienda', href: '/tienda' }, ...items];
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
                {i === all.length - 1 ? (
                  <span className="text-foreground font-medium line-clamp-1">{c.label}</span>
                ) : (
                  <Link href={c.href} className="hover:text-black transition-colors">
                    {i === 0 ? <><Home className="h-4 w-4" /><span className="sr-only">Inicio</span></> : c.label}
                  </Link>
                )}
              </li>
            </Fragment>
          ))}
        </ol>
      </nav>
    </>
  );
}

// Root → leaf chain for a category, for breadcrumbs.
export function categoryTrail(categories: ProductCategory[], categoryId: string | undefined): ProductCategory[] {
  const trail: ProductCategory[] = [];
  let current = categories.find(c => c.id === categoryId);
  while (current && trail.length < 10) {
    trail.unshift(current);
    current = categories.find(c => c.id === current!.parentId);
  }
  return trail;
}

// Plain GET form: works without JavaScript and lands on the search page.
export function ShopSearchBar({ defaultValue, categorySlug, autoFocus }: { defaultValue?: string; categorySlug?: string; autoFocus?: boolean }) {
  return (
    <form action={categorySlug ? `/tienda/c/${categorySlug}` : '/tienda/buscar'} method="get" role="search" className="flex w-full">
      <label htmlFor="shop-search" className="sr-only">Buscar productos</label>
      <input
        id="shop-search"
        name="q"
        type="search"
        defaultValue={defaultValue}
        autoFocus={autoFocus}
        placeholder="Buscar productos, marcas..."
        className="flex-1 min-w-0 h-11 rounded-l-md border border-r-0 border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <button type="submit" className="h-11 px-4 sm:px-6 rounded-r-md bg-primary text-primary-foreground font-semibold flex items-center gap-2 hover:opacity-90">
        <Search className="w-4 h-4" /><span className="hidden sm:inline">Buscar</span>
      </button>
    </form>
  );
}
