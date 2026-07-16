
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
        title: "Aumente su Visibilidad de Forma Masiva",
        description: "Al listar su empresa en Oltinde, se posiciona frente a miles de clientes potenciales que buscan activamente productos y servicios en Guinea Ecuatorial. Nuestro directorio está optimizado para motores de búsqueda, lo que significa que su perfil de empresa trabajará para usted 24/7, atrayendo tráfico cualificado y aumentando el reconocimiento de su marca en todo el país."
    },
    {
        icon: Search,
        title: "Aparezca en el Buscador Inteligente",
        description: "Oltinde cuenta con un buscador que entiende lenguaje natural, como \"empresas de construcción en Bata\". Su perfil se posiciona automáticamente cuando su categoría, ciudad o servicios coinciden con lo que buscan los usuarios, sin que tenga que hacer nada extra."
    },
    {
        icon: Users,
        title: "Conecte Directamente con sus Clientes",
        description: "Facilite que los usuarios le encuentren y contacten. Su perfil centralizará toda su información clave: dirección, teléfono, email, sitio web y redes sociales. Los clientes podrán dejar reseñas, guardarle en Favoritos y suscribirse para recibir notificaciones de sus novedades."
    },
    {
        icon: ShieldCheck,
        title: "Construya Confianza y Credibilidad",
        description: "Obtenga la insignia de 'Verificado' en su perfil, una marca de confianza que le distingue de la competencia. Esta insignia indica a los usuarios que su empresa ha sido validada por nuestro equipo, aumentando la credibilidad y la probabilidad de que los clientes elijan sus servicios."
    },
    {
        icon: Gift,
        title: "Promocione su Negocio con Herramientas Premium",
        description: "Con nuestro plan Premium, desbloqueará Documentos, Ofertas, Anuncios, Empleos y Eventos para su perfil. Publique promociones para atraer clientes en momentos clave, comparta catálogos y llegue a más personas a través de todas las secciones de Oltinde."
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
        <Card>
            <CardHeader>
                <CardTitle className="text-3xl font-bold font-headline">
                    Conecte con más clientes en Guinea Ecuatorial
                </CardTitle>
                <CardDescription className="max-w-3xl text-lg">
                    Únase al directorio de más rápido crecimiento en el país y haga que su negocio o empresa sea descubierto por miles de personas.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-10">
                <div>
                    <h2 className="text-2xl font-bold font-headline mb-2">1. ¿Qué desea registrar?</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                        Elija el tipo de entidad que mejor se adapte a usted para empezar.
                    </p>
                    <div className="grid lg:grid-cols-2 gap-8 max-w-4xl">
                        <Card className="p-6 border-2 border-primary relative flex flex-col">
                            <CardHeader>
                                <div className="bg-primary/10 p-3 rounded-md w-fit mb-2">
                                    <Building className="w-8 h-8 text-black" />
                                </div>
                                <CardTitle className="text-2xl">
                                    Empresa
                                </CardTitle>
                                <CardDescription>Para entidades formales con CIF, sociedades (S.A., S.R.L.), y estructuras corporativas.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Requiere información legal.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Perfil corporativo completo.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Ideal para B2B.</span></li>
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
                                <div className="bg-primary/10 p-3 rounded-md w-fit mb-2">
                                    <Briefcase className="w-8 h-8 text-black" />
                                </div>
                                <CardTitle className="text-2xl">
                                    Negocio Local o Emprendimiento
                                </CardTitle>
                                <CardDescription>Para restaurantes, tiendas, autónomos, artesanos y otros pequeños negocios.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-grow">
                                <ul className="space-y-2">
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Formulario de registro simplificado.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Enfocado en la venta directa al cliente.</span></li>
                                    <li className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /><span>Perfecto para B2C.</span></li>
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

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-6">2. Cómo Funciona</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {steps.map((step) => (
                            <div key={step.title} className="flex flex-col items-start gap-3">
                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                    <step.icon className="w-6 h-6 text-black" />
                                </div>
                                <h3 className="font-semibold">{step.title}</h3>
                                <p className="text-sm text-muted-foreground">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-2">3. ¿Por Qué Añadir su Negocio a Oltinde?</h2>
                    <p className="text-muted-foreground mb-6 max-w-2xl">
                        Forme parte de un ecosistema digital diseñado para crecer.
                    </p>
                    <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
                        {benefits.map((benefit, index) => (
                            <Card key={index}>
                                <AccordionItem value={`item-${index}`} className="border-b-0">
                                    <AccordionTrigger className="p-6 text-lg text-left hover:no-underline font-semibold">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-primary/10 p-2 rounded-md">
                                                <benefit.icon className="w-6 h-6 text-black" />
                                            </div>
                                            {benefit.title}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-6 pb-6 text-base text-muted-foreground">
                                        {benefit.description}
                                    </AccordionContent>
                                </AccordionItem>
                            </Card>
                        ))}
                    </Accordion>
                </div>

                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4">4. Preguntas Frecuentes</h2>
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
                        Es gratis y toma menos de cinco minutos. Elija arriba el tipo de entidad y publique su perfil hoy mismo.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="/dashboard/add-company">Registrar una Empresa <ArrowRight className="ml-2 w-4 h-4" /></Link>
                        </Button>
                        <Button asChild size="lg" variant="outline">
                            <Link href="/para-empresas">Ver Todas las Funciones</Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
