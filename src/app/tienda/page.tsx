import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, Store, Tag, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getActiveCategories, getStorefrontHome } from '@/lib/shop/storefront';
import { ProductRail } from '@/components/shop/ProductCard';
import { ShopBreadcrumbs, ShopSearchBar } from '@/components/shop/ShopChrome';

export const metadata: Metadata = {
  title: 'Tienda Online en Guinea Ecuatorial: comprar por internet',
  description: 'Compre online productos de empresas de Guinea Ecuatorial: electrónica, móviles, moda, hogar, alimentación y más. Precios en XAF, envío a domicilio o recogida, y pago contra entrega.',
  alternates: { canonical: '/tienda' },
};

export default async function ShopHomePage() {
  const [home, categories] = await Promise.all([getStorefrontHome(), getActiveCategories()]);

  // Product counts rolled up from subcategories into their top-level parent.
  const rootOf = (id: string): string => {
    let c = categories.find(x => x.id === id);
    while (c?.parentId) c = categories.find(x => x.id === c!.parentId);
    return c?.id ?? id;
  };
  const rootCounts = new Map<string, number>();
  for (const [id, n] of Object.entries(home.categoryCounts)) {
    rootCounts.set(rootOf(id), (rootCounts.get(rootOf(id)) ?? 0) + n);
  }
  const topCategories = categories.filter(c => !c.parentId);
  const withProducts = topCategories.filter(c => (rootCounts.get(c.id) ?? 0) > 0);
  const shownCategories = withProducts.length >= 4 ? withProducts : topCategories;

  return (
    <div className="space-y-10">
      <ShopBreadcrumbs items={[]} />

      <section className="rounded-xl bg-primary/90 px-5 py-8 sm:px-10 sm:py-12">
        <div className="max-w-2xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Tienda Oltinde</h1>
          <p className="text-black/80">
            Compre directamente a empresas de Guinea Ecuatorial. Precios en XAF y pago al recibir.
          </p>
          <ShopSearchBar />
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/80 pt-1">
            <span className="flex items-center gap-1.5"><Store className="w-4 h-4" /> Empresas del directorio Oltinde</span>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" /> Recogida o entrega</span>
            <span className="flex items-center gap-1.5"><Tag className="w-4 h-4" /> {home.totalProducts} productos</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Comprar por categoría</h2>
          <Link href="/tienda/buscar" className="text-sm font-medium hover:underline">Ver todos los productos</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {shownCategories.map(c => (
            <Link key={c.id} href={`/tienda/c/${c.slug}`} className="group flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-card p-3 text-center hover:shadow-md transition-shadow">
              <div className="relative w-14 h-14 rounded-full bg-muted overflow-hidden flex items-center justify-center">
                {c.image ? <Image src={c.image} alt="" fill sizes="56px" className="object-cover" /> : <ShoppingBag className="w-6 h-6 text-muted-foreground" />}
              </div>
              <span className="text-xs font-medium leading-tight group-hover:underline">{c.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {home.totalProducts === 0 ? (
        <section className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">La tienda está abriendo sus puertas</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Pronto encontrará aquí los productos de las empresas de Guinea Ecuatorial.</p>
        </section>
      ) : (
        <>
          <ProductRail title="Ofertas" href="/tienda/buscar?oferta=1" products={home.deals} />
          <ProductRail title="Destacados" products={home.featured} />
          <ProductRail title="Más vendidos" href="/tienda/buscar?orden=best_selling" products={home.bestSellers} />
          <ProductRail title="Novedades" href="/tienda/buscar?orden=newest" products={home.newest} />
        </>
      )}

      <section className="rounded-xl bg-muted px-5 py-8 sm:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">¿Tiene una empresa? Venda en Oltinde</h2>
          <p className="text-muted-foreground text-sm mt-1">Publique sus productos con precios, fotos y stock, y reciba pedidos de clientes de todo el país.</p>
        </div>
        <Button asChild size="lg"><Link href="/para-empresas">Empezar a vender</Link></Button>
      </section>
    </div>
  );
}
