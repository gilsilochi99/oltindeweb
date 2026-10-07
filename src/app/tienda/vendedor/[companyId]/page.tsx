import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, MapPin, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getCompanyById } from '@/lib/data';
import { getActiveCategories, searchProducts } from '@/lib/shop/storefront';
import { parseProductQuery, type RawSearchParams } from '@/lib/shop/query-params';
import { ProductListing } from '@/components/shop/ProductListing';
import { ShopBreadcrumbs } from '@/components/shop/ShopChrome';
import { RatingStars } from '@/components/shop/ProductCard';

type Props = { params: Promise<{ companyId: string }>; searchParams: Promise<RawSearchParams> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company || company.isActive === false) return { title: 'Tienda no encontrada' };
  return {
    title: `Tienda de ${company.name}`,
    description: `Productos de ${company.name} en Oltinde. Precios en XAF.`,
    alternates: { canonical: `/tienda/vendedor/${company.id}` },
  };
}

export default async function SellerStorePage({ params, searchParams }: Props) {
  const { companyId } = await params;
  const company = await getCompanyById(companyId);
  if (!company || company.isActive === false) notFound();

  const query = parseProductQuery(await searchParams);
  const [result, categories] = await Promise.all([searchProducts({ ...query, companyId }), getActiveCategories()]);
  const city = company.branches?.[0]?.location.city;
  const rating = company.reviews?.length ? company.reviews.reduce((s, r) => s + r.rating, 0) / company.reviews.length : 0;

  return (
    <div>
      <ShopBreadcrumbs items={[{ label: company.name, href: `/tienda/vendedor/${company.id}` }]} />
      <section className="rounded-xl border border-outline-variant bg-card p-5 mb-6 flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative w-20 h-20 rounded-lg border bg-white overflow-hidden shrink-0 flex items-center justify-center">
          {company.logo ? <Image src={company.logo} alt={company.name} fill sizes="80px" className="object-contain p-1" /> : <Store className="w-8 h-8 text-muted-foreground" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            {company.name}
            {company.isVerified && <BadgeCheck className="w-5 h-5 text-blue-600" aria-label="Empresa verificada" />}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
            {city && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{city}</span>}
            <span>{company.category}</span>
            <RatingStars value={rating} count={company.reviews?.length ?? 0} />
          </div>
        </div>
        <Button variant="outline" asChild><Link href={`/companies/${company.id}`}>Ver perfil de la empresa</Link></Button>
      </section>
      <ProductListing
        basePath={`/tienda/vendedor/${company.id}`}
        query={query}
        result={result}
        categories={categories}
        cities={[]}
        showCategories={false}
      />
    </div>
  );
}
