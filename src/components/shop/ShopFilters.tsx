'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileFilterSheet } from '@/components/shared/archive/MobileFilterSheet';
import { activeFilterCount, hrefWith } from '@/lib/shop/query-params';
import {
  PRODUCT_CONDITION_LABELS, PRODUCT_SORT_LABELS,
  type ProductCategory, type ProductCondition, type ProductQuery, type ProductSearchResult, type ProductSort,
} from '@/lib/shop/types';

const ALL_CITIES = '__all__';

interface ShopFiltersProps {
  basePath: string;
  query: ProductQuery;
  facets: ProductSearchResult['facets'];
  categories: ProductCategory[];
  currentCategoryId?: string;
  cities: string[];
  // Seller pages filter within one store and don't navigate between categories.
  showCategories?: boolean;
}

function useNavigate(basePath: string, query: ProductQuery) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const go = (patch: Partial<ProductQuery>) => {
    startTransition(() => router.push(hrefWith(basePath, { ...query, ...patch, page: undefined }), { scroll: false }));
  };
  return { go, isPending };
}

function CategoryLinks({ categories, facets, currentCategoryId, query }: Pick<ShopFiltersProps, 'categories' | 'facets' | 'currentCategoryId' | 'query'>) {
  const direct = new Map(facets.categories.map(c => [c.id, c.count]));
  const rolled = (id: string): number =>
    (direct.get(id) ?? 0) + categories.filter(c => c.parentId === id).reduce((s, c) => s + rolled(c.id), 0);

  const current = categories.find(c => c.id === currentCategoryId);
  const parent = current?.parentId ? categories.find(c => c.id === current.parentId) : undefined;
  const children = categories.filter(c => c.parentId === (current?.id ?? null)).filter(c => rolled(c.id) > 0);
  const keep = { ...query, page: undefined };

  return (
    <div className="space-y-1.5">
      <h3 className="font-semibold text-sm">Categorías</h3>
      {current && (
        <Link href={hrefWith(parent ? `/tienda/c/${parent.slug}` : '/tienda/buscar', keep)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-3.5 h-3.5" /> {parent ? parent.name : 'Todas las categorías'}
        </Link>
      )}
      {current && <p className="text-sm font-semibold pl-1">{current.name}</p>}
      <ul className={current ? 'pl-3 space-y-1' : 'space-y-1'}>
        {children.map(c => (
          <li key={c.id}>
            <Link href={hrefWith(`/tienda/c/${c.slug}`, keep)} className="flex justify-between gap-2 text-sm hover:underline">
              <span>{c.name}</span><span className="text-muted-foreground">{rolled(c.id)}</span>
            </Link>
          </li>
        ))}
        {children.length === 0 && !current && <li className="text-sm text-muted-foreground">Sin resultados</li>}
      </ul>
    </div>
  );
}

function FilterControls(props: ShopFiltersProps) {
  const { basePath, query, facets, cities, showCategories = true } = props;
  const { go, isPending } = useNavigate(basePath, query);
  const [min, setMin] = useState(query.minPrice?.toString() ?? '');
  const [max, setMax] = useState(query.maxPrice?.toString() ?? '');

  const toggle = <T extends string>(list: T[] | undefined, value: T): T[] =>
    list?.includes(value) ? list.filter(v => v !== value) : [...(list ?? []), value];

  const applyPrice = () => {
    const toNum = (s: string) => (s.trim() && Number(s) >= 0 ? Number(s) : undefined);
    go({ minPrice: toNum(min), maxPrice: toNum(max) });
  };

  return (
    <div className="space-y-6 relative">
      {isPending && <Loader2 className="w-4 h-4 animate-spin absolute right-0 top-0" />}
      {showCategories && <CategoryLinks {...props} />}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Precio (XAF)</h3>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} inputMode="numeric" placeholder={facets.price.min ? String(facets.price.min) : 'Mín'} value={min} onChange={e => setMin(e.target.value)} aria-label="Precio mínimo" className="h-9" />
          <span className="text-muted-foreground">–</span>
          <Input type="number" min={0} inputMode="numeric" placeholder={facets.price.max ? String(facets.price.max) : 'Máx'} value={max} onChange={e => setMax(e.target.value)} aria-label="Precio máximo" className="h-9" />
        </div>
        <Button type="button" variant="outline" size="sm" className="w-full" onClick={applyPrice}>Aplicar precio</Button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="f-stock" className="font-normal">Solo en stock</Label>
          <Switch id="f-stock" checked={!!query.inStockOnly} onCheckedChange={v => go({ inStockOnly: v || undefined })} />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="f-sale" className="font-normal">Solo ofertas</Label>
          <Switch id="f-sale" checked={!!query.onSaleOnly} onCheckedChange={v => go({ onSaleOnly: v || undefined })} />
        </div>
      </div>

      {facets.brands.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Marca</h3>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {facets.brands.map(b => (
              <label key={b.name} className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={!!query.brands?.includes(b.name)} onCheckedChange={() => go({ brands: toggle(query.brands, b.name) })} />
                <span className="flex-1">{b.name}</span>
                <span className="text-muted-foreground text-xs">{b.count}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Estado</h3>
        {(Object.keys(PRODUCT_CONDITION_LABELS) as ProductCondition[]).map(c => (
          <label key={c} className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={!!query.conditions?.includes(c)} onCheckedChange={() => go({ conditions: toggle(query.conditions, c) })} />
            {PRODUCT_CONDITION_LABELS[c]}
          </label>
        ))}
      </div>

      {cities.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Ciudad del vendedor</h3>
          <Select value={query.city ?? ALL_CITIES} onValueChange={v => go({ city: v === ALL_CITIES ? undefined : v })}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_CITIES}>Todas</SelectItem>
              {cities.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {activeFilterCount(query) > 0 && (
        <Button type="button" variant="ghost" size="sm" className="w-full" onClick={() => go({ minPrice: undefined, maxPrice: undefined, brands: [], conditions: [], city: undefined, inStockOnly: undefined, onSaleOnly: undefined })}>
          Quitar filtros
        </Button>
      )}
    </div>
  );
}

export function ShopFilters(props: ShopFiltersProps) {
  return (
    <>
      <MobileFilterSheet activeCount={activeFilterCount(props.query)}>
        <FilterControls {...props} />
      </MobileFilterSheet>
      <div className="hidden md:block">
        <FilterControls {...props} />
      </div>
    </>
  );
}

export function ShopSortSelect({ basePath, query }: { basePath: string; query: ProductQuery }) {
  const { go } = useNavigate(basePath, query);
  return (
    <Select value={query.sort ?? 'relevance'} onValueChange={v => go({ sort: v as ProductSort })}>
      <SelectTrigger className="h-9 w-[210px]" aria-label="Ordenar por"><SelectValue /></SelectTrigger>
      <SelectContent>
        {(Object.keys(PRODUCT_SORT_LABELS) as ProductSort[]).map(s => <SelectItem key={s} value={s}>{PRODUCT_SORT_LABELS[s]}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
