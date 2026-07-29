
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Bot, Route, Star, Bell, MessageSquare, User, ArrowRight,
  MapPin, ShoppingBag, Sparkles, UserCheck, GraduationCap,
} from "lucide-react";

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const features = [
  {
    icon: GraduationCap,
    title: "Profesionales",
    description: "Encuentre electricistas, diseñadores y otros profesionales cerca de usted, o publique su propio perfil gratis.",
    href: "/professionals",
  },
  {
    icon: Star,
    title: "Favoritos",
    description: "Guarde empresas, empleos, eventos, lugares e itinerarios para encontrarlos en un solo lugar.",
    href: "/favorites",
  },
  {
    icon: Bell,
    title: "Notificaciones",
    description: "Suscríbase a empresas o categorías y reciba avisos cuando publiquen ofertas, anuncios o vacantes.",
    href: "/notifications",
  },
  {
    icon: MessageSquare,
    title: "Reseñas",
    description: "Comparta su experiencia dejando calificaciones y comentarios en empresas y trámites.",
    href: "/companies",
  },
  {
    icon: User,
    title: "Perfil Personalizado",
    description: "Gestione su información, sus suscripciones y sus preferencias de notificación en un solo panel.",
    href: "/profile",
  },
];

export default function ParaTiPage() {
  return (
    <div className="flex flex-col gap-16 md:gap-24 -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-16 md:py-24 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-secondary/10 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4 text-center">
          <Eyebrow>Para Ti</Eyebrow>
          <h1 className="text-3xl md:text-5xl font-bold font-headline tracking-tight text-foreground/90 max-w-3xl mx-auto leading-tight">
            Todo lo que necesita para aprovechar{" "}
            <span className="bg-primary px-1.5 whitespace-nowrap">Guinea Ecuatorial</span>{" "}
            al máximo.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto">
            Desde encontrar exactamente lo que busca hasta planificar su próximo viaje, Oltinde le da las herramientas para hacerlo más fácil.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg">
              <Link href="/signup">
                <UserCheck className="mr-2 w-4 h-4" />
                Crear cuenta gratis
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent">
              <Link href="/companies">Explorar el Directorio</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spotlight: Intelligent search */}
      <section className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="relative w-full max-w-sm aspect-square mx-auto md:mx-0 order-2 md:order-1">
            <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
              <Bot className="w-24 h-24 text-primary" strokeWidth={1.5} />
            </div>
            <div className="absolute -top-2 -left-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="absolute top-1/3 -right-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-secondary-foreground" />
            </div>
            <div className="absolute -bottom-2 left-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md">
              <MapPin className="w-5 h-5 text-primary-foreground" />
            </div>
          </div>
          <div className="order-1 md:order-2">
            <Eyebrow>Búsqueda Inteligente</Eyebrow>
            <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Pregunte con sus propias palabras. Encuentre justo lo que necesita.</h2>
            <p className="mt-4 text-muted-foreground max-w-lg">
              Escriba algo como "abogados en Bata" o "restaurantes cerca de mí" y nuestro buscador con IA entiende su intención, cruza empresas, trámites e instituciones, y le devuelve resultados relevantes al instante.
            </p>
            <Button asChild className="mt-6">
              <Link href="/search">Probar el Buscador <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Spotlight: Itineraries */}
      <section className="py-14 bg-muted/60 border-y">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <Eyebrow>Itinerarios de Viaje</Eyebrow>
              <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case">Planifique su viaje, parada a parada.</h2>
              <p className="mt-4 text-muted-foreground max-w-lg">
                Descubra lugares turísticos y planes de viaje creados por la comunidad, con mapa y recorrido paso a paso. ¿Prefiere el suyo propio? Cree su propio itinerario en minutos y compártalo con quien quiera.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Button asChild>
                  <Link href="/itineraries">Explorar Itinerarios <ArrowRight className="ml-2 w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="outline" className="bg-transparent">
                  <Link href="/dashboard/itineraries/new">Crear el mío</Link>
                </Button>
              </div>
            </div>
            <div className="relative w-full max-w-sm aspect-square mx-auto">
              <div className="absolute inset-0 rounded-full bg-primary/10 border-4 border-white shadow-lg flex items-center justify-center">
                <Route className="w-24 h-24 text-primary" strokeWidth={1.5} />
              </div>
              <div className="absolute -top-2 -right-2 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md text-primary-foreground font-bold text-sm">
                1
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 -left-4 w-11 h-11 rounded-full bg-secondary flex items-center justify-center shadow-md text-secondary-foreground font-bold text-sm">
                2
              </div>
              <div className="absolute -bottom-2 right-1/4 w-11 h-11 rounded-full bg-primary flex items-center justify-center shadow-md text-primary-foreground font-bold text-sm">
                3
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature grid */}
      <section className="container mx-auto px-4">
        <div className="text-center mb-8">
          <Eyebrow>Y mucho más</Eyebrow>
          <h2 className="text-2xl font-bold font-headline normal-case">Su cuenta, a su medida</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group flex flex-col items-start gap-3 p-5 rounded-lg border border-transparent hover:border-outline-variant hover:bg-card hover:shadow-sm transition-all"
            >
              <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center transition-transform group-hover:scale-105">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <Sparkles className="w-8 h-8 text-primary-foreground mx-auto mb-3" />
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">Su cuenta gratis le espera</h2>
          <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">
            Regístrese en menos de un minuto y empiece a guardar favoritos, seguir empresas y planificar su próximo viaje.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" variant="secondary">
              <Link href="/signup">Crear cuenta gratis <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
              <Link href="/companies">Explorar el Directorio</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
