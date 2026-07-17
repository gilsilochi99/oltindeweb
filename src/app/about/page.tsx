
import {
  Building, Landmark, FileText, Briefcase, CalendarDays, TicketPercent,
  Megaphone, Newspaper, Linkedin, ShieldCheck, Users, TrendingUp, Sparkles, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCompanies, getInstitutions, getProcedures, getUniqueCategories } from "@/lib/data";

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

export default async function AboutPage() {
  const [companies, institutions, procedures, categories] = await Promise.all([
    getCompanies(),
    getInstitutions(),
    getProcedures(),
    getUniqueCategories(),
  ]);

  const stats = [
    { value: companies.length, label: "Empresas" },
    { value: institutions.length, label: "Instituciones" },
    { value: procedures.length, label: "Trámites" },
    { value: categories.length, label: "Categorías" },
  ];

  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="py-12 md:py-20" style={{ backgroundColor: '#F9F8F6' }}>
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight">
            El ecosistema digital que impulsa a{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">Guinea Ecuatorial</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nacimos de la necesidad de crear un punto de encuentro centralizado, fiable y fácil de usar que conecte a la comunidad con empresas, servicios, trámites e información esencial.
          </p>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold font-headline">{stat.value}+</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Nuestra misión</h2>
          <p className="mt-4 text-muted-foreground">
            Catalizar el crecimiento económico y la transparencia, proporcionando a los ciudadanos y empresarios las herramientas necesarias para prosperar. Creemos que al facilitar el acceso a la información, fomentamos una mayor participación, competencia y desarrollo, construyendo un futuro más conectado y próspero para Guinea Ecuatorial.
          </p>
        </div>
      </section>

      {/* What we offer */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-headline normal-case mb-6 text-center">Qué ofrecemos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {offerings.map((item) => (
            <div key={item.title} className="flex flex-col items-start gap-3">
              <div className="w-12 h-12 rounded-md bg-primary flex items-center justify-center">
                <item.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold font-headline normal-case mb-8 text-center">Nuestros valores</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="bg-white border rounded-lg p-6">
                <value.icon className="w-8 h-8 text-black mb-3" />
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="container mx-auto px-4">
        <h2 className="text-2xl font-bold font-headline normal-case mb-6 text-center">Nuestro fundador</h2>
        <div className="max-w-3xl mx-auto bg-secondary/5 border rounded-lg p-6 md:p-10 flex flex-col sm:flex-row items-start gap-6">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground shrink-0 mx-auto sm:mx-0">
            {teamMembers[0].name.split(' ').map(n => n[0]).slice(0, 2).join('')}
          </div>
          <div>
            <h3 className="text-xl font-bold">{teamMembers[0].name}</h3>
            <p className="text-black font-semibold">{teamMembers[0].role}</p>
            <p className="text-muted-foreground mt-3 text-sm">
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
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <Sparkles className="w-8 h-8 text-primary-foreground mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">Forme parte de Oltinde</h2>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            Ya sea que busque información o quiera dar a conocer su empresa, Oltinde está para ayudarle.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/para-empresas">Para Empresas <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
              <Link href="/contact">Contáctenos</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
