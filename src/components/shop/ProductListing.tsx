import Link from 'next/link';
import { ChevronLeft, ChevronRight, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { hrefWith } from '@/lib/shop/query-params';
import type { ProductCategory, ProductQuery, ProductSearchResult } from '@/lib/shop/types';
import { PRODUCTS_PER_PAGE } from '@/lib/shop/storefront';
import { ProductGrid } from './ProductCard';
import { ShopFilters, ShopSortSelect } from './ShopFilters';

interface ProductListingProps {
  basePath: string;
  query: ProductQuery;
  result: ProductSearchResult;
  categories: ProductCategory[];
  currentCategoryId?: string;
  cities: string[];
  showCategories?: boolean;
}

function Pagination({ basePath, query, page, pageCount }: { basePath: string; query: ProductQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const pages = Array.from(new Set([1, page - 1, page, page + 1, pageCount])).filter(p => p >= 1 && p <= pageCount).sort((a, b) => a - b);
  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1 pt-6">
      <Button variant="outline" size="icon" asChild disabled={page <= 1}>
        <Link href={hrefWith(basePath, { ...query, page: page - 1 })} aria-label="Página anterior" className={page <= 1 ? 'pointer-events-none opacity-50' : ''}><ChevronLeft className="w-4 h-4" /></Link>
      </Button>
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1">
          {i > 0 && p - pages[i - 1] > 1 && <span className="px-1 text-muted-foreground">…</span>}
          <Button variant={p === page ? 'default' : 'outline'} size="icon" asChild>
            <Link href={hrefWith(basePath, { ...query, page: p })} aria-current={p === page ? 'page' : undefined}>{p}</Link>
          </Button>
        </span>
      ))}
      <Button variant="outline" size="icon" asChild>
        <Link href={hrefWith(basePath, { ...query, page: page + 1 })} aria-label="Página siguiente" className={page >= pageCount ? 'pointer-events-none opacity-50' : ''}><ChevronRight className="w-4 h-4" /></Link>
      </Button>
    </nav>
  );
}

export function ProductListing({ basePath, query, result, categories, currentCategoryId, cities, showCategories }: ProductListingProps) {
  const start = (result.page - 1) * PRODUCTS_PER_PAGE + 1;
  return (
    <div className="flex flex-col md:flex-row gap-6">
      <aside className="md:w-60 shrink-0">
        <ShopFilters
          basePath={basePath}
          query={query}
          facets={result.facets}
          categories={categories}
          currentCategoryId={currentCategoryId}
          cities={cities}
          showCategories={showCategories}
        />
      </aside>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-outline-variant pb-3">
          <span className="text-sm text-on-surface-variant">
            {result.total > 0
              ? `${start}-${Math.min(start + result.items.length - 1, result.total)} de ${result.total} productos`
              : 'Sin resultados'}
          </span>
          <ShopSortSelect basePath={basePath} query={query} />
        </div>
        {result.items.length > 0 ? (
          <>
            <ProductGrid products={result.items} />
            <Pagination basePath={basePath} query={query} page={result.page} pageCount={result.pageCount} />
          </>
        ) : (
          <div className="text-center py-16 space-y-3">
            <PackageSearch className="w-12 h-12 mx-auto text-muted-foreground" />
            <p className="font-semibold">No encontramos productos</p>
            <p className="text-sm text-muted-foreground">Pruebe con otras palabras o quite algunos filtros.</p>
            <Button variant="outline" asChild><Link href="/tienda">Volver a la tienda</Link></Button>
          </div>
        )}
      </div>
    </div>
  );
}
