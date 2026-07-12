
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building, Landmark, FileText, Briefcase, CalendarDays, TicketPercent,
  Megaphone, Newspaper, Linkedin, ShieldCheck, Users, TrendingUp, Sparkles, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const teamMembers = [
  {
    name: "Jesús Gil Eparalele Silochi",
    role: "Fundador & CEO",
    bio: "Con una profunda pasión por la tecnología y un compromiso con el progreso de Guinea Ecuatorial, Jesús fundó Oltinde. Su visión es clara: crear un ecosistema digital centralizado que no solo conecte a las empresas con los consumidores, sino que también simplifique el acceso a información vital para el desarrollo económico y social del país. Con experiencia en desarrollo de software y gestión de proyectos, Jesús identificó la necesidad de una herramienta que eliminara las barreras de información y fomentara la transparencia. Oltinde es el resultado de esa visión, una plataforma diseñada para catalizar el crecimiento, impulsar la competencia y construir un futuro más conectado y próspero para todos los ecuatoguineanos.",
    linkedinUrl: "https://www.linkedin.com/in/gilsilochi/",
  },
];

const offerings = [
  { icon: Building, title: "Empresas", description: "Un directorio completo de negocios en todo el país." },
  { icon: Landmark, title: "Instituciones", description: "Organismos públicos y sus datos de contacto." },
  { icon: FileText, title: "Trámites", description: "Guías paso a paso para procedimientos administrativos." },
  { icon: Briefcase, title: "Empleos", description: "Vacantes publicadas por empresas de Guinea Ecuatorial." },
  { icon: CalendarDays, title: "Eventos", description: "Ferias, conferencias y encuentros del sector." },
  { icon: TicketPercent, title: "Ofertas", description: "Promociones y descuentos de empresas locales." },
  { icon: Megaphone, title: "Anuncios", description: "Noticias y comunicados de las empresas que sigue." },
  { icon: Newspaper, title: "Contribuciones", description: "Artículos escritos por la propia comunidad." },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Confianza",
    description: "Verificamos los perfiles de empresas e instituciones para que la información que encuentre sea precisa y fiable.",
  },
  {
    icon: Users,
    title: "Comunidad",
    description: "Creemos en el poder de las reseñas, contribuciones y suscripciones para construir un ecosistema colaborativo.",
  },
  {
    icon: TrendingUp,
    title: "Crecimiento",
    description: "Damos a cada empresa, grande o pequeña, las herramientas para llegar a más clientes y crecer.",
  },
];

export default function AboutPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold font-headline">Sobre Oltinde</CardTitle>
      </CardHeader>
      <CardContent className="space-y-10">
        <div className="text-lg text-muted-foreground space-y-4 max-w-3xl">
          <p>
            Oltinde es el ecosistema digital que impulsa a Guinea Ecuatorial, una plataforma diseñada para unificar y simplificar el acceso al tejido comercial, institucional y administrativo del país. Nacimos de la necesidad de crear un punto de encuentro centralizado, fiable y fácil de usar que conecte a la comunidad con empresas, servicios, trámites e información esencial.
          </p>
          <p>
            Nuestra misión es catalizar el crecimiento económico y la transparencia, proporcionando a los ciudadanos y empresarios las herramientas necesarias para prosperar. Creemos que al facilitar el acceso a la información, fomentamos una mayor participación, competencia y desarrollo, construyendo un futuro más conectado y próspero para Guinea Ecuatorial.
          </p>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6">1. Qué Ofrecemos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {offerings.map((item) => (
              <div key={item.title} className="flex flex-col items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6">2. Nuestros Valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value) => (
              <Card key={value.title}>
                <CardHeader>
                  <value.icon className="w-8 h-8 text-primary mb-2" />
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold font-headline mb-6">3. Nuestro Fundador</h2>
          <div className="bg-secondary/30 rounded-lg p-6 md:p-10 flex flex-col items-start text-left gap-2">
            <h3 className="text-2xl font-bold">{teamMembers[0].name}</h3>
            <p className="text-primary font-semibold text-lg">{teamMembers[0].role}</p>
            <p className="text-muted-foreground mt-2">
              {teamMembers[0].bio}
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href={teamMembers[0].linkedinUrl} target="_blank" rel="noopener noreferrer">
                  <Linkedin className="mr-2 h-4 w-4" />
                  Conectar en LinkedIn
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="text-center pt-6 border-t">
          <Sparkles className="w-8 h-8 text-primary mx-auto mb-3" />
          <h2 className="text-2xl font-bold font-headline">Forme Parte de Oltinde</h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Ya sea que busque información o quiera dar a conocer su empresa, Oltinde está para ayudarle.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/para-empresas">Para Empresas <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/contact">Contáctenos</Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
