
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";
import {
  CheckCircle2, Star, FileText, TicketPercent, Megaphone,
  Briefcase, CalendarDays, Sparkles, ArrowRight, UserPlus, ClipboardEdit,
  BadgeCheck, X,
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

const freeFeatures = [
  "Perfil público de su empresa en el directorio",
  "Aparece en las búsquedas por nombre, categoría y ciudad",
  "Datos de contacto, ubicación(es) y horario de atención",
  "Recibe reseñas y valoraciones de clientes",
  "Aparece en el buscador inteligente del sitio",
  "Panel de control para editar su perfil cuando quiera",
];

const premiumFeatures = [
  {
    icon: FileText,
    title: "Documentos",
    description: "Suba catálogos, fichas técnicas u otros documentos descargables directamente en su perfil.",
  },
  {
    icon: TicketPercent,
    title: "Ofertas",
    description: "Publique promociones y descuentos para atraer más clientes.",
  },
  {
    icon: Megaphone,
    title: "Anuncios",
    description: "Comparta noticias y comunicados que aparecen en la sección de Anuncios del sitio.",
  },
  {
    icon: Briefcase,
    title: "Empleos",
    description: "Publique vacantes en la Bolsa de Trabajo para encontrar talento en Guinea Ecuatorial.",
  },
  {
    icon: CalendarDays,
    title: "Eventos",
    description: "Organice ferias, conferencias y otros eventos en el Calendario de Eventos.",
  },
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

export default function ParaEmpresasPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Para Empresas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        <div>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Oltinde es el punto de encuentro entre su empresa y miles de personas que buscan proveedores, servicios y oportunidades en Guinea Ecuatorial. Publicar su empresa es gratis; con una cuenta Premium, desbloquea herramientas adicionales para llegar a más clientes.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/list-your-company">Publicar mi Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contactar sobre Premium</Link>
            </Button>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6">1. Cómo empezar</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step) => (
              <div key={step.title} className="flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">2. Gratis para empezar</h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {freeFeatures.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-2">3. Funciones Premium</h2>
          <p className="text-muted-foreground mb-6 max-w-3xl">
            Estas colecciones solo están activas para las empresas con cuenta Premium. Contáctenos para actualizar su cuenta.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {premiumFeatures.map((feature) => (
              <Card key={feature.title} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <feature.icon className="w-8 h-8 text-primary" />
                    <Badge variant="secondary" className="gap-1">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      Premium
                    </Badge>
                  </div>
                  <CardTitle className="text-lg pt-2">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6">4. Gratis vs. Premium</h2>
          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <div className="grid grid-cols-[2fr_1fr_1fr] min-w-[380px] text-xs sm:text-sm">
              <div className="p-2 sm:p-4 font-semibold border-b"></div>
              <div className="p-2 sm:p-4 font-semibold border-b border-l text-center">Gratis</div>
              <div className="p-2 sm:p-4 font-semibold border-b border-l text-center bg-primary/5">Premium</div>

              {comparisonRows.map((row) => (
                <div key={row.label} className="contents">
                  <div className="p-2 sm:p-4 border-b text-muted-foreground flex items-center">{row.label}</div>
                  <div className="p-2 sm:p-4 border-b border-l flex items-center justify-center">
                    {row.free ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/50" />}
                  </div>
                  <div className="p-2 sm:p-4 border-b border-l flex items-center justify-center bg-primary/5">
                    {row.premium ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> : <X className="w-4 h-4 text-muted-foreground/50" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">5. Empresa Destacada</h2>
          <div className="flex items-start gap-4 bg-secondary/30 rounded-lg p-6">
            <Star className="w-8 h-8 text-yellow-500 fill-yellow-500 shrink-0" />
            <p className="text-muted-foreground max-w-2xl">
              El equipo de Oltinde selecciona periódicamente empresas para destacar en la página principal, dándoles mayor visibilidad frente a miles de visitantes. Las cuentas Premium con un perfil completo tienen más probabilidades de ser seleccionadas.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-4">6. Preguntas Frecuentes</h2>
          <Accordion type="single" collapsible className="w-full border rounded-lg px-2">
            {faqs.map((faq, i) => (
              <AccordionItem key={faq.question} value={`faq-${i}`}>
                <AccordionTrigger className="text-left px-2">{faq.question}</AccordionTrigger>
                <AccordionContent className="px-2 text-muted-foreground">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center pt-6 border-t">
          <h2 className="text-2xl font-bold font-headline">¿Listo para empezar?</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Publique su empresa hoy mismo, es gratis. Cuando esté listo para hacer crecer su presencia, contáctenos para activar Premium.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/list-your-company">Publicar mi Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contactar sobre Premium</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
