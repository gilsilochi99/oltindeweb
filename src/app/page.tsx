import { Button } from "@/components/ui/button";
import { CompanyListItem } from "@/components/shared/CompanyListItem";
import { getCompanies, getPublishedPosts } from "@/lib/data";
import { Megaphone, FileText, Building, UserPlus, ArrowRight, TicketPercent, Bot } from "lucide-react";
import Link from "next/link";
import { GlobalHeaderSearch } from "@/components/shared/GlobalHeaderSearch";
import type { AnnouncementWithCompany } from "@/app/announcements/page";
import type { OfferWithCompany } from "@/app/offers/page";
import { AnnouncementCard } from "@/components/shared/AnnouncementCard";
import { OfferCard } from "@/components/shared/OfferCard";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { User, Calendar } from "lucide-react";

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
        icon: UserPlus,
        title: "Alta de tu empresa gratis",
        description: "Añade tu empresa al directorio para llegar a más clientes y gestionar tu perfil online.",
        link: { href: "/list-your-company", text: "PUBLICAR MI EMPRESA" }
    },
];

export default async function Home() {
  const allCompanies = await getCompanies();
  const allPosts = await getPublishedPosts();
  const featuredCompanies = allCompanies.filter(company => company.isFeatured).slice(0, 4);

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
    .slice(0, 3);
  
  const recentOffers = allOffers
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);

  const recentPosts = allPosts.slice(0, 3);


  return (
    <div className="flex flex-col gap-12 md:gap-20 mb-12 md:mb-20">
      
      {/* Hero Search Section */}
      <section className="text-center py-12 md:py-20 -m-4 md:-m-10" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-headline tracking-tight text-foreground/90">
                La mayor <span className="font-bold">Base de datos</span> verificada
                <br />
                de Guinea Ecuatorial
            </h1>
            <div className="mt-8 max-w-3xl mx-auto px-4">
            <GlobalHeaderSearch />
            </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-border border">
            {featureCards.map((card, index) => (
                <div key={index} className="bg-background p-6 flex flex-col items-start text-left">
                    <card.icon className="w-8 h-8 text-muted-foreground mb-4" />
                    <h2 className="text-lg font-bold font-headline">{card.title}</h2>
                    <p className="text-sm text-muted-foreground mt-2 flex-grow">{card.description}</p>
                    <Button variant="link" asChild className="mt-6 p-0 text-primary h-auto">
                        <Link href={card.link.href}>
                            {card.link.text}
                        </Link>
                    </Button>
                </div>
            ))}
        </div>
      </section>

      {/* Featured Companies Section */}
      {featuredCompanies.length > 0 && (
        <section className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold font-headline">Empresas Destacadas</h2>
                 <Button asChild variant="outline">
                    <Link href="/companies">Ver todas <ArrowRight className="ml-2 w-4 h-4"/></Link>
                 </Button>
            </div>
            <div className="space-y-6">
                {featuredCompanies.map(company => (
                    <CompanyListItem key={company.id} company={company} />
                ))}
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
            <div className="grid lg:grid-cols-3 gap-6">
                {recentOffers.map(offer => (
                  <Card key={offer.id} className="flex flex-col">
                    <OfferCard offer={offer} />
                  </Card>
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
            <div className="grid lg:grid-cols-3 gap-6">
                {recentAnnouncements.map(announcement => (
                    <Card key={announcement.id} className="flex flex-col">
                      <AnnouncementCard announcement={announcement} />
                    </Card>
                ))}
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
                                    <Link href={`/contribuciones/${post.id}`} className="hover:text-primary transition-colors">{post.title}</Link>
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
