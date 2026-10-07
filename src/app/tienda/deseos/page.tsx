'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getWishlistProducts, setWishlist } from '@/lib/shop/engagement';
import type { ProductListItem } from '@/lib/shop/types';
import { ProductCard } from '@/components/shop/ProductCard';
import { ShopBreadcrumbs } from '@/components/shop/ShopChrome';

export default function WishlistPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<ProductListItem[] | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push('/signin');
    if (user) getWishlistProducts().then(setItems);
  }, [loading, user, router]);

  const remove = async (id: string) => {
    setItems(prev => prev?.filter(p => p.id !== id) ?? null);
    await setWishlist(id, false);
  };

  return (
    <div>
      <ShopBreadcrumbs items={[{ label: 'Lista de deseos', href: '/tienda/deseos' }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">Lista de deseos</h1>
      {!items ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-3">
          <Heart className="w-12 h-12 mx-auto text-muted-foreground" />
          <p className="font-semibold">Su lista de deseos está vacía</p>
          <p className="text-sm text-muted-foreground">Pulse el corazón en cualquier producto para guardarlo aquí.</p>
          <Button asChild><Link href="/tienda">Ir a la tienda</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map(p => (
            <div key={p.id} className="relative">
              <ProductCard product={p} />
              <Button size="icon" variant="secondary" className="absolute top-2 right-2 h-8 w-8 rounded-full" onClick={() => remove(p.id)} aria-label={`Quitar ${p.title} de la lista`}>
                <Heart className="w-4 h-4 fill-red-500 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
