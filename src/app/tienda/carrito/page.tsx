'use client';

import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, Loader2, Minus, Package, Plus, ShoppingCart, Store, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShopBreadcrumbs } from '@/components/shop/ShopChrome';
import { useCartDetails } from '@/components/shop/useCartDetails';
import { formatXaf, type CartItemDetail } from '@/lib/shop/types';

const ISSUE_TEXT: Record<NonNullable<CartItemDetail['issue']>, (i: CartItemDetail) => string> = {
  unavailable: () => 'Ya no está disponible',
  out_of_stock: () => 'Agotado',
  insufficient_stock: i => `Solo quedan ${i.maxQuantity}`,
};

export default function CartPage() {
  const { cart, details } = useCartDetails();
  const hasIssues = !!details?.groups.some(g => g.items.some(i => i.issue));

  if (!details) {
    return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  if (details.groups.length === 0) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center space-y-4">
        <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold">Su carrito está vacío</h1>
        <p className="text-muted-foreground">Explore la tienda y añada productos de las empresas de Guinea Ecuatorial.</p>
        <Button asChild><Link href="/tienda">Ir a la tienda</Link></Button>
      </div>
    );
  }

  return (
    <div>
      <ShopBreadcrumbs items={[{ label: 'Carrito', href: '/tienda/carrito' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Carrito ({details.itemCount})</h1>
      <div className="grid lg:grid-cols-[1fr_340px] gap-6 items-start">
        <div className="space-y-4">
          {details.groups.map(group => (
            <section key={group.companyId} className="rounded-lg border border-outline-variant bg-card">
              <header className="flex items-center gap-2 px-4 py-3 border-b">
                <Store className="w-4 h-4" />
                <Link href={`/tienda/vendedor/${group.companyId}`} className="font-semibold hover:underline">{group.companyName}</Link>
                {group.companyCity && <span className="text-sm text-muted-foreground">· {group.companyCity}</span>}
              </header>
              <ul className="divide-y">
                {group.items.map(item => (
                  <li key={item.variantId} className="flex gap-3 p-4">
                    <Link href={`/tienda/p/${item.productSlug}`} className="relative w-20 h-20 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? <Image src={item.image} alt="" fill sizes="80px" className="object-cover" /> : <Package className="w-6 h-6 text-muted-foreground" />}
                    </Link>
                    <div className="flex-1 min-w-0 space-y-1">
                      <Link href={`/tienda/p/${item.productSlug}`} className="font-medium hover:underline line-clamp-2">{item.productTitle}</Link>
                      {item.hasOptions && <p className="text-sm text-muted-foreground">{item.variantTitle}</p>}
                      <p className="text-sm">
                        <span className="font-semibold">{formatXaf(item.unitPrice)}</span>
                        {item.compareAtPrice && <span className="ml-2 text-xs line-through text-muted-foreground">{formatXaf(item.compareAtPrice)}</span>}
                      </p>
                      {item.issue && (
                        <p className="text-sm text-red-600 flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" />{ISSUE_TEXT[item.issue](item)}</p>
                      )}
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center rounded-md border">
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Menos" onClick={() => cart.setQuantity(item.variantId, item.quantity - 1)}>
                            <Minus className="w-3.5 h-3.5" />
                          </Button>
                          <span className="w-8 text-center text-sm tabular-nums">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Más" disabled={item.quantity >= item.maxQuantity} onClick={() => cart.setQuantity(item.variantId, item.quantity + 1)}>
                            <Plus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        {item.issue === 'insufficient_stock' && item.maxQuantity > 0 && (
                          <Button variant="link" size="sm" className="px-0" onClick={() => cart.setQuantity(item.variantId, item.maxQuantity)}>Ajustar a {item.maxQuantity}</Button>
                        )}
                        <Button variant="ghost" size="sm" className="text-destructive ml-auto" onClick={() => cart.removeItem(item.variantId)}>
                          <Trash2 className="w-4 h-4 sm:mr-1" /><span className="hidden sm:inline">Quitar</span>
                        </Button>
                      </div>
                    </div>
                    <span className="hidden sm:block font-semibold whitespace-nowrap">{formatXaf(item.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              {group.settings.minOrderAmount !== undefined && group.subtotal < group.settings.minOrderAmount && (
                <p className="px-4 pb-3 text-sm text-amber-700">Pedido mínimo en esta tienda: {formatXaf(group.settings.minOrderAmount)}.</p>
              )}
            </section>
          ))}
        </div>

        <aside className="rounded-lg border border-outline-variant bg-card p-5 space-y-4 lg:sticky lg:top-20">
          <h2 className="font-bold text-lg">Resumen</h2>
          <div className="flex justify-between text-sm"><span>Productos ({details.itemCount})</span><span>{formatXaf(details.subtotal)}</span></div>
          <p className="text-xs text-muted-foreground">El envío se calcula en el siguiente paso, según la ciudad y cada vendedor.</p>
          {details.groups.length > 1 && (
            <p className="text-xs text-muted-foreground">Su compra incluye {details.groups.length} vendedores: recibirá un pedido de cada uno.</p>
          )}
          <div className="flex justify-between font-bold text-lg border-t pt-3"><span>Subtotal</span><span>{formatXaf(details.subtotal)}</span></div>
          {hasIssues && <p className="text-sm text-red-600">Revise los productos marcados antes de continuar.</p>}
          <Button asChild size="lg" className="w-full" disabled={hasIssues}>
            <Link href="/tienda/checkout" aria-disabled={hasIssues} className={hasIssues ? 'pointer-events-none opacity-50' : ''}>Tramitar pedido</Link>
          </Button>
          <Button asChild variant="ghost" className="w-full"><Link href="/tienda">Seguir comprando</Link></Button>
        </aside>
      </div>
    </div>
  );
}
