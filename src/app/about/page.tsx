
import {
  Building, Landmark, FileText, Briefcase, CalendarDays, TicketPercent,
  Megaphone, Newspaper, Linkedin, ShieldCheck, Users, TrendingUp, Sparkles, ArrowRight, Compass,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { marked } from "marked";
import { Button } from "@/components/ui/button";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const teamMembers = [
  {
    name: "Jesús Gil Eparalele Silochi",
    role: "Fundador & CEO",
    bio: `Con una profunda pasión por la tecnología y un firme compromiso con el progreso de Guinea Ecuatorial, decidí fundar y desarrollar **Oltinde**.

Como desarrollador y creador de la plataforma, me di cuenta de primera mano de lo difícil y frustrante que suele ser encontrar información clara, actualizada y accesible sobre negocios y servicios en nuestro país. Fue precisamente esa falta de un punto de acceso unificado lo que me impulsó a actuar: me propuse crear un **directorio y ecosistema digital centralizado** que eliminara esas barreras de información de una vez por todas.

---

Aprovechando mi experiencia en **desarrollo de software y gestión de proyectos**, diseñé Oltinde desde cero para construir un futuro más conectado, transparente y próspero para todos los ecuatoguineanos.`,
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
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Sobre Oltinde</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight">
            El ecosistema digital que impulsa a{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">Guinea Ecuatorial</span>.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Nacimos de la necesidad de crear un punto de encuentro centralizado, fiable y fácil de usar que conecte a la comunidad con empresas, servicios, trámites e información esencial.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/companies">
                <Compass className="mr-2 w-4 h-4" />
                Explorar el Directorio
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/para-empresas">
                Para Empresas <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Eyebrow>Nuestra historia</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">El origen de Oltinde</h2>
        </div>
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative w-full max-w-sm aspect-square mx-auto md:mx-0">
            <div className="absolute inset-6 rounded-full bg-primary/15 -z-10" />
            <Image
              src="/images/founder-jesus.png"
              alt={teamMembers[0].name}
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h3 className="text-xl font-bold">{teamMembers[0].name}</h3>
            <p className="text-black font-semibold">{teamMembers[0].role}</p>
            <div
              className="prose prose-sm max-w-none text-muted-foreground mt-3"
              dangerouslySetInnerHTML={{ __html: marked(teamMembers[0].bio) as string }}
            />
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

      {/* What we offer */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Eyebrow>Todo en un solo lugar</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">Qué ofrecemos</h2>
        </div>
        <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-4">
          {offerings.map((item) => (
            <div
              key={item.title}
              className="group flex flex-col items-center text-center gap-2 p-4 rounded-lg border border-transparent hover:border-outline-variant hover:bg-card hover:shadow-sm transition-all"
            >
              <div className="w-11 h-11 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <item.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-snug">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <Eyebrow>Lo que nos define</Eyebrow>
            <h2 className="text-2xl font-bold font-headline normal-case">Nuestros valores</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="bg-card border rounded-lg p-6 transition-shadow hover:shadow-md">
                <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-4">
                  <value.icon className="w-6 h-6 text-black" />
                </div>
                <h3 className="text-lg font-semibold">{value.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
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
