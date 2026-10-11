import type { Metadata } from 'next';

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getPublicStats, getShowcaseCompanies } from "@/lib/public-stats";
import { StatsStrip, CompanyShowcase } from "@/components/marketing/StatsStrip";
import { EmpresasHeroActions, MyCompanyShortcuts, HideWhenAllPremium, EmpresasClosingCta } from "@/components/marketing/AudienceBlocks";
import {
  CheckCircle2, Star, FileText, TicketPercent, Megaphone,
  Briefcase, CalendarDays, ArrowRight, UserPlus, ClipboardEdit,
  BadgeCheck, Sparkles, X, Search, MapPin, Bell, Building, Plus,
  UtensilsCrossed, ShoppingBag, Truck, BarChart3, Inbox, KeyRound,
  MessageSquare, Bot, Car, Home, Tent, CalendarCheck, User,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Para Empresas: Plan Gratis y Premium",
  description: "Haga crecer su empresa con Oltinde: perfil verificado en el directorio, tienda online, alquileres de casas, coches, equipos y espacios, empleos, eventos, menú y pedidos. Compare los planes Gratis y Premium.",
  alternates: { canonical: '/para-empresas' },
};

export const revalidate = 3600;

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

// Everything a company can add. Premium tools are opened from the company's
// panel, so they link to /dashboard (where the owner picks the company).
const publish = [
  {
    icon: Building,
    title: "Perfil de empresa",
    description: "Nombre, categoría, logo, fotos, horarios, una o varias ubicaciones con mapa, teléfono, WhatsApp y web.",
    href: "/dashboard/add-company",
    cta: "Registrar mi empresa",
    premium: false,
  },
  {
    icon: BadgeCheck,
    title: "Sello de verificada",
    description: "Envíe sus documentos y el equipo de Oltinde comprueba su empresa. El sello da confianza a quien le visita.",
    href: "/dashboard",
    cta: "Solicitar verificación",
    premium: false,
  },
  {
    icon: MessageSquare,
    title: "Respuestas a reseñas",
    description: "Lea lo que opinan sus clientes y respóndales en público: agradezca, aclare y demuestre que le importa.",
    href: "/dashboard",
    cta: "Ir a mi panel",
    premium: false,
  },
  {
    icon: ShoppingBag,
    title: "Productos en la Tienda",
    description: "Catálogo con precios en XAF, fotos, tallas y colores, stock, cupones y pedidos con avisos al cliente.",
    href: "/dashboard",
    cta: "Añadir productos",
    premium: true,
  },
  {
    icon: KeyRound,
    title: "Alquileres",
    description: "Casas, locales, coches, sillas, carpas, sonido, generadores o salones. Por horas, días o meses, con calendario.",
    href: "/dashboard",
    cta: "Publicar un alquiler",
    premium: true,
  },
  {
    icon: UtensilsCrossed,
    title: "Menú y pedidos",
    description: "Para restaurantes: publique sus platos y bebidas y reciba pedidos para recoger o a domicilio.",
    href: "/dashboard",
    cta: "Crear mi menú",
    premium: true,
  },
  {
    icon: Briefcase,
    title: "Empleos",
    description: "Publique vacantes con fecha límite. Al vencer, la oferta se cierra sola y deja de recibir candidaturas.",
    href: "/dashboard",
    cta: "Publicar un empleo",
    premium: true,
  },
  {
    icon: TicketPercent,
    title: "Ofertas y anuncios",
    description: "Promociones, descuentos, noticias y comunicados. Sus seguidores reciben un aviso, también por correo.",
    href: "/dashboard",
    cta: "Publicar una oferta",
    premium: true,
  },
  {
    icon: CalendarDays,
    title: "Eventos y documentos",
    description: "Ferias, presentaciones y conferencias en el calendario de Oltinde, y catálogos o fichas descargables.",
    href: "/dashboard",
    cta: "Crear un evento",
    premium: true,
  },
];

const steps = [
  {
    icon: UserPlus,
    title: "1. Cree su cuenta",
    description: "Regístrese gratis con su correo o con Google en menos de un minuto.",
  },
  {
    icon: ClipboardEdit,
    title: "2. Registre su empresa",
    description: "Nombre, categoría, ubicaciones y contacto. Aparece en el directorio y en el Asistente.",
  },
  {
    icon: BadgeCheck,
    title: "3. Verifíquela",
    description: "Envíe sus documentos y reciba el sello de «Verificada» para dar más confianza.",
  },
  {
    icon: Sparkles,
    title: "4. Active Premium",
    description: "Cuando quiera vender, alquilar, contratar o anunciar, contáctenos y lo activamos.",
  },
];

const plans = [
  {
    name: "Gratis",
    description: "Para aparecer en el directorio y en el Asistente.",
    cta: { label: "Registrar mi empresa", href: "/dashboard/add-company" },
    variant: "outline" as const,
    features: [
      { label: "Perfil en el directorio", included: true },
      { label: "Sello de verificada", included: true },
      { label: "Reseñas y respuestas", included: true },
      { label: "Aparece en el Asistente", included: true },
      { label: "Panel de control", included: true },
      { label: "Tienda Online (venta de productos)", included: false },
      { label: "Alquileres (casas, coches, equipos y espacios)", included: false },
      { label: "Menú de restaurante y pedidos", included: false },
      { label: "Empleos y eventos", included: false },
      { label: "Ofertas, anuncios y documentos", included: false },
      { label: "Avisos a sus seguidores", included: false },
      { label: "Prioridad como destacada", included: false },
    ],
  },
  {
    name: "Premium",
    description: "Para vender, alquilar, contratar y anunciarse.",
    cta: { label: "Contactar sobre Premium", href: "/contact" },
    variant: "default" as const,
    highlight: true,
    features: [
      { label: "Perfil en el directorio", included: true },
      { label: "Sello de verificada", included: true },
      { label: "Reseñas y respuestas", included: true },
      { label: "Aparece en el Asistente", included: true },
      { label: "Panel de control", included: true },
      { label: "Tienda Online (venta de productos)", included: true },
      { label: "Alquileres (casas, coches, equipos y espacios)", included: true },
      { label: "Menú de restaurante y pedidos", included: true },
      { label: "Empleos y eventos", included: true },
      { label: "Ofertas, anuncios y documentos", included: true },
      { label: "Avisos a sus seguidores", included: true },
      { label: "Prioridad como destacada", included: true },
    ],
  },
];

export default async function ParaEmpresasPage() {
  const [stats, showcase] = await Promise.all([getPublicStats(), getShowcaseCompanies()]);
  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Para Empresas</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight normal-case">
            De invisible en internet a{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">la primera opción</span>{" "}
            de sus clientes.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Aparezca cuando le buscan en Guinea Ecuatorial y, cuando quiera, venda, alquile, contrate y anuncie desde el mismo panel. Registrar su empresa es gratis.
          </p>
          <EmpresasHeroActions />
        </div>
      </section>

      <MyCompanyShortcuts />

      <StatsStrip items={[
        { value: stats.companies, label: "empresas activas", href: "/companies" },
        { value: stats.verifiedCompanies, label: "empresas verificadas", href: "/companies" },
        { value: stats.cities, label: "ciudades" },
        { value: stats.products, label: "productos en la Tienda", href: "/tienda" },
        { value: stats.rentals, label: "alquileres publicados", href: "/alquiler" },
      ]} />

      {/* What a company can publish */}
      <section id="publicar" className="container mx-auto px-4 scroll-mt-24">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <Eyebrow>Todo desde un solo panel</Eyebrow>
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Lo que puede publicar con su empresa</h2>
          <p className="mt-3 text-muted-foreground">Todo esto está en su <Link href="/dashboard" className="underline">Panel de control</Link>, en la tarjeta de su empresa, y en la app, en Cuenta › Mi negocio.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {publish.map(item => (
            <Link key={item.title} href={item.href}
              className="group relative flex flex-col gap-3 rounded-lg border border-outline-variant bg-card p-5 hover:shadow-md transition-shadow">
              <Badge variant={item.premium ? "default" : "outline"} className="absolute top-4 right-4">
                {item.premium ? "Premium" : "Gratis"}
              </Badge>
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
        <p className="text-center text-xs text-muted-foreground mt-6 max-w-xl mx-auto">
          Algunas herramientas Premium dependen de la categoría de su empresa (por ejemplo, el menú es para restaurantes).
        </p>
      </section>

      {/* Spotlight: online shop */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <Eyebrow>Tienda Online</Eyebrow>
              <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Venda en todo el país sin montar una web.</h2>
              <p className="mt-4 text-muted-foreground max-w-lg">
                Publique su catálogo y reciba pedidos de clientes de todo el país. Sin pasarela de pago: el cliente paga al recibir o por Muni Dinero.
              </p>
              <ul className="mt-5 grid sm:grid-cols-2 gap-3 text-sm max-w-lg">
                <li className="flex items-start gap-2"><ShoppingBag className="w-5 h-5 shrink-0 text-black" />Variantes, stock y ofertas</li>
                <li className="flex items-start gap-2"><Inbox className="w-5 h-5 shrink-0 text-black" />Avisos al cliente en cada paso</li>
                <li className="flex items-start gap-2"><Truck className="w-5 h-5 shrink-0 text-black" />Recogida o envío por ciudad</li>
                <li className="flex items-start gap-2"><BarChart3 className="w-5 h-5 shrink-0 text-black" />Cupones y estadísticas</li>
              </ul>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/dashboard"><Plus className="mr-2 w-4 h-4" />Añadir productos</Link>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/guia-de-usuario#vender">Cómo vender</Link>
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-sm aspect-square mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
                <ShoppingBag className="w-24 h-24 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><Truck className="w-5 h-5 text-primary-foreground" /></div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md"><TicketPercent className="w-5 h-5 text-secondary-foreground" /></div>
              <div className="absolute -bottom-2 right-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><BarChart3 className="w-5 h-5 text-primary-foreground" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight: rentals */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative w-full max-w-sm aspect-square mx-auto md:mx-0 order-2 md:order-1">
            <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
              <KeyRound className="w-24 h-24 text-primary" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -left-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><Home className="w-5 h-5 text-primary-foreground" /></div>
            <div className="absolute top-1/3 -right-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md"><Car className="w-5 h-5 text-secondary-foreground" /></div>
            <div className="absolute -bottom-2 left-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md"><Tent className="w-5 h-5 text-primary-foreground" /></div>
          </div>
          <div className="order-1 md:order-2">
            <Eyebrow>Alquileres</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Inmobiliarias, rent-a-car y alquiler para eventos.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Anuncie casas, locales, coches, sillas, carpas, sonido o salones. Precio por horas, días o meses, varias unidades del mismo artículo, entrega a domicilio y fianza. Usted acepta o rechaza cada solicitud y ve qué anuncios funcionan mejor.
            </p>
            <ul className="mt-5 space-y-2 text-sm">
              <li className="flex items-start gap-2"><CalendarCheck className="w-5 h-5 shrink-0 text-black" />Calendario de disponibilidad y bloqueos</li>
              <li className="flex items-start gap-2"><BarChart3 className="w-5 h-5 shrink-0 text-black" />Visitas, solicitudes y estadísticas por anuncio</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/dashboard"><Plus className="mr-2 w-4 h-4" />Publicar un alquiler</Link>
              </Button>
              <Button asChild variant="outline" className="bg-transparent">
                <Link href="/alquiler">Ver alquileres</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Spotlight: found by the Assistant + followers */}
      <section className="relative overflow-hidden py-14" style={{ backgroundColor: 'hsl(203 100% 31%)' }}>
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-white">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary inline-block border-b-2 border-primary pb-1 mb-3">Le encuentran</p>
              <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Cuando alguien pregunta, aparece usted.</h2>
              <p className="mt-3 text-white/90 max-w-lg">
                Quien escribe «abogados en Bata» o «alquiler de sillas en Malabo» en el Asistente ve empresas reales de Oltinde. Un perfil completo y verificado aparece antes.
              </p>
              <div className="mt-5 flex items-center gap-3 text-sm text-white/90"><Search className="w-5 h-5 text-primary shrink-0" />Por nombre, categoría o ciudad</div>
              <div className="mt-2 flex items-center gap-3 text-sm text-white/90"><Bot className="w-5 h-5 text-primary shrink-0" />En el buscador y en el Asistente</div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary inline-block border-b-2 border-primary pb-1 mb-3">Con Premium</p>
              <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Y no le olvidan.</h2>
              <p className="mt-3 text-white/90 max-w-lg">
                Sus seguidores reciben un aviso cada vez que publica una oferta, un anuncio o una vacante. Es la diferencia entre un perfil quieto y una empresa que siempre está presente.
              </p>
              <div className="mt-5 flex items-center gap-3 text-sm text-white/90"><Bell className="w-5 h-5 text-primary shrink-0" />En la app y por correo</div>
              <div className="mt-2 flex items-center gap-3 text-sm text-white/90"><Star className="w-5 h-5 text-primary shrink-0" />Prioridad como empresa destacada</div>
            </div>
          </div>
        </div>
      </section>

      <CompanyShowcase companies={showcase} />

      {/* How to start */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Eyebrow>En 4 pasos</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">Cómo empezar</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-start gap-3 p-5 rounded-lg border bg-card">
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Plans comparison (hidden when every company of the viewer is Premium) */}
      <HideWhenAllPremium>
      <section id="planes" className="container mx-auto px-4 scroll-mt-24">
        <div className="text-center mb-8">
          <Eyebrow>Sin sorpresas</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">Gratis vs. Premium</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative border-2 border-primary rounded-xl p-6 md:p-8 bg-primary/5"
                  : "relative border rounded-xl p-6 md:p-8 bg-card"
              }
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-6">Recomendado</Badge>
              )}
              <h3 className="text-xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              <ul className="mt-6 space-y-3">
                {plan.features.map((f) => (
                  <li key={f.label} className="flex items-center gap-2.5 text-sm">
                    {f.included ? (
                      <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
                    ) : (
                      <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                    )}
                    <span className={f.included ? "" : "text-muted-foreground/50"}>{f.label}</span>
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" variant={plan.variant} className="w-full mt-8">
                <Link href={plan.cta.href}>{plan.cta.label}</Link>
              </Button>
            </div>
          ))}
        </div>
      </section>
      </HideWhenAllPremium>

      {/* No company? */}
      <section className="container mx-auto px-4">
        <Link href="/para-ti"
          className="group max-w-3xl mx-auto flex flex-col sm:flex-row items-start sm:items-center gap-4 rounded-lg border border-outline-variant bg-card p-5 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">¿Trabaja por su cuenta o no tiene empresa?</h3>
            <p className="text-sm text-muted-foreground">Con una cuenta gratis puede alquilar sus cosas, publicar su perfil profesional y mucho más.</p>
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-semibold group-hover:underline whitespace-nowrap">Ver Para ti <ArrowRight className="w-4 h-4" /></span>
        </Link>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <MapPin className="w-8 h-8 text-primary-foreground mx-auto mb-3" />
          <EmpresasClosingCta />
        </div>
      </section>
    </div>
  );
}
