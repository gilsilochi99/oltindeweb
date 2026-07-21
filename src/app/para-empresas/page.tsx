
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  CheckCircle2, Star, FileText, TicketPercent, Megaphone,
  Briefcase, CalendarDays, ArrowRight, UserPlus, ClipboardEdit,
  BadgeCheck, Sparkles, X, Search, MapPin, Bell, Building,
} from "lucide-react";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const steps = [
  {
    icon: UserPlus,
    title: "1. Cree su cuenta",
    description: "Regístrese gratis con su correo electrónico en menos de un minuto.",
  },
  {
    icon: ClipboardEdit,
    title: "2. Publique su empresa",
    description: "Complete el formulario con el nombre, categoría, ubicación(es) y datos de contacto de su empresa.",
  },
  {
    icon: BadgeCheck,
    title: "3. Verifique su perfil",
    description: "El equipo de Oltinde revisa la información para otorgarle el sello de \"Verificado\" y dar más confianza a los visitantes.",
  },
  {
    icon: Sparkles,
    title: "4. Active Premium (opcional)",
    description: "Contáctenos cuando quiera desbloquear Documentos, Ofertas, Anuncios, Empleos y Eventos.",
  },
];

const premiumFeatures = [
  { icon: FileText, text: "Documentos: suba catálogos y fichas técnicas descargables" },
  { icon: TicketPercent, text: "Ofertas: publique promociones y descuentos" },
  { icon: Megaphone, text: "Anuncios: comparta noticias y comunicados" },
  { icon: Briefcase, text: "Empleos: publique vacantes en la Bolsa de Trabajo" },
  { icon: CalendarDays, text: "Eventos: organice ferias y conferencias" },
  { icon: Star, text: "Prioridad para ser Empresa Destacada en portada" },
];

const plans = [
  {
    name: "Gratis",
    description: "Para empezar a aparecer en el directorio.",
    cta: { label: "Publicar mi Empresa", href: "/list-your-company" },
    variant: "outline" as const,
    features: [
      { label: "Perfil en el directorio", included: true },
      { label: "Reseñas y valoraciones", included: true },
      { label: "Buscador inteligente", included: true },
      { label: "Panel de control", included: true },
      { label: "Documentos, Ofertas y Anuncios", included: false },
      { label: "Empleos y Eventos", included: false },
      { label: "Prioridad como Destacada", included: false },
    ],
  },
  {
    name: "Premium",
    description: "Para hacer crecer su empresa activamente.",
    cta: { label: "Contactar sobre Premium", href: "/contact" },
    variant: "default" as const,
    highlight: true,
    features: [
      { label: "Perfil en el directorio", included: true },
      { label: "Reseñas y valoraciones", included: true },
      { label: "Buscador inteligente", included: true },
      { label: "Panel de control", included: true },
      { label: "Documentos, Ofertas y Anuncios", included: true },
      { label: "Empleos y Eventos", included: true },
      { label: "Prioridad como Destacada", included: true },
    ],
  },
];

export default function ParaEmpresasPage() {
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
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight">
            De invisible en internet a{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">la primera opción</span>{" "}
            de sus clientes.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Oltinde conecta su empresa con miles de personas que buscan proveedores y servicios en Guinea Ecuatorial cada día. Publicar su perfil es gratis.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/list-your-company">Publicar mi Empresa gratis <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="#planes">Ver planes Premium</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
              <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
                <Building className="w-24 h-24 sm:w-28 sm:h-28 text-primary" />
              </div>
              <div className="absolute -top-2 -left-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Search className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="absolute top-1/3 -right-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md">
                <Star className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div className="absolute -bottom-2 left-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
                <MapPin className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <Eyebrow>Por qué unirse</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Sea la empresa que la gente encuentra primero.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Los clientes no pueden llamarle si no le encuentran. Un perfil completo y verificado en Oltinde le posiciona por delante de la competencia en cada búsqueda por nombre, categoría o ciudad — y aparece automáticamente en nuestro buscador inteligente con IA.
            </p>
          </div>
        </div>
      </section>

      {/* How to start */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Eyebrow>En 4 pasos</Eyebrow>
            <h2 className="text-2xl font-bold font-headline normal-case">Cómo empezar</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map((step) => (
              <div key={step.title} className="bg-card border rounded-lg p-5 transition-shadow hover:shadow-md">
                <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center mb-3">
                  <step.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h3 className="font-semibold text-sm">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Premium spotlight: notifications */}
      <section className="relative overflow-hidden py-14" style={{ backgroundColor: 'hsl(203 100% 31%)' }}>
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="text-white">
            <p className="text-xs font-bold uppercase tracking-widest text-primary inline-block border-b-2 border-primary pb-1 mb-3">Con Premium</p>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Manténgase presente, no solo publicado.</h2>
            <p className="mt-3 max-w-xl text-white/90">
              Sus seguidores reciben una notificación cada vez que publica una oferta, un anuncio o una vacante. Es la diferencia entre un perfil estático y una empresa que siempre está en la mente de sus clientes.
            </p>
            <Button asChild size="lg" className="mt-6">
              <Link href="/contact">Contactar sobre Premium</Link>
            </Button>
          </div>
          <div className="hidden md:flex w-24 h-24 rounded-full bg-white/10 items-center justify-center shrink-0">
            <Bell className="w-12 h-12 text-primary" />
          </div>
        </div>
      </section>

      {/* Plans comparison */}
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
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-xl mx-auto">
          Premium incluye {premiumFeatures.map((f) => f.text.split(':')[0]).join(', ')} — todo desde el mismo panel de control.
        </p>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">¿Listo para empezar?</h2>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            Publique su empresa hoy mismo, es gratis. Cuando esté listo para hacer crecer su presencia, contáctenos para activar Premium.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/list-your-company">Publicar mi Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
              <Link href="/contact">Contactar sobre Premium</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
