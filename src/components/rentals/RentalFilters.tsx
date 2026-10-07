'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MobileFilterSheet } from '@/components/shared/archive/MobileFilterSheet';
import { activeRentalFilters, rentalHref } from '@/lib/rentals/query-params';
import {
  RENTAL_SORT_LABELS, TRANSMISSION_LABELS, kindLabel, kindsFor, unitLabel,
  type RentalCategory, type RentalQuery, type RentalSearchResult, type RentalSort,
} from '@/lib/rentals/types';
import { cn } from '@/lib/utils';

const ANY = '__any__';

function useGo(query: RentalQuery) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const go = (patch: Partial<RentalQuery>) => start(() => router.push(rentalHref({ ...query, ...patch, page: undefined }), { scroll: false }));
  return { go, pending };
}

function Controls({ query, facets, cities }: { query: RentalQuery; facets: RentalSearchResult['facets']; cities: string[] }) {
  const { go, pending } = useGo(query);
  const [min, setMin] = useState(query.minPrice?.toString() ?? '');
  const [max, setMax] = useState(query.maxPrice?.toString() ?? '');
  const cat = query.category;
  const facetCount = new Map(facets.kinds.map(k => [k.kind, k.count]));
  const kindOptions = cat ? Object.keys(kindsFor(cat)) : [];
  const toggleKind = (k: string) => go({ kinds: query.kinds?.includes(k) ? query.kinds.filter(x => x !== k) : [...(query.kinds ?? []), k] });

  return (
    <div className="space-y-6 relative">
      {pending && <Loader2 className="w-4 h-4 animate-spin absolute right-0 top-0" />}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">¿Qué busca?</h3>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-1 text-sm">
          {([[undefined, 'Todo'], ['property', 'Inmuebles'], ['vehicle', 'Vehículos']] as [RentalCategory | undefined, string][]).map(([value, label]) => (
            <button key={label} type="button" onClick={() => go({ category: value, kinds: [], minBedrooms: undefined, furnished: undefined, transmission: undefined, withDriver: undefined })}
              className={cn('rounded px-2 py-1.5 font-medium', cat === value ? 'bg-background shadow-sm' : 'text-muted-foreground hover:text-foreground')} aria-pressed={cat === value}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Modalidad</h3>
        <Select value={query.term ?? ANY} onValueChange={v => go({ term: v === ANY ? undefined : (v as 'short' | 'long'), minPrice: undefined, maxPrice: undefined })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas</SelectItem>
            <SelectItem value="short">Por {cat ? unitLabel(cat, true) : 'noches o días'}</SelectItem>
            <SelectItem value="long">Por meses</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Ciudad</h3>
        <Select value={query.city ?? ANY} onValueChange={v => go({ city: v === ANY ? undefined : v })}>
          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Todas</SelectItem>
            {cities.map(c => {
              const n = facets.cities.find(f => f.city === c)?.count;
              return <SelectItem key={c} value={c}>{c}{n ? ` (${n})` : ''}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      {kindOptions.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Tipo</h3>
          {kindOptions.map(k => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer">
              <Checkbox checked={!!query.kinds?.includes(k)} onCheckedChange={() => toggleKind(k)} />
              <span className="flex-1">{kindLabel(cat!, k)}</span>
              <span className="text-xs text-muted-foreground">{facetCount.get(k) ?? 0}</span>
            </label>
          ))}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Precio (XAF{query.term === 'long' ? ' / mes' : cat ? ` / ${unitLabel(cat)}` : ''})</h3>
        <div className="flex items-center gap-2">
          <Input type="number" min={0} placeholder="Mín" value={min} onChange={e => setMin(e.target.value)} className="h-9" aria-label="Precio mínimo" />
          <span className="text-muted-foreground">–</span>
          <Input type="number" min={0} placeholder="Máx" value={max} onChange={e => setMax(e.target.value)} className="h-9" aria-label="Precio máximo" />
        </div>
        <Button variant="outline" size="sm" className="w-full" onClick={() => go({ minPrice: min ? Number(min) : undefined, maxPrice: max ? Number(max) : undefined, term: query.term ?? 'short' })}>Aplicar precio</Button>
        {!query.term && <p className="text-xs text-muted-foreground">Se aplica al precio por {cat ? unitLabel(cat) : 'noche/día'}. Elija &quot;Por meses&quot; para filtrar el precio mensual.</p>}
      </div>

      {cat !== 'vehicle' && (
        <div className="space-y-2">
          <h3 className="font-semibold text-sm">Habitaciones (mínimo)</h3>
          <div className="flex gap-1">
            {[undefined, 1, 2, 3, 4].map(n => (
              <button key={n ?? 0} type="button" onClick={() => go({ minBedrooms: n })} aria-pressed={query.minBedrooms === n}
                className={cn('flex-1 rounded-md border py-1 text-sm', query.minBedrooms === n ? 'border-black bg-black text-white' : 'hover:border-black')}>
                {n === undefined ? 'Todas' : `${n}+`}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="rf-guests" className="font-semibold text-sm">{cat === 'vehicle' ? 'Plazas (mínimo)' : 'Personas (mínimo)'}</Label>
        <Input id="rf-guests" type="number" min={1} className="h-9 w-24" defaultValue={query.minGuests ?? ''} onBlur={e => go({ minGuests: e.target.value ? Number(e.target.value) : undefined })} />
      </div>

      {cat === 'property' && (
        <label className="flex items-center justify-between text-sm cursor-pointer"><span>Solo amueblados</span><Switch checked={!!query.furnished} onCheckedChange={v => go({ furnished: v || undefined })} /></label>
      )}
      {cat === 'vehicle' && (
        <>
          <div className="space-y-2">
            <h3 className="font-semibold text-sm">Cambio</h3>
            <Select value={query.transmission ?? ANY} onValueChange={v => go({ transmission: v === ANY ? undefined : v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value={ANY}>Cualquiera</SelectItem>{Object.entries(TRANSMISSION_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="flex items-center justify-between text-sm cursor-pointer"><span>Con conductor disponible</span><Switch checked={!!query.withDriver} onCheckedChange={v => go({ withDriver: v || undefined })} /></label>
        </>
      )}

      {activeRentalFilters(query) > 0 && (
        <Button variant="ghost" size="sm" className="w-full" onClick={() => go({ kinds: [], city: undefined, term: undefined, minPrice: undefined, maxPrice: undefined, minBedrooms: undefined, minGuests: undefined, furnished: undefined, transmission: undefined, withDriver: undefined })}>
          Quitar filtros
        </Button>
      )}
    </div>
  );
}

export function RentalFilters(props: { query: RentalQuery; facets: RentalSearchResult['facets']; cities: string[] }) {
  return (
    <>
      <MobileFilterSheet activeCount={activeRentalFilters(props.query)}><Controls {...props} /></MobileFilterSheet>
      <div className="hidden md:block"><Controls {...props} /></div>
    </>
  );
}

export function RentalSortSelect({ query }: { query: RentalQuery }) {
  const { go } = useGo(query);
  return (
    <Select value={query.sort ?? 'relevance'} onValueChange={v => go({ sort: v as RentalSort })}>
      <SelectTrigger className="h-9 w-[200px]" aria-label="Ordenar por"><SelectValue /></SelectTrigger>
      <SelectContent>{(Object.keys(RENTAL_SORT_LABELS) as RentalSort[]).map(s => <SelectItem key={s} value={s}>{RENTAL_SORT_LABELS[s]}</SelectItem>)}</SelectContent>
    </Select>
  );
}
