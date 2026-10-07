import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getUniqueCities } from '@/lib/data';
import { getActiveCategories, searchProducts } from '@/lib/shop/storefront';
import { activeFilterCount, parseProductQuery, type RawSearchParams } from '@/lib/shop/query-params';
import { ProductListing } from '@/components/shop/ProductListing';
import { categoryTrail, ShopBreadcrumbs, ShopSearchBar } from '@/components/shop/ShopChrome';

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getActiveCategories()).find(c => c.slug === slug);
  if (!category) return { title: 'Categoría no encontrada' };
  const query = parseProductQuery(await searchParams);
  const isFiltered = !!query.q || activeFilterCount(query) > 0 || (query.page ?? 1) > 1 || !!query.sort;
  return {
    title: `${category.name} — Tienda`,
    description: category.description || `Compre ${category.name.toLowerCase()} a empresas de Guinea Ecuatorial. Precios en XAF.`,
    alternates: { canonical: `/tienda/c/${category.slug}` },
    robots: isFiltered ? { index: false, follow: true } : undefined,
  };
}

export default async function ShopCategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const categories = await getActiveCategories();
  const category = categories.find(c => c.slug === slug);
  if (!category) notFound();

  const query = parseProductQuery(await searchParams);
  const [result, cities] = await Promise.all([searchProducts({ ...query, categorySlug: slug }), getUniqueCities()]);
  const trail = categoryTrail(categories, category.id);
  const children = categories.filter(c => c.parentId === category.id);

  return (
    <div>
      <ShopBreadcrumbs items={trail.map(c => ({ label: c.name, href: `/tienda/c/${c.slug}` }))} />
      <div className="mb-6 space-y-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{category.name}</h1>
          {category.description && <p className="text-on-surface-variant mt-1 max-w-3xl">{category.description}</p>}
        </div>
        <div className="max-w-2xl"><ShopSearchBar defaultValue={query.q} categorySlug={slug} /></div>
        {children.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {children.map(c => (
              <Link key={c.id} href={`/tienda/c/${c.slug}`} className="shrink-0 rounded-full border border-outline-variant px-3 py-1.5 text-sm hover:bg-muted">{c.name}</Link>
            ))}
          </div>
        )}
      </div>
      <ProductListing
        basePath={`/tienda/c/${slug}`}
        query={query}
        result={result}
        categories={categories}
        currentCategoryId={category.id}
        cities={cities}
      />
    </div>
  );
}
