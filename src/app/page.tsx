import { Button } from "@/components/ui/button";
import { getCompanies, getPublishedPosts, getItineraries, getAllMenuItems, getPharmaciesOnDuty } from "@/lib/data";
import { Megaphone, FileText, Building, UserPlus, ArrowRight, TicketPercent, Bot, Briefcase, CalendarDays, Compass, Route, HeartPulse, UtensilsCrossed, Map as MapIcon } from "lucide-react";
import Link from "next/link";
import { GlobalHeaderSearch } from "@/components/shared/GlobalHeaderSearch";
import { MobileCollectionsRow } from "@/components/shared/MobileCollectionsRow";
import type { AnnouncementWithCompany } from "@/app/announcements/page";
import type { OfferWithCompany } from "@/app/offers/page";
import { ListingCard } from "@/components/shared/archive/ListingCard";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { User, Calendar } from "lucide-react";

// Yellowpages.com-style category shortcuts under the hero search: a circular
// bordered icon with the label underneath.
const collections = [
    { href: "/companies", label: "Empresas", icon: Building },
    { href: "/map", label: "Mapa", icon: MapIcon },
    { href: "/procedures", label: "Trámites", icon: FileText },
    { href: "/health", label: "Salud", icon: HeartPulse },
    { href: "/food", label: "Comida", icon: UtensilsCrossed },
    { href: "/jobs", label: "Empleos", icon: Briefcase },
    { href: "/events", label: "Eventos", icon: CalendarDays },
    { href: "/offers", label: "Ofertas", icon: TicketPercent },
    { href: "/announcements", label: "Anuncios", icon: Megaphone },
];

const featureCards = [
    {
        icon: Building,
        title: "Directorio de empresas",
        description: "Busca proveedores, clientes potenciales, cualquier empresa por ubicación o actividad.",
        link: { href: "/companies", text: "COMENZAR A BUSCAR" }
    },
    {
        icon: FileText,
        title: "Guía de Trámites",
        description: "Información detallada sobre procedimientos administrativos, requisitos y costos.",
        link: { href: "/procedures", text: "EXPLORAR GUÍA" }
    },
    {
        icon: Megaphone,
        title: "Anuncios y Ofertas",
        description: "Descubre las últimas noticias, actualizaciones y promociones de las empresas locales.",
        link: { href: "/announcements", text: "VER NOVEDADES" }
    },
    {
        icon: Route,
        title: "Nuevo: Itinerarios de Viaje",
        description: "Descubra lugares turísticos y planes de viaje creados por la comunidad, o comparta el suyo.",
        link: { href: "/itineraries", text: "EXPLORAR ITINERARIOS" }
    },
    {
        icon: UserPlus,
        title: "Alta de tu empresa gratis",
        description: "Añade tu empresa al directorio para llegar a más clientes y gestionar tu perfil online.",
        link: { href: "/list-your-company", text: "PUBLICAR MI EMPRESA" }
    },
    {
        icon: Briefcase,
        title: "Bolsa de Trabajo",
        description: "Encuentra las últimas ofertas de empleo publicadas por empresas en Guinea Ecuatorial.",
        link: { href: "/jobs", text: "VER EMPLEOS" }
    },
    {
        icon: CalendarDays,
        title: "Eventos",
        description: "Descubre ferias, conferencias y actividades organizadas por empresas e instituciones.",
        link: { href: "/events", text: "VER EVENTOS" }
    },
    {
        icon: Compass,
        title: "Lugares Turísticos",
        description: "Explora playas, monumentos, museos y otros lugares que merece la pena visitar.",
        link: { href: "/places", text: "EXPLORAR LUGARES" }
    },
];

const HOMEPAGE_MAX_ITEMS = 6;

export default async function Home() {
  const [allCompanies, allPosts, allItineraries, allMenuItems, onDutyPharmacies] = await Promise.all([
    getCompanies(),
    getPublishedPosts(),
    getItineraries(),
    getAllMenuItems(),
    getPharmaciesOnDuty(),
  ]);

  const companyById = new Map(allCompanies.map(c => [c.id, c]));
  const menuDelDiaItems = allMenuItems
    .filter(item => item.isMenuDelDia && item.available)
    .slice(0, HOMEPAGE_MAX_ITEMS);

  const allAnnouncements: AnnouncementWithCompany[] = [];
  const allOffers: OfferWithCompany[] = [];

  allCompanies.forEach(company => {
    if (company.announcements) {
      company.announcements.forEach(ann => {
        allAnnouncements.push({
          ...ann,
          companyName: company.name,
          companyId: company.id,
          companyCategory: company.category,
          companyLogo: company.logo,
        });
      });
    }
    if (company.offers) {
      company.offers.forEach(offer => {
        allOffers.push({
          ...offer,
          companyName: company.name,
          companyId: company.id,
          companyCategory: company.category,
          companyLogo: company.logo,
        });
      });
    }
  });

  const recentAnnouncements = allAnnouncements
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, HOMEPAGE_MAX_ITEMS);

  const recentOffers = allOffers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, HOMEPAGE_MAX_ITEMS);

  const recentPosts = allPosts.slice(0, HOMEPAGE_MAX_ITEMS);

  // getItineraries() already sorts newest-first, but only the 3 most recent
  // show on the homepage per product decision (vs. the 6-item cap used
  // elsewhere) to keep this brand-new section from crowding the page.
  const recentItineraries = allItineraries.slice(0, 3);


  return (
    <div className="flex flex-col gap-12 md:gap-20 mb-12 md:mb-20">
      
      {/* Hero Search Section */}
      <section className="text-center py-12 md:py-20 -m-4 md:-m-10 bg-[var(--section-muted)]">
        <div className="container mx-auto px-4">
            <h1 className="hidden md:block text-4xl md:text-6xl font-bold font-headline tracking-tight text-foreground/90">
                Todo lo que buscas está <em className="italic">aquí</em>
            </h1>
            <p className="hidden md:block mt-3 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Oltinde: El directorio verificado de Guinea Ecuatorial
            </p>
            <div className="mt-2 md:mt-8 max-w-3xl mx-auto px-4">
            <GlobalHeaderSearch />
            </div>

            {/* Desktop/tablet: soft icon circles, wraps to a few rows */}
            <div className="mt-10 hidden md:flex flex-wrap justify-center gap-x-8 gap-y-6 max-w-4xl mx-auto px-4">
                {collections.map(item => (
                    <Link key={item.href} href={item.href} className="flex flex-col items-center gap-2 group w-20">
                        <span className="flex items-center justify-center w-16 h-16 rounded-md border border-primary bg-primary text-primary-foreground transition-all duration-200 group-hover:bg-primary/90 group-hover:shadow-md group-hover:-translate-y-0.5">
                            <item.icon className="w-7 h-7" strokeWidth={1.75} />
                        </span>
                        <span className="text-xs font-medium text-foreground/80 text-center transition-colors group-hover:text-black">
                            {item.label}
                        </span>
                    </Link>
                ))}
            </div>

            {/* Mobile: Yelp-style icon tiles, one row + a "Más" tile opening a bottom sheet */}
            <MobileCollectionsRow />
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border">
            {featureCards.map((card, index) => (
                <div key={index} className="group relative z-0 bg-background p-6 flex flex-col items-start text-left transition-all duration-200 hover:z-10 hover:shadow-md">
                    <card.icon className="w-8 h-8 text-muted-foreground mb-4 transition-colors group-hover:text-primary" />
                    <h2 className="text-lg font-bold font-headline">{card.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2 flex-grow">{card.description}</p>
                    <Button variant="link" asChild className="mt-6 p-0 text-black h-auto">
                        <Link href={card.link.href}>
                            {card.link.text}
                        </Link>
                    </Button>
                </div>
            ))}
        </div>
      </section>

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

      {/* Recent Offers Section */}
      {recentOffers.length > 0 && (
         <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Ofertas Recientes</h2>
                 <Button asChild variant="outline">
                    <Link href="/offers">Ver todas <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-4">
                {recentOffers.map(offer => (
                  <ListingCard
                      key={offer.id}
                      href={`/offers/${offer.id}`}
                      logoSrc={offer.image || offer.companyLogo}
                      logoAlt={offer.image ? offer.title : `${offer.companyName} logo`}
                      imageFit={offer.image ? 'cover' : 'contain'}
                      name={offer.title}
                      subtitle={offer.companyName}
                      metaPrimary={offer.discount}
                      metaSecondary={`Válido hasta ${new Date(offer.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                      quickLinks={[
                          { label: 'Ver Empresa', href: `/companies/${offer.companyId}` },
                          { label: 'Ver Oferta', href: `/offers/${offer.id}` },
                      ]}
                  />
                ))}
            </div>
        </section>
      )}

      {/* Recent Announcements Section */}
      {recentAnnouncements.length > 0 && (
         <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Anuncios Recientes</h2>
                 <Button asChild variant="outline">
                    <Link href="/announcements">Ver todas <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-4">
                {recentAnnouncements.map(announcement => (
                    <ListingCard
                        key={announcement.id}
                        href={`/announcements/${announcement.id}`}
                        logoSrc={announcement.image || announcement.companyLogo}
                        logoAlt={announcement.image ? announcement.title : `${announcement.companyName} logo`}
                        imageFit={announcement.image ? 'cover' : 'contain'}
                        name={announcement.title}
                        subtitle={announcement.companyName}
                        metaPrimary={new Date(announcement.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        quickLinks={[
                            { label: 'Ver Empresa', href: `/companies/${announcement.companyId}` },
                            { label: 'Ver Anuncio', href: `/announcements/${announcement.id}` },
                        ]}
                    />
                ))}
            </div>
        </section>
      )}

      {/* Recent Itineraries Section */}
      {recentItineraries.length > 0 && (
         <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Itinerarios Recientes</h2>
                 <Button asChild variant="outline">
                    <Link href="/itineraries">Ver todos <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-4">
                {recentItineraries.map(itinerary => {
                  const rating = itinerary.reviews && itinerary.reviews.length > 0
                    ? itinerary.reviews.reduce((acc, r) => acc + r.rating, 0) / itinerary.reviews.length
                    : undefined;
                  return (
                    <ListingCard
                        key={itinerary.id}
                        href={`/itineraries/${itinerary.id}`}
                        logoSrc={itinerary.coverImage}
                        logoAlt={itinerary.title}
                        imageFit="cover"
                        name={itinerary.title}
                        subtitle={`Por ${itinerary.authorName}`}
                        rating={rating}
                        reviewCount={itinerary.reviews?.length || 0}
                        description={itinerary.description}
                        tags={itinerary.theme}
                        metaPrimary={`${itinerary.durationDays} día${itinerary.durationDays === 1 ? '' : 's'}`}
                        metaSecondary={`${itinerary.stops.length} parada${itinerary.stops.length === 1 ? '' : 's'} · ${itinerary.city}`}
                        featured={itinerary.isFeatured}
                        quickLinks={[
                            { label: 'Ver Itinerario', href: `/itineraries/${itinerary.id}` },
                        ]}
                    />
                  );
                })}
            </div>
        </section>
      )}

      {/* Recent Contributions Section */}
      {recentPosts.length > 0 && (
         <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Contribuciones Recientes</h2>
                 <Button asChild variant="outline">
                    <Link href="/contribuciones">Ver todas <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {recentPosts.map((post, index) => (
                    <Card key={post.id} className="flex flex-col overflow-hidden group">
                        <Link href={`/contribuciones/${post.id}`} className="block">
                            <div className="aspect-video overflow-hidden">
                                <Image 
                                    src={post.featuredImage}
                                    alt={post.title}
                                    width={600}
                                    height={338}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    priority={index === 0}
                                />
                            </div>
                        </Link>
                        <CardContent className="p-6 flex flex-col flex-grow">
                             <div className="flex-grow">
                                <h3 className="text-lg font-bold font-headline leading-tight">
                                    <Link href={`/contribuciones/${post.id}`} className="hover:text-black transition-colors">{post.title}</Link>
                                </h3>
                                <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{post.excerpt}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground mt-4 pt-4 border-t">
                                <div className="flex items-center gap-2">
                                    <User className="w-3.5 h-3.5" />
                                    <span>{post.authorName}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" />
                                    <time dateTime={post.createdAt}>
                                        {new Date(post.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
                                    </time>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
      )}

    </div>
  );
}
