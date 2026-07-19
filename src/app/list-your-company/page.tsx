
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  CheckCircle, ArrowRight, Eye, Users, ShieldCheck, Gift, Building, Briefcase,
  UserPlus, ClipboardEdit, BadgeCheck, Search,
} from "lucide-react";
import Link from "next/link";

const benefits = [
    {
        icon: Eye,
        title: "Aumente su visibilidad de forma masiva",
        description: "Se posiciona frente a miles de clientes potenciales que buscan activamente productos y servicios en Guinea Ecuatorial. Su perfil trabaja para usted 24/7."
    },
    {
        icon: Search,
        title: "Aparezca en el buscador inteligente",
        description: "Nuestro buscador entiende lenguaje natural, como \"empresas de construcción en Bata\". Se posiciona automáticamente sin que tenga que hacer nada extra."
    },
    {
        icon: Users,
        title: "Conecte directamente con sus clientes",
        description: "Su perfil centraliza dirección, teléfono, email, web y redes sociales. Los clientes pueden dejar reseñas, guardarle en Favoritos y suscribirse."
    },
    {
        icon: ShieldCheck,
        title: "Construya confianza y credibilidad",
        description: "La insignia \"Verificado\" indica a los usuarios que su empresa fue validada por nuestro equipo, aumentando la probabilidad de que le elijan."
    },
    {
        icon: Gift,
        title: "Promocione su negocio con Premium",
        description: "Desbloquee Documentos, Ofertas, Anuncios, Empleos y Eventos para su perfil, y llegue a más personas en todas las secciones de Oltinde."
    }
];

const steps = [
  {
    icon: UserPlus,
    title: "1. Cree su cuenta",
    description: "Regístrese gratis con su correo electrónico en menos de un minuto.",
  },
  {
    icon: ClipboardEdit,
    title: "2. Complete el formulario",
    description: "Elija el tipo de entidad y añada su nombre, categoría, ubicación(es) y datos de contacto.",
  },
  {
    icon: BadgeCheck,
    title: "3. Verificación",
    description: "Nuestro equipo revisa su perfil para otorgarle el sello de \"Verificado\".",
  },
  {
    icon: Eye,
    title: "4. Sea descubierto",
    description: "Su perfil ya es público: aparece en el directorio y en el buscador inteligente.",
  },
];

const faqs = [
  {
    question: "¿Cuánto cuesta registrar mi empresa?",
    answer: "Nada. Publicar el perfil de su empresa o negocio en Oltinde es completamente gratis, sin límite de tiempo.",
  },
  {
    question: "¿Cuál es la diferencia entre \"Empresa\" y \"Negocio Local\"?",
    answer: "\"Empresa\" es para entidades formales con CIF y estructura corporativa (S.A., S.R.L., etc.). \"Negocio Local\" usa un formulario simplificado, ideal para restaurantes, tiendas, autónomos y otros negocios que venden directamente al cliente.",
  },
  {
    question: "¿Cuánto tarda la verificación?",
    answer: "Nuestro equipo revisa los nuevos perfiles en cuanto los recibe. Mientras tanto, su perfil ya es visible en el directorio; el sello de \"Verificado\" se añade una vez confirmada la información.",
  },
  {
    question: "¿Puedo actualizar a Premium más adelante?",
    answer: "Sí. Puede empezar con el plan gratuito y activar Premium cuando lo necesite, sin perder la información ya publicada. Contáctenos desde la página de Contacto para activarlo.",
  },
  {
    question: "Mi empresa ya aparece en Oltinde, ¿qué hago?",
    answer: "Algunas empresas fueron añadidas por nuestro equipo a partir de fuentes públicas. Busque su empresa, visite su perfil y use la opción \"Reclamar esta empresa\" para solicitar el acceso.",
  },
];

export default function ListYourCompanyPage() {
    return (
        <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
            {/* Hero + entity picker */}
            <section className="py-12 md:py-16 bg-[var(--section-muted)]">
                <div className="container mx-auto px-4">
                    <div className="text-center max-w-2xl mx-auto">
                        <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 leading-tight">
                            Conecte con más clientes en{" "}
                            <span className="bg-primary px-1.5 whitespace-nowrap">Guinea Ecuatorial</span>
                        </h1>
                        <p className="mt-5 text-lg text-muted-foreground">
                            Únase al directorio de más rápido crecimiento del país y haga que su negocio sea descubierto por miles de personas. Es gratis y toma menos de cinco minutos.
                        </p>
                    </div>

                    <div className="mt-10 grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                        <Card className="p-6 border-2 border-primary relative flex flex-col">
                            <CardHeader>
                                <div className="bg-primary p-3 rounded-md w-fit mb-2">
                                    <Building className="w-8 h-8 text-primary-foreground" />
                                </div>
                                <CardTitle className="text-2xl normal-case">
                                    Empresa
                                </CardTitle>
                                <CardDescription>Para entidades formales con CIF, sociedades (S.A., S.R.L.), y estructuras corporativas.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Requiere información legal.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Perfil corporativo completo.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Ideal para B2B.</span></li>
                                </ul>
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Button asChild className="w-full mt-4" size="lg">
                                    <Link href="/dashboard/add-company">Registrar una Empresa <ArrowRight className="ml-2 w-5 h-5"/></Link>
                                </Button>
                            </div>
                        </Card>
                        <Card className="p-6 border-2 flex flex-col">
                            <CardHeader>
                                <div className="bg-primary p-3 rounded-md w-fit mb-2">
                                    <Briefcase className="w-8 h-8 text-primary-foreground" />
                                </div>
                                <CardTitle className="text-2xl normal-case">
                                    Negocio Local o Emprendimiento
                                </CardTitle>
                                <CardDescription>Para restaurantes, tiendas, autónomos, artesanos y otros pequeños negocios.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Formulario de registro simplificado.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Enfocado en la venta directa al cliente.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-black" /><span>Perfecto para B2C.</span></li>
                                </ul>
                            </CardContent>
                            <div className="p-6 pt-0">
                                <Button asChild className="w-full mt-4" size="lg" variant="secondary">
                                    <Link href="/dashboard/add-business">Registrar un Negocio <ArrowRight className="ml-2 w-5 h-5"/></Link>
                                </Button>
                            </div>
                        </Card>
                    </div>
                </div>
            </section>

            {/* How it works */}
            <section className="container mx-auto px-4">
                <h2 className="text-2xl font-bold font-headline normal-case mb-6 text-center">Cómo funciona</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
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

            {/* Benefits */}
            <section className="py-14 bg-muted/60 border-y">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-bold font-headline normal-case mb-2 text-center">¿Por qué añadir su negocio a Oltinde?</h2>
                    <p className="text-muted-foreground mb-8 text-center max-w-xl mx-auto">
                        Forme parte de un ecosistema digital diseñado para crecer.
                    </p>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {benefits.map((benefit) => (
                            <div key={benefit.title} className="bg-white border rounded-lg p-6">
                                <div className="bg-primary p-2.5 rounded-md w-fit mb-3">
                                    <benefit.icon className="w-5 h-5 text-primary-foreground" />
                                </div>
                                <h3 className="font-semibold">{benefit.title}</h3>
                                <p className="text-sm text-muted-foreground mt-2">{benefit.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="container mx-auto px-4">
                <h2 className="text-2xl font-bold font-headline normal-case mb-6 text-center">Preguntas Frecuentes</h2>
                <Accordion type="single" collapsible className="w-full border rounded-lg px-2 max-w-3xl mx-auto">
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
                        Es gratis y toma menos de cinco minutos. Elija arriba el tipo de entidad y publique su perfil hoy mismo.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg" variant="secondary">
                            <Link href="/dashboard/add-company">Registrar una Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
                            <Link href="/para-empresas">Ver Todas las Funciones</Link>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    )
}
