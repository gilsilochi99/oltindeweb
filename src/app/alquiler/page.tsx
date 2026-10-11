import type { Metadata } from 'next';
import Link from 'next/link';
import { Armchair, Building2, Car, Hammer, Home, KeyRound, PartyPopper, Search, Speaker, Store, Tent, Truck, UserRound, Warehouse, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUniqueCities } from '@/lib/data';
import { getRentalLandingCombos, getRentalsHome } from '@/lib/rentals/public';
import { RentalBreadcrumbs, RentalRail } from '@/components/rentals/RentalCard';
import { PopularRentalSearches } from '@/components/rentals/PopularRentalSearches';

export const metadata: Metadata = {
  title: 'Alquiler de casas, coches, sillas, carpas, sonido y salones en Malabo y Bata',
  description: 'Alquiler de pisos, casas, oficinas, coches, equipos para eventos (sillas, mesas, carpas, sonido), generadores, maquinaria y salones de eventos en Guinea Ecuatorial. De empresas y particulares, por horas, días o meses.',
  keywords: ['alquiler', 'alquiler de coches', 'rent a car', 'alquiler de pisos', 'casas en alquiler', 'alquiler de sillas', 'alquiler de carpas', 'alquiler de sonido', 'alquiler de generadores', 'salón de eventos', 'Malabo', 'Bata', 'Guinea Ecuatorial'],
  alternates: { canonical: '/alquiler' },
};

// Shortcut tiles: a category, optionally narrowed to some kinds.
const TILES = [
  { label: 'Pisos y apartamentos', href: '/alquiler/buscar?cat=inmuebles&tipo=piso,estudio', icon: Building2, kinds: ['piso', 'estudio'] },
  { label: 'Casas y villas', href: '/alquiler/buscar?cat=inmuebles&tipo=casa,villa', icon: Home, kinds: ['casa', 'villa'] },
  { label: 'Oficinas y locales', href: '/alquiler/buscar?cat=inmuebles&tipo=oficina,local,nave', icon: Warehouse, kinds: ['oficina', 'local', 'nave'] },
  { label: 'Coches y todoterrenos', href: '/alquiler/buscar?cat=vehiculos&tipo=coche,todoterreno,pickup', icon: Car, kinds: ['coche', 'todoterreno', 'pickup'] },
  { label: 'Furgonetas y minibuses', href: '/alquiler/buscar?cat=vehiculos&tipo=furgoneta,minibus,camion', icon: Truck, kinds: ['furgoneta', 'minibus', 'camion'] },
  { label: 'Sillas y mesas', href: '/alquiler/buscar?cat=equipos&tipo=sillas,mesas', icon: Armchair, kinds: ['sillas', 'mesas'] },
  { label: 'Carpas y decoración', href: '/alquiler/buscar?cat=equipos&tipo=carpas,decoracion,iluminacion', icon: Tent, kinds: ['carpas', 'decoracion', 'iluminacion'] },
  { label: 'Sonido y proyectores', href: '/alquiler/buscar?cat=equipos&tipo=sonido,proyector', icon: Speaker, kinds: ['sonido', 'proyector'] },
  { label: 'Generadores y maquinaria', href: '/alquiler/buscar?cat=equipos&tipo=generador,maquinaria,andamios,herramientas', icon: Zap, kinds: ['generador', 'maquinaria', 'andamios', 'herramientas'] },
  { label: 'Salones y espacios', href: '/alquiler/buscar?cat=espacios', icon: PartyPopper, kinds: ['salon', 'sala', 'coworking', 'estudio', 'jardin', 'cancha'] },
] as const;

const selectClass = 'h-11 rounded-md border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary';

export default async function RentalsHomePage() {
  const [home, cities, combos] = await Promise.all([getRentalsHome(), getUniqueCities(), getRentalLandingCombos()]);
  const countFor = (kinds: readonly string[]) => home.kindCounts.filter(k => kinds.includes(k.kind)).reduce((s, k) => s + k.count, 0);

  return (
    <div className="space-y-10">
      <RentalBreadcrumbs items={[]} />

      <section className="rounded-xl bg-primary/90 px-5 py-8 sm:px-10 sm:py-12">
        <div className="max-w-3xl space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-black">Alquiler en Guinea Ecuatorial</h1>
          <p className="text-black/80">Casas, coches, equipos para eventos y obras, y salones. De empresas y particulares, por horas, días o meses.</p>
          {/* Plain GET form: works without JavaScript and lands on the search page. */}
          <form action="/alquiler/buscar" method="get" className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 rounded-lg bg-white p-2 shadow-lg">
            <label className="sr-only" htmlFor="h-cat">Qué busca</label>
            <select id="h-cat" name="cat" className={selectClass} defaultValue="">
              <option value="">Todo</option>
              <option value="inmuebles">Casas y pisos</option>
              <option value="vehiculos">Coches y vehículos</option>
              <option value="equipos">Equipos y artículos</option>
              <option value="espacios">Espacios para eventos</option>
            </select>
            <label className="sr-only" htmlFor="h-city">Ciudad</label>
            <select id="h-city" name="ciudad" className={selectClass} defaultValue="">
              <option value="">Todas las ciudades</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <label className="sr-only" htmlFor="h-term">Modalidad</label>
            <select id="h-term" name="modalidad" className={selectClass} defaultValue="">
              <option value="">Por horas, días o meses</option>
              <option value="horas">Por horas</option>
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
          <p className="text-muted-foreground max-w-md mx-auto">Empresas y particulares de Guinea Ecuatorial están publicando lo que alquilan.</p>
        </section>
      ) : (
        <>
          <RentalRail title="Destacados" items={home.featured} />
          <RentalRail title="Casas y pisos" href="/alquiler/buscar?cat=inmuebles" items={home.properties} />
          <RentalRail title="Coches y vehículos" href="/alquiler/buscar?cat=vehiculos" items={home.vehicles} />
          <RentalRail title="Equipos y artículos" href="/alquiler/buscar?cat=equipos" items={home.items} />
          <RentalRail title="Espacios para eventos" href="/alquiler/buscar?cat=espacios" items={home.spaces} />
        </>
      )}

      <PopularRentalSearches combos={combos} />

      <section className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-muted px-5 py-8 sm:px-8 flex flex-col justify-between gap-4">
          <div className="flex gap-4 items-start">
            <UserRound className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-xl font-bold normal-case">¿Tiene algo que alquilar?</h2>
              <p className="text-muted-foreground text-sm mt-1">Sillas, una carpa, un generador, herramientas, su coche o un salón: publíquelo gratis como particular y reciba solicitudes de reserva.</p>
            </div>
          </div>
          <Button asChild size="lg" className="self-start"><Link href="/dashboard/alquileres/new"><Hammer className="w-4 h-4 mr-2" />Publicar un anuncio</Link></Button>
        </div>
        <div className="rounded-xl bg-muted px-5 py-8 sm:px-8 flex flex-col justify-between gap-4">
          <div className="flex gap-4 items-start">
            <Store className="w-8 h-8 shrink-0" />
            <div>
              <h2 className="text-xl font-bold normal-case">¿Es una empresa de alquiler?</h2>
              <p className="text-muted-foreground text-sm mt-1">Las empresas Premium publican sin límite, con su ficha verificada, estadísticas y calendario de reservas.</p>
            </div>
          </div>
          <Button asChild size="lg" variant="outline" className="self-start"><Link href="/para-empresas">Ver planes para empresas</Link></Button>
        </div>
      </section>
    </div>
  );
}
