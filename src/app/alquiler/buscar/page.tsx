import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUniqueCities } from '@/lib/data';
import { RENTALS_PER_PAGE, searchRentals } from '@/lib/rentals/public';
import { activeRentalFilters, parseRentalQuery, rentalHref, type RawSearchParams } from '@/lib/rentals/query-params';
import { kindLabel, type RentalQuery } from '@/lib/rentals/types';
import { RentalBreadcrumbs, RentalGrid } from '@/components/rentals/RentalCard';
import { RentalFilters, RentalSortSelect } from '@/components/rentals/RentalFilters';

type Props = { searchParams: Promise<RawSearchParams> };

function heading(q: RentalQuery): string {
  const what = q.kinds?.length === 1 && q.category
    ? kindLabel(q.category, q.kinds[0])
    : q.category === 'property' ? 'Inmuebles' : q.category === 'vehicle' ? 'Vehículos' : 'Anuncios';
  const term = q.term === 'long' ? ' por meses' : q.term === 'short' ? (q.category === 'vehicle' ? ' por días' : ' por noches') : '';
  return `${what} en alquiler${term}${q.city ? ` en ${q.city}` : ''}`;
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const q = parseRentalQuery(await searchParams);
  const filtered = !!q.q || (q.page ?? 1) > 1 || !!q.sort || activeRentalFilters(q) > 1;
  return {
    title: `${heading(q)} — Oltinde`,
    description: `${heading(q)}: precios en XAF, fotos y contacto directo con la empresa.`,
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function RentalSearchPage({ searchParams }: Props) {
  const query = parseRentalQuery(await searchParams);
  const [result, cities] = await Promise.all([searchRentals(query), getUniqueCities()]);
  const start = (result.page - 1) * RENTALS_PER_PAGE + 1;
  const pageHref = (page: number) => rentalHref({ ...query, page });

  return (
    <div>
      <RentalBreadcrumbs items={[{ label: heading(query), href: rentalHref(query) }]} />
      <h1 className="text-2xl md:text-3xl font-bold mb-6">{heading(query)}</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <aside className="md:w-64 shrink-0"><RentalFilters query={query} facets={result.facets} cities={cities} /></aside>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-outline-variant pb-3">
            <span className="text-sm text-muted-foreground">
              {result.total > 0 ? `${start}-${Math.min(start + result.items.length - 1, result.total)} de ${result.total} anuncios` : 'Sin resultados'}
            </span>
            <RentalSortSelect query={query} />
          </div>
          {result.items.length > 0 ? (
            <>
              <RentalGrid items={result.items} />
              {result.pageCount > 1 && (
                <nav aria-label="Paginación" className="flex items-center justify-center gap-3 pt-6">
                  <Button variant="outline" size="sm" asChild disabled={result.page <= 1}>
                    <Link href={pageHref(result.page - 1)} className={result.page <= 1 ? 'pointer-events-none opacity-50' : ''}><ChevronLeft className="w-4 h-4 mr-1" />Anterior</Link>
                  </Button>
                  <span className="text-sm">Página {result.page} de {result.pageCount}</span>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={pageHref(result.page + 1)} className={result.page >= result.pageCount ? 'pointer-events-none opacity-50' : ''}>Siguiente<ChevronRight className="w-4 h-4 ml-1" /></Link>
                  </Button>
                </nav>
              )}
            </>
          ) : (
            <div className="text-center py-16 space-y-3">
              <SearchX className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="font-semibold">No hay anuncios con estos filtros</p>
              <p className="text-sm text-muted-foreground">Pruebe otra ciudad o quite algunos filtros.</p>
              <Button variant="outline" asChild><Link href="/alquiler">Volver a Alquiler</Link></Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
