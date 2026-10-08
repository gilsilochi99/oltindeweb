import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { getActiveCompanies, getActiveMenuItems, getPharmaciesOnDuty, getCityBusinessDensity } from "@/lib/data";
import { BusinessDensityMap } from "@/components/shared/BusinessDensityMap";
import { Building, ArrowRight, ShieldCheck, Search, LayoutGrid, Star, Sparkles, ShoppingBag, KeyRound } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { GlobalHeaderSearch } from "@/components/shared/GlobalHeaderSearch";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { getStorefrontHome } from "@/lib/shop/storefront";
import { ProductRail } from "@/components/shop/ProductCard";

// Quick searches under the hero search box, run through the smart search.
const popularSearches = [
    "Restaurantes en Malabo",
    "Farmacias de guardia",
    "Abogados",
    "Hoteles en Bata",
    "Pasaporte",
    "Informática",
    "Empleo",
];

const whyOltinde = [
    {
        icon: ShieldCheck,
        title: "Empresas verificadas",
        description: "Cada ficha pasa por un proceso de verificación, para que confíe en lo que encuentra.",
    },
    {
        icon: Search,
        title: "Búsqueda inteligente",
        description: "Escriba lo que necesita en lenguaje natural y encuentre la empresa o servicio correcto.",
    },
    {
        icon: LayoutGrid,
        title: "Todo en un solo lugar",
        description: "Empresas, tienda online, alquileres, empleos, trámites, salud, eventos y más, sin saltar entre sitios distintos.",
    },
    {
        icon: Star,
        title: "Gratis para empezar",
        description: "Liste su empresa sin costo y active funciones premium cuando esté listo para crecer.",
    },
];

// Illustrated feature cards (artwork in public/illustrations/home). The
// whole card is the link, like the storefront category tiles.
const featureCards = [
    {
        image: "tienda-online",
        badge: "Nuevo",
        title: "Tienda Online",
        description: "Compre productos de empresas locales con precios en XAF. Pague al recibir o recoja en tienda.",
        link: { href: "/tienda", text: "Ir a la tienda" }
    },
    {
        image: "alquileres",
        badge: "Nuevo",
        title: "Alquileres",
        description: "Casas, pisos y coches en alquiler por noches, días o meses. Elija fechas y solicite la reserva.",
        link: { href: "/alquiler", text: "Buscar alquileres" }
    },
    {
        image: "directorio-empresas",
        title: "Directorio de empresas",
        description: "Busca proveedores, clientes potenciales, cualquier empresa por ubicación o actividad.",
        link: { href: "/companies", text: "Comenzar a buscar" }
    },
    {
        image: "guia-tramites",
        title: "Guía de Trámites",
        description: "Información detallada sobre procedimientos administrativos, requisitos y costos.",
        link: { href: "/procedures", text: "Explorar guía" }
    },
    {
        image: "anuncios-ofertas",
        title: "Anuncios y Ofertas",
        description: "Descubre las últimas noticias, actualizaciones y promociones de las empresas locales.",
        link: { href: "/announcements", text: "Ver novedades" }
    },
    {
        image: "itinerarios-viaje",
        title: "Itinerarios de Viaje",
        description: "Descubra lugares turísticos y planes de viaje creados por la comunidad, o comparta el suyo.",
        link: { href: "/itineraries", text: "Explorar itinerarios" }
    },
    {
        image: "alta-empresa",
        title: "Alta de tu empresa gratis",
        description: "Añade tu empresa al directorio para llegar a más clientes y gestionar tu perfil online.",
        link: { href: "/list-your-company", text: "Publicar mi empresa" }
    },
    {
        image: "bolsa-trabajo",
        title: "Bolsa de Trabajo",
        description: "Encuentra las últimas ofertas de empleo publicadas por empresas en Guinea Ecuatorial.",
        link: { href: "/jobs", text: "Ver empleos" }
    },
    {
        image: "eventos",
        title: "Eventos",
        description: "Descubre ferias, conferencias y actividades organizadas por empresas e instituciones.",
        link: { href: "/events", text: "Ver eventos" }
    },
    {
        image: "lugares-turisticos",
        title: "Lugares Turísticos",
        description: "Explora playas, monumentos, museos y otros lugares que merece la pena visitar.",
        link: { href: "/places", text: "Explorar lugares" }
    },
];

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const HOMEPAGE_MAX_ITEMS = 6;

export default async function Home() {
  const [allCompanies, allMenuItems, onDutyPharmacies, cityDensity, shop] = await Promise.all([
    getActiveCompanies(),
    getActiveMenuItems(),
    getPharmaciesOnDuty(),
    getCityBusinessDensity(),
    getStorefrontHome(),
  ]);
  // Deals first, topped up with the newest products so the rail is never thin.
  const shopProducts = [...shop.deals, ...shop.newest.filter(p => !shop.deals.some(d => d.id === p.id))].slice(0, 12);

  const companyById = new Map(allCompanies.map(c => [c.id, c]));
  const menuDelDiaItems = allMenuItems
    .filter(item => item.isMenuDelDia && item.available)
    .slice(0, HOMEPAGE_MAX_ITEMS);


  return (
    <div className="flex flex-col gap-12 md:gap-20 mb-12 md:mb-20">
      
      {/* Hero: same panel language as the storefront hero (/tienda) */}
      <section className="container mx-auto pt-6 md:pt-10">
        <div className="relative overflow-hidden rounded-xl bg-primary/90 px-5 py-8 sm:px-10 sm:py-12 grid lg:grid-cols-[1fr_300px] gap-8 items-center">
            <div className="min-w-0 space-y-5">
                <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-black/70">El directorio verificado de Guinea Ecuatorial</p>
                    <h1 className="text-3xl sm:text-5xl font-bold font-headline tracking-tight text-black normal-case">
                        Todo lo que buscas está <em className="italic">aquí</em>
                    </h1>
                </div>
                <div className="max-w-2xl">
                    <GlobalHeaderSearch />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-black/70 mr-1">Populares:</span>
                    {popularSearches.map(q => (
                        <Link
                            key={q}
                            href={`/search?q=${encodeURIComponent(q)}`}
                            className="rounded-full bg-white/70 hover:bg-white px-3 py-1 text-sm text-black transition-colors"
                        >
                            {q}
                        </Link>
                    ))}
                </div>
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-black/80 pt-1">
                    <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Empresas verificadas</span>
                    <span className="flex items-center gap-1.5"><Building className="w-4 h-4" /> {allCompanies.length.toLocaleString('es-ES')} empresas</span>
                    <Link href="/tienda" className="flex items-center gap-1.5 hover:underline"><ShoppingBag className="w-4 h-4" /> Tienda online con pago al recibir</Link>
                    <Link href="/alquiler" className="flex items-center gap-1.5 hover:underline"><KeyRound className="w-4 h-4" /> Alquiler de casas y coches</Link>
                </div>
            </div>
            <div className="hidden lg:block">
                <Image src="/illustrations/home/directorio-empresas.svg" alt="" width={300} height={200} priority className="w-full h-auto" />
            </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {featureCards.map((card) => (
                <Link
                    key={card.link.href}
                    href={card.link.href}
                    className="group flex flex-col rounded-lg border border-outline-variant bg-card overflow-hidden transition-shadow hover:shadow-md"
                >
                    <div className="relative bg-[#f7f7f7] dark:bg-white/90 px-6 pt-6 pb-2">
                        <Image
                            src={`/illustrations/home/${card.image}.svg`}
                            alt=""
                            width={240}
                            height={160}
                            className="w-full max-w-[220px] h-auto mx-auto transition-transform duration-200 group-hover:-translate-y-0.5"
                        />
                        {card.badge && (
                            <span className="absolute top-3 left-3 rounded bg-primary text-primary-foreground text-[11px] font-bold uppercase px-1.5 py-0.5">{card.badge}</span>
                        )}
                    </div>
                    <div className="flex flex-col flex-1 p-5">
                        <h2 className="text-base font-bold font-headline">{card.title}</h2>
                        <p className="text-sm text-muted-foreground mt-2 flex-1">{card.description}</p>
                        <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-foreground group-hover:underline">
                            {card.link.text} <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </Link>
            ))}
            {/* Fills the last row next to the 9th card on wide screens. */}
            <div className="sm:col-span-1 lg:col-span-3 rounded-lg bg-[#111111] text-white p-8 flex flex-col justify-center">
                <h2 className="text-2xl font-bold font-headline normal-case">¿Tienes una empresa en Guinea Ecuatorial?</h2>
                <p className="mt-2 text-white/70">Publícala gratis, empieza a recibir clientes y vende tus productos en la Tienda.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <Button asChild><Link href="/list-your-company">Publicar mi empresa</Link></Button>
                    <Button asChild variant="outline" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white"><Link href="/para-empresas">Ver planes</Link></Button>
                </div>
            </div>
        </div>
      </section>

      {/* Tienda Section */}
      {shopProducts.length > 0 && (
        <section className="container mx-auto space-y-4">
            <div className="flex justify-between items-center gap-4">
                 <div>
                    <h2 className="text-xl font-bold font-headline flex items-center gap-2">Tienda Oltinde <span className="text-xs font-semibold rounded bg-primary text-primary-foreground px-1.5 py-0.5">NUEVO</span></h2>
                    <p className="text-sm text-muted-foreground">Productos de empresas locales, con precios en XAF y pago al recibir.</p>
                 </div>
                 <Button asChild variant="outline">
                    <Link href="/tienda">Ver la tienda <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <ProductRail products={shopProducts} />
        </section>
      )}

      {/* Menús del Día Section */}
      {menuDelDiaItems.length > 0 && (
        <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Menús del Día</h2>
                 <Button asChild variant="outline">
                    <Link href="/food">Ver todos <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-4">
                {menuDelDiaItems.map(item => {
                    const company = companyById.get(item.companyId);
                    const city = company?.branches?.[0]?.location?.city;
                    return (
                        <ListingCard
                            key={item.id}
                            href={`/companies/${item.companyId}#menu`}
                            logoSrc={item.image || company?.logo}
                            logoAlt={item.name}
                            name={item.name}
                            subtitle={item.companyName}
                            description={item.description}
                            metaPrimary={`${item.price.toLocaleString('es-ES')} XAF`}
                            metaSecondary={city}
                            imageFit="cover"
                            quickLinks={[{ label: 'Ver Menú', href: `/companies/${item.companyId}#menu` }]}
                        />
                    );
                })}
            </div>
        </section>
      )}

      {/* Farmacias de Guardia Section */}
      {onDutyPharmacies.length > 0 && (
        <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Farmacias de Guardia Hoy</h2>
                 <Button asChild variant="outline">
                    <Link href="/health/pharmacies">Ver todas <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-4">
                {onDutyPharmacies.slice(0, HOMEPAGE_MAX_ITEMS).map(pharmacy => {
                    const mainBranch = pharmacy.branches?.[0];
                    return (
                        <ListingCard
                            key={pharmacy.id}
                            href={`/health/pharmacies/${pharmacy.id}`}
                            logoSrc={pharmacy.image}
                            logoAlt={pharmacy.name}
                            name={pharmacy.name}
                            subtitle={mainBranch?.location?.city}
                            description={pharmacy.description}
                            metaPrimary={mainBranch?.contact?.phone}
                            metaSecondary={mainBranch?.location?.address}
                            tags={['De Guardia Hoy']}
                            quickLinks={[{ label: 'Ver Detalles', href: `/health/pharmacies/${pharmacy.id}` }]}
                        />
                    );
                })}
            </div>
        </section>
      )}

      {/* Why Oltinde Section */}
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
          <div>
            <ul className="space-y-5">
              {whyOltinde.map((item) => (
                <li key={item.title} className="flex items-start gap-4">
                  <span className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0">
                    <item.icon className="w-5 h-5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-bold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col items-center">
            <BusinessDensityMap cities={cityDensity} size={720} />
            <p className="mt-2 text-sm text-muted-foreground">Densidad de empresas verificadas por ciudad</p>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="relative overflow-hidden py-16 bg-primary -mx-4 md:-mx-10">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <Sparkles className="w-8 h-8 text-primary-foreground mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">¿Aún no tiene una cuenta?</h2>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            Regístrese gratis para guardar sus favoritos, publicar su empresa y aprovechar todas las funciones de Oltinde.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Crear una cuenta <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
              <Link href="/list-your-company">Publicar mi empresa</Link>
            </Button>
          </div>
        </div>
      </section>

    </div>
  );
}
