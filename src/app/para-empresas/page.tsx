
import { getCompanies, getInstitutions, getProcedures, getUniqueCategories } from "@/lib/data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2, Star, FileText, TicketPercent, Megaphone,
  Briefcase, CalendarDays, Sparkles, ArrowRight, UserPlus, ClipboardEdit,
  BadgeCheck, X, Search, MapPin, ShieldCheck, Bot, Bell, Building,
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
    href: "#faq",
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
    title: "Empresa Destacada",
    description: "Las cuentas Premium con perfil completo tienen prioridad para aparecer en la página principal.",
    href: "#destacada",
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

const comparisonRows = [
  { label: "Perfil y directorio", free: true, premium: true },
  { label: "Reseñas y valoraciones", free: true, premium: true },
  { label: "Buscador inteligente", free: true, premium: true },
  { label: "Documentos", free: false, premium: true },
  { label: "Ofertas", free: false, premium: true },
  { label: "Anuncios", free: false, premium: true },
  { label: "Empleos", free: false, premium: true },
  { label: "Eventos", free: false, premium: true },
  { label: "Prioridad para Empresa Destacada", free: false, premium: true },
];

const faqs = [
  {
    question: "¿Cuánto cuesta publicar mi empresa?",
    answer: "Publicar el perfil de su empresa en el directorio es completamente gratis, sin límite de tiempo.",
  },
  {
    question: "¿Qué incluye una cuenta Premium?",
    answer: "Premium desbloquea la publicación de Documentos, Ofertas, Anuncios, Empleos y Eventos para su empresa. El resto del perfil (nombre, descripción, ubicaciones, contacto, reseñas) ya está incluido en el plan gratuito.",
  },
  {
    question: "¿Cómo actualizo mi cuenta a Premium?",
    answer: "Por ahora la activación de Premium se gestiona directamente con nuestro equipo. Escríbanos desde la página de Contacto y le ayudaremos.",
  },
  {
    question: "Mi empresa ya aparece en Oltinde, pero no la administro. ¿Qué hago?",
    answer: "Algunas empresas fueron añadidas por nuestro equipo a partir de fuentes públicas. Si es el propietario, visite el perfil de su empresa y use la opción \"Reclamar esta empresa\" para solicitar el acceso.",
  },
  {
    question: "¿Qué significa el sello \"Verificado\"?",
    answer: "Indica que el equipo de Oltinde confirmó que la información de la empresa es exacta y que quien la administra es su propietario legítimo, generando más confianza entre los visitantes.",
  },
];

export default async function ParaEmpresasPage() {
  const [companies, institutions, procedures, categories] = await Promise.all([
    getCompanies(),
    getInstitutions(),
    getProcedures(),
    getUniqueCategories(),
  ]);

  const stats = [
    { value: companies.length, label: "Empresas listadas" },
    { value: institutions.length, label: "Instituciones" },
    { value: procedures.length, label: "Trámites guiados" },
    { value: categories.length, label: "Categorías" },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="py-12 md:py-20" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="container mx-auto px-4 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <Badge variant="secondary" className="mb-4">Para Empresas</Badge>
            <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 leading-tight">
              De invisible en internet a{" "}
              <span className="bg-primary px-1.5 whitespace-nowrap">la primera opción</span>{" "}
              de sus clientes.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-xl">
              Oltinde conecta su empresa con miles de personas que buscan proveedores y servicios en Guinea Ecuatorial cada día. Publicar su perfil es gratis.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild size="lg">
                <Link href="/list-your-company">Publicar mi Empresa gratis <ArrowRight className="ml-2 w-4 h-4" /></Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="#premium">Ver planes Premium</Link>
              </Button>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="bg-white rounded-xl border shadow-xl p-5 w-full max-w-sm rotate-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-md bg-primary flex items-center justify-center shrink-0">
                    <Building className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Su Empresa S.L.</p>
                    <p className="text-[11px] text-muted-foreground">Perfil verificado</p>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-black shrink-0" />
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-muted rounded-lg py-3">
                  <p className="text-lg font-bold">128</p>
                  <p className="text-[10px] text-muted-foreground">Visitas/semana</p>
                </div>
                <div className="bg-muted rounded-lg py-3">
                  <p className="text-lg font-bold">4.8</p>
                  <p className="text-[10px] text-muted-foreground">Valoración</p>
                </div>
                <div className="bg-muted rounded-lg py-3">
                  <p className="text-lg font-bold">32</p>
                  <p className="text-[10px] text-muted-foreground">Reseñas</p>
                </div>
              </div>
            </div>
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
              <Link href={feature.href} className="text-xs font-bold text-secondary underline">Saber más</Link>
            </div>
          ))}
        </div>
      </section>

      {/* Stats strip */}
      <section className="py-12 bg-muted/60 border-y">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-lg font-semibold text-muted-foreground">El directorio de confianza de Guinea Ecuatorial</h2>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold font-headline">{stat.value}+</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
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

      {/* Comparison table */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-headline normal-case mb-6">Gratis vs. Premium</h2>
        <div className="border rounded-lg overflow-hidden overflow-x-auto">
          <div className="grid grid-cols-[2fr_1fr_1fr] min-w-[380px] text-xs sm:text-sm">
            <div className="p-2 sm:p-4 font-semibold border-b"></div>
            <div className="p-2 sm:p-4 font-semibold border-b border-l text-center">Gratis</div>
            <div className="p-2 sm:p-4 font-semibold border-b border-l text-center bg-primary/10">Premium</div>

            {comparisonRows.map((row) => (
              <div key={row.label} className="contents">
                <div className="p-2 sm:p-4 border-b text-muted-foreground flex items-center">{row.label}</div>
                <div className="p-2 sm:p-4 border-b border-l flex items-center justify-center">
                  {row.free ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black" /> : <X className="w-4 h-4 text-muted-foreground/50" />}
                </div>
                <div className="p-2 sm:p-4 border-b border-l flex items-center justify-center bg-primary/10">
                  {row.premium ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-black" /> : <X className="w-4 h-4 text-muted-foreground/50" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured company */}
      <section id="destacada" className="container mx-auto px-4 scroll-mt-24">
        <div className="flex items-start gap-4 bg-secondary/10 rounded-lg p-6 max-w-4xl">
          <Star className="w-8 h-8 text-primary fill-primary shrink-0" />
          <div>
            <h2 className="text-xl font-bold font-headline normal-case mb-2">Empresa Destacada</h2>
            <p className="text-muted-foreground">
              El equipo de Oltinde selecciona periódicamente empresas para destacar en la página principal, dándoles mayor visibilidad frente a miles de visitantes. Las cuentas Premium con un perfil completo tienen más probabilidades de ser seleccionadas.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="container mx-auto px-4 scroll-mt-24">
        <h2 className="text-2xl font-bold font-headline normal-case mb-6">Preguntas Frecuentes</h2>
        <Accordion type="single" collapsible className="w-full border rounded-lg px-2 max-w-3xl">
          {faqs.map((faq, i) => (
            <AccordionItem key={faq.question} value={`faq-${i}`}>
              <AccordionTrigger className="text-left px-2">{faq.question}</AccordionTrigger>
              <AccordionContent className="px-2 text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
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
