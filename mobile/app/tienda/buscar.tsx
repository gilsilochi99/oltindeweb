import { Stack, useLocalSearchParams } from 'expo-router';
import type { ProductSort } from '../../src/lib/shop';
import { ProductBrowser } from '../../src/components/shop/ProductBrowser';
import { CartButton } from '../../src/components/shop/CartButton';

export default function TiendaSearchScreen() {
  const params = useLocalSearchParams<{ q?: string; categorySlug?: string; companyId?: string; onSaleOnly?: string; sort?: string; title?: string }>();
  return (
    <>
      <Stack.Screen options={{ title: params.title || 'Buscar en la Tienda', headerRight: () => <CartButton /> }} />
      <ProductBrowser
        initialQuery={params.q}
        categorySlug={params.categorySlug}
        companyId={params.companyId}
        initialSort={params.sort as ProductSort | undefined}
        initialOnSale={params.onSaleOnly === '1'}
        autoFocus={!params.categorySlug && !params.companyId && !params.sort && !params.onSaleOnly}
      />
    </>
  );
}
