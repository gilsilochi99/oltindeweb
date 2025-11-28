
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Star, Eye, Users, ShieldCheck, Gift, Building, Briefcase } from "lucide-react";
import Link from "next/link";

const benefits = [
    {
        icon: Eye,
        title: "Aumente su Visibilidad de Forma Masiva",
        description: "Al listar su empresa en Oltinde, se posiciona frente a miles de clientes potenciales que buscan activamente productos y servicios en Guinea Ecuatorial. Nuestro directorio está optimizado para motores de búsqueda, lo que significa que su perfil de empresa trabajará para usted 24/7, atrayendo tráfico cualificado y aumentando el reconocimiento de su marca en todo el país."
    },
    {
        icon: Users,
        title: "Conecte Directamente con sus Clientes",
        description: "Facilite que los usuarios le encuentren y contacten. Su perfil centralizará toda su información clave: dirección, teléfono, email, sitio web y redes sociales. Los clientes podrán dejar reseñas, construir su reputación online y proporcionar una prueba social valiosa que atraerá a nuevos negocios."
    },
    {
        icon: ShieldCheck,
        title: "Construya Confianza y Credibilidad",
        description: "Obtenga la insignia de 'Verificado' en su perfil, una marca de confianza que le distingue de la competencia. Esta insignia indica a los usuarios que su empresa ha sido validada por nuestro equipo, aumentando la credibilidad y la probabilidad de que los clientes elijan sus servicios."
    },
    {
        icon: Gift,
        title: "Promocione su Negocio con Herramientas Premium",
        description: "Con nuestro plan Premium, desbloqueará potentes herramientas de marketing. Publique anuncios para destacar noticias importantes, cree ofertas especiales para atraer a más clientes en momentos clave y comparta documentos como catálogos o menús. Estas funciones están diseñadas para maximizar su alcance e impacto en la plataforma."
    }
];

export default function ListYourCompanyPage() {
    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <section className="text-left">
                <h1 className="text-4xl md:text-5xl font-bold font-headline tracking-tighter">
                    Conecte con más clientes en Guinea Ecuatorial
                </h1>
                <p className="max-w-3xl mt-4 text-lg text-muted-foreground">
                    Únase al directorio de más rápido crecimiento en el país y haga que su negocio o empresa sea descubierto por miles de personas.
                </p>
            </section>
            
            {/* Call to Action with Entity Type Selection */}
            <section>
                 <div className="text-left mb-8">
                    <h2 className="text-2xl font-bold font-headline">¿QUÉ DESEA REGISTRAR?</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl">
                        Elija el tipo de entidad que mejor se adapte a usted para empezar.
                    </p>
                </div>
                 <div className="grid lg:grid-cols-2 gap-8 mt-8 max-w-4xl">
                     <Card className="p-6 border-2 border-primary relative flex flex-col">
                        <CardHeader>
                             <div className="bg-primary/10 p-3 rounded-md w-fit mb-2">
                                <Building className="w-8 h-8 text-primary" />
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
                                <Briefcase className="w-8 h-8 text-primary" />
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
            </section>

             {/* Why Join Section */}
            <section>
                 <div className="text-left mb-8">
                    <h2 className="text-2xl font-bold font-headline">¿POR QUÉ AÑADIR SU NEGOCIO A OLTINDE?</h2>
                    <p className="mt-2 text-muted-foreground max-w-2xl">
                        Forme parte de un ecosistema digital diseñado para crecer.
                    </p>
                </div>
                 <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
                    {benefits.map((benefit, index) => (
                        <Card key={index}>
                             <AccordionItem value={`item-${index}`} className="border-b-0">
                                <AccordionTrigger className="p-6 text-lg text-left hover:no-underline font-semibold">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-primary/10 p-2 rounded-md">
                                            <benefit.icon className="w-6 h-6 text-primary" />
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
            </section>
        </div>
    )
}
