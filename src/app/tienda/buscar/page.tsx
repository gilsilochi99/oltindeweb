import type { Metadata } from 'next';
import { getUniqueCities } from '@/lib/data';
import { getActiveCategories, searchProducts } from '@/lib/shop/storefront';
import { parseProductQuery, type RawSearchParams } from '@/lib/shop/query-params';
import { ProductListing } from '@/components/shop/ProductListing';
import { ShopBreadcrumbs, ShopSearchBar } from '@/components/shop/ShopChrome';

type Props = { searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = parseProductQuery(await searchParams);
  return {
    title: q ? `"${q}" — Tienda` : 'Todos los productos — Tienda',
    // Filtered/search result pages shouldn't compete with category pages in search engines.
    robots: { index: false, follow: true },
  };
}

export default async function ShopSearchPage({ searchParams }: Props) {
  const query = parseProductQuery(await searchParams);
  const [result, categories, cities] = await Promise.all([searchProducts(query), getActiveCategories(), getUniqueCities()]);

  return (
    <div>
      <ShopBreadcrumbs items={[{ label: query.q ? `Resultados para "${query.q}"` : 'Todos los productos', href: '/tienda/buscar' }]} />
      <div className="mb-6 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold">{query.q ? `Resultados para "${query.q}"` : 'Todos los productos'}</h1>
        <div className="max-w-2xl"><ShopSearchBar defaultValue={query.q} /></div>
      </div>
      <ProductListing basePath="/tienda/buscar" query={query} result={result} categories={categories} cities={cities} />
    </div>
  );
}
