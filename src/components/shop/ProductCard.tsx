import Link from 'next/link';
import Image from 'next/image';
import { Package, Star } from 'lucide-react';
import { discountPercent, formatXaf, PRODUCT_CONDITION_LABELS, type ProductListItem } from '@/lib/shop/types';
import { cn } from '@/lib/utils';

export function PriceTag({ price, maxPrice, compareAtPrice, size = 'md' }: { price: number; maxPrice?: number; compareAtPrice?: number; size?: 'md' | 'lg' }) {
  const discount = discountPercent(price, compareAtPrice);
  const hasRange = maxPrice !== undefined && maxPrice > price;
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className={cn('font-bold text-on-background', size === 'lg' ? 'text-3xl' : 'text-lg')}>
        {hasRange && <span className="text-xs font-normal text-on-surface-variant mr-1">desde</span>}
        {formatXaf(price)}
      </span>
      {discount !== undefined && (
        <>
          <span className={cn('line-through text-on-surface-variant', size === 'lg' ? 'text-base' : 'text-xs')}>{formatXaf(compareAtPrice!)}</span>
          <span className={cn('font-semibold text-red-600', size === 'lg' ? 'text-base' : 'text-xs')}>-{discount}%</span>
        </>
      )}
    </div>
  );
}

export function RatingStars({ value, count, className }: { value: number; count: number; className?: string }) {
  if (count === 0) return null;
  return (
    <div className={cn('flex items-center gap-1 text-xs text-on-surface-variant', className)} aria-label={`${value.toFixed(1)} de 5 estrellas, ${count} valoraciones`}>
      <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
      <span className="font-medium text-on-background">{value.toFixed(1)}</span>
      <span>({count})</span>
    </div>
  );
}

export function ProductCard({ product, className }: { product: ProductListItem; className?: string }) {
  const discount = discountPercent(product.minPrice, product.compareAtPrice);
  return (
    <Link
      href={`/tienda/p/${product.slug}`}
      className={cn('group flex flex-col rounded-lg border border-outline-variant bg-card overflow-hidden hover:shadow-md transition-shadow', className)}
    >
      <div className="relative aspect-square bg-muted">
        {product.image ? (
          <Image src={product.image} alt={product.title} fill sizes="(max-width: 640px) 50vw, 240px" className="object-cover group-hover:scale-[1.03] transition-transform" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center"><Package className="w-10 h-10 text-muted-foreground" /></div>
        )}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
          {discount !== undefined && <span className="rounded bg-red-600 text-white text-xs font-bold px-1.5 py-0.5">-{discount}%</span>}
          {product.condition !== 'new' && <span className="rounded bg-black/70 text-white text-[11px] px-1.5 py-0.5">{PRODUCT_CONDITION_LABELS[product.condition]}</span>}
        </div>
        {!product.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 text-white text-xs font-semibold text-center py-1">Agotado</div>
        )}
      </div>
      <div className="flex flex-col gap-1 p-3 flex-1">
        {product.brand && <span className="text-[11px] uppercase tracking-wide text-on-surface-variant">{product.brand}</span>}
        <h3 className="text-sm font-medium text-on-background line-clamp-2 leading-snug group-hover:underline">{product.title}</h3>
        <RatingStars value={product.ratingAvg} count={product.ratingCount} />
        <div className="mt-auto pt-1">
          <PriceTag price={product.minPrice} maxPrice={product.maxPrice} compareAtPrice={product.compareAtPrice} />
          <p className="text-xs text-on-surface-variant truncate mt-0.5">Vendido por {product.companyName}</p>
        </div>
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: ProductListItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {products.map(p => <ProductCard key={p.id} product={p} />)}
    </div>
  );
}

// Horizontally scrolling row for the storefront home and product pages.
export function ProductRail({ title, href, products }: { title?: string; href?: string; products: ProductListItem[] }) {
  if (products.length === 0) return null;
  return (
    <section className="space-y-3">
      {title && (
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold text-on-background">{title}</h2>
          {href && <Link href={href} className="text-sm font-medium hover:underline shrink-0">Ver todo</Link>}
        </div>
      )}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto snap-x pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        {products.map(p => <ProductCard key={p.id} product={p} className="w-40 sm:w-52 shrink-0 snap-start" />)}
      </div>
    </section>
  );
}
