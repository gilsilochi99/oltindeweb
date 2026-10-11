import type { Metadata } from 'next';

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPublicStats } from "@/lib/public-stats";
import { getRentalsHome } from "@/lib/rentals/public";
import { StatsStrip } from "@/components/marketing/StatsStrip";
import { RentalRail } from "@/components/rentals/RentalCard";
import { ParaTiHeroActions, ParaTiClosingCta } from "@/components/marketing/AudienceBlocks";
import {
  Bot, Route, Star, Bell, MessageSquare, User, ArrowRight, MapPin, ShoppingBag, Sparkles,
  GraduationCap, KeyRound, Plus, Newspaper, Armchair, Tent, Zap, Landmark, Briefcase,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Para Ti",
  description: "Lo que puede hacer en Oltinde sin tener una empresa: alquilar sus cosas, publicar su perfil profesional, escribir guías, crear itinerarios, comprar, reservar y preguntar al Asistente.",
  alternates: { canonical: '/para-ti' },
};

export const revalidate = 3600;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

// Things anyone with a free account can publish — no company needed.
const publish = [
  {
    icon: KeyRound,
    title: "Alquile sus cosas",
    description: "Sillas, una carpa, un generador, herramientas, su coche, un piso o un salón. Publique gratis, elija precio por hora, día o mes y reciba solicitudes de reserva.",
    href: "/dashboard/alquileres/new",
    cta: "Publicar un alquiler",
  },
  {
    icon: GraduationCap,
    title: "Su perfil profesional",
    description: "¿Es electricista, abogada, diseñador o profesora? Publique su perfil con sus servicios y su contacto para que los clientes le encuentren.",
    href: "/dashboard/professional",
    cta: "Crear mi perfil",
  },
  {
    icon: Newspaper,
    title: "Contribuciones",
    description: "Escriba guías, consejos o noticias útiles para la comunidad. Su artículo se publica con su nombre después de una revisión.",
    href: "/dashboard/contribuciones/new",
    cta: "Escribir un artículo",
  },
  {
    icon: Route,
    title: "Itinerarios de viaje",
    description: "Cree su ruta parada a parada, con mapa, y compártala con quien quiera.",
    href: "/dashboard/itineraries/new",
    cta: "Crear un itinerario",
  },
  {
    icon: Landmark,
    title: "Sugerir un lugar",
    description: "¿Conoce una playa, un monumento o un rincón que merece la pena? Sugiéralo y lo añadimos a Lugares turísticos.",
    href: "/places/suggest",
    cta: "Sugerir un lugar",
  },
  {
    icon: MessageSquare,
    title: "Reseñas",
    description: "Valore empresas, trámites, productos y alquileres para ayudar a los demás a elegir bien.",
    href: "/companies",
    cta: "Buscar una empresa",
  },
];

// Things to use.
const features = [
  {
    icon: ShoppingBag,
    title: "Tienda Online",
    description: "Compre a empresas locales con precios en XAF y pague al recibir. Siga sus pedidos en Mis compras.",
    href: "/tienda",
  },
  {
    icon: KeyRound,
    title: "Alquileres",
    description: "Casas, coches, sillas, carpas, sonido, generadores y salones, de empresas y particulares. Reserve por horas, días o meses.",
    href: "/alquiler",
  },
  {
    icon: Briefcase,
    title: "Empleo",
    description: "Ofertas de trabajo de empresas de todo el país, con su fecha límite y cómo presentarse.",
    href: "/jobs",
  },
  {
    icon: Star,
    title: "Favoritos",
    description: "Guarde empresas, empleos, eventos, lugares, itinerarios y productos para encontrarlos en un solo lugar.",
    href: "/favorites",
  },
  {
    icon: Bell,
    title: "Avisos",
    description: "Siga empresas o categorías y reciba avisos de ofertas, anuncios y vacantes, también por correo.",
    href: "/notifications",
  },
  {
    icon: User,
    title: "Su cuenta",
    description: "Sus datos, sus suscripciones y sus preferencias de avisos en un solo panel.",
    href: "/profile",
  },
];

export default async function ParaTiPage() {
  const [stats, rentals] = await Promise.all([getPublicStats(), getRentalsHome()]);
  // Newest of each kind, so the rail shows the range (not ten flats).
  const recentRentals = [...rentals.items, ...rentals.spaces, ...rentals.vehicles, ...rentals.properties]
    .filter((l, i, all) => all.findIndex(x => x.id === l.id) === i)
    .slice(0, 10);
  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Para Ti</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight normal-case">
            No necesita una empresa para{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">sacarle partido</span>{" "}
            a Oltinde.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Encuentre lo que busca, compre, reserve y, además, alquile sus cosas, publique su perfil profesional o comparta lo que sabe. Todo gratis.
          </p>
          <ParaTiHeroActions />
        </div>
      </section>

      <StatsStrip items={[
        { value: stats.companies, label: "empresas", href: "/companies" },
        { value: stats.rentals, label: "alquileres", href: "/alquiler" },
        { value: stats.products, label: "productos", href: "/tienda" },
        { value: stats.professionals, label: "profesionales", href: "/professionals" },
        { value: stats.itineraries, label: "itinerarios", href: "/itineraries" },
      ]} />

      {/* Publish without a company */}
      <section id="publicar" className="container mx-auto px-4 scroll-mt-24">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <Eyebrow>Sin empresa, también puede publicar</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Lo que puede añadir con su cuenta</h2>
          <p className="mt-3 text-muted-foreground">Todo esto está en su <Link href="/dashboard" className="underline">Panel de control</Link>, en «Publicar algo nuevo», y en la app, en Cuenta.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {publish.map(item => (
            <Link key={item.title} href={item.href}
              className="group flex flex-col gap-3 rounded-lg border border-outline-variant bg-card p-5 hover:shadow-md transition-shadow">
              <div className="relative w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary-foreground" />
                <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-black text-white flex items-center justify-center ring-2 ring-card"><Plus className="w-3 h-3" /></span>
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
              <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline">{item.cta} <ArrowRight className="w-4 h-4" /></span>
            </Link>
          ))}
        </div>
      </section>

      {/* Spotlight: rent your things */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <Eyebrow>Nuevo: alquiler entre particulares</Eyebrow>
              <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Lo que tiene guardado también puede darle dinero.</h2>
              <p className="mt-4 text-muted-foreground max-w-lg">
                Publique las sillas de la última boda, su equipo de sonido, el generador o la hormigonera. Usted pone el precio, por horas, días o meses, y acepta o rechaza cada solicitud. Su teléfono solo lo ve quien tenga una reserva aceptada.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/dashboard/alquileres/new"><Plus className="mr-2 w-4 h-4" />Publicar un alquiler</Link>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/alquiler">Ver alquileres</Link>
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-sm aspect-square mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
                <KeyRound className="w-24 h-24 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><Armchair className="w-5 h-5 text-primary-foreground" /></div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md"><Tent className="w-5 h-5 text-secondary-foreground" /></div>
              <div className="absolute -bottom-2 right-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><Zap className="w-5 h-5 text-primary-foreground" /></div>
            </div>
          </div>
        </div>
      </section>

      {recentRentals.length >= 3 ? (
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <RentalRail title="Recién publicado en Alquileres" href="/alquiler" items={recentRentals} />
          </div>
        </div>
      ) : null}

      {/* Spotlight: assistant */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative w-full max-w-sm aspect-square mx-auto md:mx-0 order-2 md:order-1">
            <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
              <Bot className="w-24 h-24 text-primary" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -left-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><ShoppingBag className="w-5 h-5 text-primary-foreground" /></div>
            <div className="absolute top-1/3 -right-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md"><Sparkles className="w-5 h-5 text-secondary-foreground" /></div>
            <div className="absolute -bottom-2 left-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><MapPin className="w-5 h-5 text-primary-foreground" /></div>
          </div>
          <div className="order-1 md:order-2">
            <Eyebrow>Asistente Oltinde</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Pregunte con sus propias palabras.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Escriba «abogados en Bata», «farmacias de guardia en Malabo», «alquiler de sillas» o «¿cómo publico un alquiler?» y el Asistente le muestra empresas, trámites, productos y alquileres reales de Oltinde.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Preguntar al Asistente <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Eyebrow>Y mucho más</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">Para encontrar, comprar y reservar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex flex-col items-start gap-3 p-5 rounded-lg border border-transparent hover:border-outline-variant hover:bg-card hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <Sparkles className="w-8 h-8 text-primary-foreground mx-auto mb-3" />
          <ParaTiClosingCta />
        </div>
      </section>
    </div>
  );
}
