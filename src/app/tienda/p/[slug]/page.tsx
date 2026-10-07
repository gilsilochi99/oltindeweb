import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { BadgeCheck, Eye, MapPin, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { JsonLd } from '@/components/shared/JsonLd';
import { getCompanyById } from '@/lib/data';
import { getActiveCategories, getProductBySlug, getRelatedProducts } from '@/lib/shop/storefront';
import { isVariantPurchasable, type Product } from '@/lib/shop/types';
import { ProductDetailClient } from '@/components/shop/ProductDetailClient';
import { ProductRail } from '@/components/shop/ProductCard';
import { categoryTrail, ShopBreadcrumbs } from '@/components/shop/ShopChrome';
import { ProductQuestions, ProductReviews } from '@/components/shop/ProductEngagement';
import { getProductQuestions, getProductReviews } from '@/lib/shop/engagement';

const SITE_URL = 'https://oltinde.com';

type Props = { params: Promise<{ slug: string }> };

function absolute(url: string) {
  return url.startsWith('http') ? url : `${SITE_URL}${url}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await getProductBySlug(slug);
  if (!found) return { title: 'Producto no encontrado' };
  const { product, isPreview } = found;
  const description = (product.shortDescription || product.description).slice(0, 160);
  return {
    title: `${product.title} — ${product.companyName}`,
    description,
    alternates: { canonical: `/tienda/p/${product.slug}` },
    robots: isPreview ? { index: false, follow: false } : undefined,
    openGraph: {
      title: product.title,
      description,
      images: product.images.slice(0, 4).map(i => absolute(i.url)),
    },
  };
}

function productSchema(product: Product) {
  const active = product.variants.filter(v => v.isActive);
  const availability = active.some(isVariantPurchasable) ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';
  const seller = { '@type': 'Organization', name: product.companyName, url: `${SITE_URL}/companies/${product.companyId}` };
  const conditionMap = { new: 'NewCondition', used: 'UsedCondition', refurbished: 'RefurbishedCondition' } as const;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.shortDescription || product.description,
    image: product.images.map(i => absolute(i.url)),
    sku: active[0]?.sku,
    ...(product.brand ? { brand: { '@type': 'Brand', name: product.brand } } : {}),
    itemCondition: `https://schema.org/${conditionMap[product.condition]}`,
    offers: product.minPrice === product.maxPrice
      ? { '@type': 'Offer', price: product.minPrice, priceCurrency: 'XAF', availability, seller, url: `${SITE_URL}/tienda/p/${product.slug}` }
      : { '@type': 'AggregateOffer', lowPrice: product.minPrice, highPrice: product.maxPrice, offerCount: active.length, priceCurrency: 'XAF', availability, seller },
    ...(product.ratingCount > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.ratingAvg, reviewCount: product.ratingCount } } : {}),
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const found = await getProductBySlug(slug);
  if (!found) notFound();
  const { product, isPreview } = found;

  const [company, categories, { related, fromSeller }, reviews, questions] = await Promise.all([
    getCompanyById(product.companyId),
    getActiveCategories(),
    getRelatedProducts(product.id, product.categoryId ?? null, product.companyId),
    getProductReviews(product.id),
    getProductQuestions(product.id),
  ]);
  const trail = categoryTrail(categories, product.categoryId);
  const branch = company?.branches?.[0];

  return (
    <div className="space-y-10">
      {!isPreview && <JsonLd data={productSchema(product)} />}
      <div>
        <ShopBreadcrumbs items={[...trail.map(c => ({ label: c.name, href: `/tienda/c/${c.slug}` })), { label: product.title, href: `/tienda/p/${product.slug}` }]} />
        {isPreview && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Eye className="w-4 h-4" /> Vista previa — este producto no está publicado y solo usted puede verlo.</span>
            <Link href={`/dashboard/companies/${product.companyId}/shop/${product.id}`} className="font-semibold underline">Editar producto</Link>
          </div>
        )}
        <ProductDetailClient
          product={product}
          isPreview={isPreview}
          seller={{
            name: product.companyName,
            whatsapp: company?.contact.socialMedia?.whatsapp || branch?.contact.phone || undefined,
            phone: branch?.contact.phone || undefined,
          }}
        />
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8 items-start">
        <div className="space-y-8 min-w-0">
          {product.description && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Descripción</h2>
              <p className="whitespace-pre-line text-on-background leading-relaxed">{product.description}</p>
            </section>
          )}
          {product.specs.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xl font-bold">Características</h2>
              <table className="w-full text-sm border border-outline-variant rounded-lg overflow-hidden">
                <tbody>
                  {product.specs.map((s, i) => (
                    <tr key={i} className="even:bg-muted/50">
                      <th scope="row" className="text-left font-medium p-3 w-1/3 align-top">{s.name}</th>
                      <td className="p-3">{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
          {!isPreview && <ProductReviews productId={product.id} data={reviews} />}
          {!isPreview && <ProductQuestions productId={product.id} questions={questions} />}
        </div>

        <aside className="rounded-lg border border-outline-variant bg-card p-5 space-y-4 lg:sticky lg:top-20">
          <h2 className="font-bold">Vendido por</h2>
          <div className="flex items-center gap-3">
            <div className="relative w-14 h-14 rounded-md border bg-white overflow-hidden shrink-0 flex items-center justify-center">
              {company?.logo ? <Image src={company.logo} alt={product.companyName} fill sizes="56px" className="object-contain p-1" /> : <Store className="w-6 h-6 text-muted-foreground" />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold flex items-center gap-1.5">
                <span className="truncate">{product.companyName}</span>
                {company?.isVerified && <BadgeCheck className="w-4 h-4 text-blue-600 shrink-0" aria-label="Empresa verificada" />}
              </p>
              {branch?.location.city && <p className="text-sm text-on-surface-variant flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{branch.location.city}</p>}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="outline" asChild><Link href={`/tienda/vendedor/${product.companyId}`}>Ver todos sus productos</Link></Button>
            <Button variant="ghost" asChild><Link href={`/companies/${product.companyId}`}>Perfil de la empresa</Link></Button>
          </div>
        </aside>
      </div>

      <ProductRail title={`Más de ${product.companyName}`} href={`/tienda/vendedor/${product.companyId}`} products={fromSeller} />
      <ProductRail title="Productos relacionados" href={trail.length ? `/tienda/c/${trail[trail.length - 1].slug}` : undefined} products={related} />
    </div>
  );
}
