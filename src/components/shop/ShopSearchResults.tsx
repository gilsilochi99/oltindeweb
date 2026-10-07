'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Package } from 'lucide-react';
import { quickProductSearch } from '@/lib/shop/engagement';
import { formatXaf, type ProductListItem } from '@/lib/shop/types';

// "Productos en la Tienda" group for the smart search results.
export function ShopSearchResults({ query, city, onNavigate }: { query: string; city?: string; onNavigate?: () => void }) {
  const [data, setData] = useState<{ items: ProductListItem[]; total: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    quickProductSearch(query, city).then(d => { if (!cancelled) setData(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, [query, city]);

  if (!data || data.items.length === 0) return null;
  const params = new URLSearchParams({ q: query, stock: '1' });
  if (city) params.set('ciudad', city);

  return (
    <div className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Productos en la Tienda</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.items.map(p => (
          <Link key={p.id} href={`/tienda/p/${p.slug}`} onClick={onNavigate} className="flex gap-3 rounded-lg border bg-card p-3 hover:bg-muted/50 transition-colors">
            <div className="relative w-14 h-14 rounded-md bg-muted overflow-hidden shrink-0 flex items-center justify-center">
              {p.image ? <Image src={p.image} alt="" fill sizes="56px" className="object-cover" /> : <Package className="w-5 h-5 text-muted-foreground" />}
            </div>
            <div className="min-w-0 text-sm">
              <p className="font-medium line-clamp-2">{p.title}</p>
              <p className="font-semibold">{p.maxPrice > p.minPrice ? 'desde ' : ''}{formatXaf(p.minPrice)}</p>
              <p className="text-xs text-muted-foreground truncate">{p.companyName}</p>
            </div>
          </Link>
        ))}
      </div>
      <Link href={`/tienda/buscar?${params}`} onClick={onNavigate} className="inline-flex items-center gap-1 text-sm font-semibold text-black hover:underline">
        Ver {data.total} {data.total === 1 ? 'producto' : 'productos'} en la Tienda <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
