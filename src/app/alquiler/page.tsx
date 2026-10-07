import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Car, Home, KeyRound, Search, Store, Truck, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUniqueCities } from '@/lib/data';
import { getRentalsHome } from '@/lib/rentals/public';
import { RentalBreadcrumbs, RentalRail } from '@/components/rentals/RentalCard';

export const metadata: Metadata = {
  title: 'Alquiler de casas, pisos y coches — Guinea Ecuatorial',
  description: 'Alquile pisos, casas, oficinas y vehículos de empresas de Guinea Ecuatorial. Por noches, días o meses, con precios en XAF.',
  alternates: { canonical: '/alquiler' },
};

// Shortcut tiles: a category, optionally narrowed to some kinds.
const TILES = [
  { label: 'Pisos y apartamentos', href: '/alquiler/buscar?cat=inmuebles&tipo=piso,estudio', icon: Building2, kinds: ['piso', 'estudio'] },
  { label: 'Casas y villas', href: '/alquiler/buscar?cat=inmuebles&tipo=casa,villa', icon: Home, kinds: ['casa', 'villa'] },
  { label: 'Oficinas y locales', href: '/alquiler/buscar?cat=inmuebles&tipo=oficina,local,nave', icon: Warehouse, kinds: ['oficina', 'local', 'nave'] },
  { label: 'Coches y todoterrenos', href: '/alquiler/buscar?cat=vehiculos&tipo=coche,todoterreno,pickup', icon: Car, kinds: ['coche', 'todoterreno', 'pickup'] },
  { label: 'Furgonetas y minibuses', href: '/alquiler/buscar?cat=vehiculos&tipo=furgoneta,minibus,camion', icon: Truck, kinds: ['furgoneta', 'minibus', 'camion'] },
] as const;

const selectClass = 'h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

export default async function RentalsHomePage() {
  const [home, cities] = await Promise.all([getRentalsHome(), getUniqueCities()]);
  const countFor = (kinds: readonly string[]) => home.kindCounts.filter(k => kinds.includes(k.kind)).reduce((s, k) => s + k.count, 0);

  return (
    <div className="space-y-10">
      <RentalBreadcrumbs items={[]} />

      <section className="rounded-xl bg-primary/90 px-5 py-8 sm:px-10 sm:py-12">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Alquiler en Guinea Ecuatorial</h1>
          <p className="text-black/80">Pisos, casas, oficinas y vehículos de empresas verificadas. Por noches, días o meses.</p>
          {/* Plain GET form: works without JavaScript and lands on the search page. */}
          <form action="/alquiler/buscar" method="get" className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-lg bg-white p-2 shadow-lg">
            <label className="sr-only" htmlFor="h-cat">Qué busca</label>
            <select id="h-cat" name="cat" className={selectClass} defaultValue="">
              <option value="">Inmuebles y vehículos</option>
              <option value="inmuebles">Inmuebles</option>
              <option value="vehiculos">Vehículos</option>
            </select>
            <label className="sr-only" htmlFor="h-city">Ciudad</label>
            <select id="h-city" name="ciudad" className={selectClass} defaultValue="">
              <option value="">Todas las ciudades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="sr-only" htmlFor="h-term">Modalidad</label>
            <select id="h-term" name="modalidad" className={selectClass} defaultValue="">
              <option value="">Por días, noches o meses</option>
              <option value="dias">Por días / noches</option>
              <option value="meses">Por meses</option>
            </select>
            <button type="submit" className="h-11 px-6 rounded-md bg-primary text-primary-foreground font-semibold flex items-center justify-center gap-2 hover:opacity-90">
              <Search className="w-4 h-4" />Buscar
            </button>
          </form>
          <p className="text-sm text-black/80 flex items-center gap-1.5"><KeyRound className="w-4 h-4" />{home.total} {home.total === 1 ? 'anuncio disponible' : 'anuncios disponibles'}</p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-bold">Explorar por tipo</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {TILES.map(t => (
            <Link key={t.label} href={t.href} className="group flex flex-col items-center gap-2 rounded-lg border border-outline-variant bg-card p-4 text-center hover:shadow-md transition-shadow">
              <span className="w-14 h-14 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors"><t.icon className="w-6 h-6" /></span>
              <span className="text-sm font-medium leading-tight group-hover:underline">{t.label}</span>
              <span className="text-xs text-muted-foreground">{countFor(t.kinds)} {countFor(t.kinds) === 1 ? 'anuncio' : 'anuncios'}</span>
            </Link>
          ))}
        </div>
      </section>

      {home.total === 0 ? (
        <section className="rounded-xl border border-dashed p-10 text-center space-y-3">
          <KeyRound className="w-12 h-12 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-bold">Muy pronto, los primeros anuncios</h2>
          <p className="text-muted-foreground max-w-md mx-auto">Las empresas de Guinea Ecuatorial están publicando sus inmuebles y vehículos.</p>
        </section>
      ) : (
        <>
          <RentalRail title="Destacados" items={home.featured} />
          <RentalRail title="Inmuebles" href="/alquiler/buscar?cat=inmuebles" items={home.properties} />
          <RentalRail title="Vehículos" href="/alquiler/buscar?cat=vehiculos" items={home.vehicles} />
        </>
      )}

      <section className="rounded-xl bg-muted px-5 py-8 sm:px-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex gap-4 items-start">
          <Store className="w-8 h-8 shrink-0" />
          <div>
            <h2 className="text-xl font-bold">¿Alquila inmuebles o vehículos?</h2>
            <p className="text-muted-foreground text-sm mt-1">Las empresas Premium publican sus anuncios con fotos, precios y calendario, y reciben solicitudes de clientes de todo el país.</p>
          </div>
        </div>
        <Button asChild size="lg"><Link href="/para-empresas">Publicar mis alquileres</Link></Button>
      </section>
    </div>
  );
}
