'use client';

import { useEffect, useState } from 'react';
import { useShopCart } from '@/hooks/use-shop-cart';
import { getCartDetails } from '@/lib/shop/orders';
import type { CartDetails } from '@/lib/shop/types';

// Resolves the stored cart lines against live prices/stock, refetching
// whenever the lines change. Lines that no longer exist are pruned.
export function useCartDetails() {
  const cart = useShopCart();
  const [details, setDetails] = useState<CartDetails | null>(null);
  const key = JSON.stringify(cart.lines);

  useEffect(() => {
    if (!cart.ready) return;
    let cancelled = false;
    if (cart.lines.length === 0) {
      setDetails({ groups: [], missingVariantIds: [], subtotal: 0, itemCount: 0 });
      return;
    }
    getCartDetails(cart.lines).then(d => {
      if (cancelled) return;
      setDetails(d);
      if (d.missingVariantIds.length) cart.removeMany(d.missingVariantIds);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, cart.ready]);

  return { cart, details };
}
