'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SellerGate } from '@/components/shop/SellerGate';
import { ProductForm } from '@/components/shop/ProductForm';
import { getProductCategories } from '@/lib/shop/data';
import type { ProductCategory } from '@/lib/shop/types';

export default function NewProductPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const router = useRouter();
  const [categories, setCategories] = useState<ProductCategory[] | null>(null);

  useEffect(() => {
    getProductCategories().then(setCategories);
  }, []);

  return (
    <SellerGate companyId={companyId}>
      {company => (
        <div className="space-y-6 max-w-4xl">
          <div>
            <Link href={`/dashboard/companies/${companyId}/shop`} className="text-sm text-muted-foreground hover:underline inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" /> Volver a la tienda
            </Link>
            <h1 className="text-3xl font-bold font-headline mt-2">Nuevo Producto</h1>
            <p className="text-muted-foreground">{company.name}</p>
          </div>
          {categories === null ? (
            <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <ProductForm
              companyId={companyId}
              categories={categories}
              onSaved={() => {
                router.push(`/dashboard/companies/${companyId}/shop`);
                router.refresh();
              }}
            />
          )}
        </div>
      )}
    </SellerGate>
  );
}
