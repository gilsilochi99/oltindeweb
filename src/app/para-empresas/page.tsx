
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, Star, FileText, TicketPercent, Megaphone,
  Briefcase, CalendarDays, ArrowRight, UserPlus, ClipboardEdit,
  BadgeCheck, Sparkles, X, Search, MapPin, ShieldCheck, Bot, Bell,
} from "lucide-react";

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

const featureGrid = [
  {
    icon: ShieldCheck,
    title: "Perfil Verificado",
    description: "El sello \"Verificado\" confirma que su empresa es real y genera confianza inmediata en los visitantes.",
  },
  {
    icon: Star,
    title: "Reseñas y Valoraciones",
    description: "Sus clientes dejan calificaciones y comentarios públicos que refuerzan su reputación en el directorio.",
    href: "#gratis",
  },
  {
    icon: Bot,
    title: "Buscador Inteligente",
    description: "Nuestro asesor con IA recomienda su empresa cuando alguien busca lo que usted ofrece.",
    href: "/advisor",
  },
  {
    icon: TicketPercent,
    title: "Herramientas Premium",
    description: "Desbloquee Documentos, Ofertas, Anuncios, Empleos y Eventos para su perfil.",
    href: "#premium",
  },
];

const freeFeatures = [
  "Perfil público de su empresa en el directorio",
  "Aparece en las búsquedas por nombre, categoría y ciudad",
  "Datos de contacto, ubicación(es) y horario de atención",
  "Recibe reseñas y valoraciones de clientes",
  "Aparece en el buscador inteligente del sitio",
  "Panel de control para editar su perfil cuando quiera",
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
      { label: "Perfil y directorio", included: true },
      { label: "Reseñas y valoraciones", included: true },
      { label: "Buscador inteligente", included: true },
      { label: "Documentos", included: false },
      { label: "Ofertas", included: false },
      { label: "Anuncios", included: false },
      { label: "Empleos", included: false },
      { label: "Eventos", included: false },
    ],
  },
  {
    name: "Premium",
    description: "Para hacer crecer su empresa activamente.",
    cta: { label: "Contactar sobre Premium", href: "/contact" },
    variant: "default" as const,
    highlight: true,
    features: [
      { label: "Perfil y directorio", included: true },
      { label: "Reseñas y valoraciones", included: true },
      { label: "Buscador inteligente", included: true },
      { label: "Documentos", included: true },
      { label: "Ofertas", included: true },
      { label: "Anuncios", included: true },
      { label: "Empleos", included: true },
      { label: "Eventos", included: true },
    ],
  },
];

export default function ParaEmpresasPage() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="py-12 md:py-20" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-4">Para Empresas</Badge>
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
            <Button asChild size="lg" variant="outline">
              <Link href="#premium">Ver planes Premium</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Be found first */}
      <section className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 shrink-0">
              <div className="absolute inset-0 rounded-full overflow-hidden border-4 border-white shadow-lg">
                <Image src="https://picsum.photos/seed/oltinde-para-empresas/500/500" alt="Emprendedor gestionando su negocio" fill className="object-cover" />
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
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Sea la empresa que la gente encuentra primero.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Los clientes no pueden llamarle si no le encuentran. Un perfil completo y verificado en Oltinde le posiciona por delante de la competencia en cada búsqueda por nombre, categoría o ciudad.
            </p>
            <Button asChild className="mt-6">
              <Link href="/list-your-company">Publicar mi Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureGrid.map((feature) => (
            <div key={feature.title} className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
              {feature.href && (
                <Link href={feature.href} className="text-xs font-bold text-secondary underline">Saber más</Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* How to start */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-headline normal-case mb-6">Cómo empezar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => (
            <div key={step.title} className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center">
                <step.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Colored banner: notifications */}
      <section className="py-14" style={{ backgroundColor: 'hsl(203 100% 31%)' }}>
        <div className="container mx-auto px-4 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div className="text-white">
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Manténgase presente, no solo publicado.</h2>
            <p className="mt-3 max-w-xl text-white/90">
              Con Premium, sus seguidores reciben una notificación cada vez que publica una oferta, un anuncio o una vacante. Es la diferencia entre un perfil estático y una empresa que siempre está en la mente de sus clientes.
            </p>
            <Button asChild size="lg" variant="secondary" className="mt-6 bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="/contact">Contactar sobre Premium</Link>
            </Button>
          </div>
          <div className="hidden md:flex w-24 h-24 rounded-full bg-white/10 items-center justify-center shrink-0">
            <Bell className="w-12 h-12 text-primary" />
          </div>
        </div>
      </section>

      {/* Premium checklist with photo */}
      <section id="premium" className="container mx-auto px-4 scroll-mt-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden order-2 lg:order-1">
            <Image src="https://picsum.photos/seed/oltinde-premium/700/525" alt="Propietario de negocio revisando su perfil" fill className="object-cover" />
          </div>
          <div className="order-1 lg:order-2">
            <Badge className="mb-3">Premium</Badge>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Haga crecer su empresa con herramientas Premium.</h2>
            <p className="mt-3 text-muted-foreground max-w-lg">
              Cuando esté listo para ir más allá del perfil gratuito, active Premium y desbloquee:
            </p>
            <ul className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {premiumFeatures.map((f) => (
                <li key={f.text} className="flex items-start gap-2.5 text-sm">
                  <f.icon className="w-4 h-4 text-black shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{f.text}</span>
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6">
              <Link href="/contact">Contactar sobre Premium <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Free features */}
      <section id="gratis" className="container mx-auto px-4 scroll-mt-24">
        <h2 className="text-2xl font-bold font-headline normal-case mb-4">Todo esto ya está incluido, gratis</h2>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl">
          {freeFeatures.map((feature) => (
            <li key={feature} className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-black shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Plans */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-headline normal-case mb-8 text-center">Gratis vs. Premium</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={
                plan.highlight
                  ? "relative border-2 border-primary rounded-xl p-6 md:p-8 bg-primary/5"
                  : "relative border rounded-xl p-6 md:p-8 bg-white"
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

      {/* Final CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
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
