import type { Metadata } from 'next';

import { Button } from "@/components/ui/button";
import {
  BookUser,
  Building,
  Bot,
  UserPlus,
  Compass,
  HeartPulse,
  UtensilsCrossed,
  GraduationCap,
  ShoppingBag,
  Store,
  KeyRound,
  CalendarCheck,
} from "lucide-react";
import Link from "next/link";
import { GuideChips, GuideSidebar, type GuideNavGroup } from "./GuideNav";
import { GUIDE_SECTIONS, type GuideIcon } from "@/lib/help-content";

export const metadata: Metadata = {
  title: "Guía del Usuario",
  description: "Aprenda a usar Oltinde paso a paso: comprar en la tienda, alquilar casas y coches, registrar y gestionar su empresa, vender y publicar alquileres.",
  alternates: { canonical: '/guia-de-usuario' },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold uppercase tracking-widest text-black inline-block border-b-2 border-primary pb-1 mb-3">
      {children}
    </p>
  );
}

const ICONS = { UserPlus, ShoppingBag, Store, KeyRound, CalendarCheck, Building, GraduationCap, BookUser, Compass, HeartPulse, UtensilsCrossed, Bot } satisfies Record<GuideIcon, unknown>;
const sections = GUIDE_SECTIONS.map(s => ({ ...s, icon: ICONS[s.icon] }));

const NAV_GROUPS: { title: string; items: { id: string; label: string }[] }[] = [
  { title: "Para usuarios", items: [
    { id: "cuenta", label: "Primeros pasos" },
    { id: "usuarios", label: "Funciones para todos" },
    { id: "tienda", label: "Comprar en la Tienda" },
    { id: "alquiler", label: "Alquilar casas y coches" },
    { id: "comida", label: "Comida a domicilio" },
    { id: "salud", label: "Salud y farmacias" },
    { id: "turismo", label: "Turismo e itinerarios" },
  ] },
  { title: "Para empresas", items: [
    { id: "empresas", label: "Gestión de empresas" },
    { id: "vender", label: "Vender en la Tienda" },
    { id: "publicar-alquiler", label: "Publicar alquileres" },
    { id: "profesionales", label: "Profesionales" },
    { id: "asesor-ia", label: "Asistente Oltinde" },
  ] },
];

const sectionById = new Map(sections.map(s => [s.id, s]));
const orderedSections = NAV_GROUPS.flatMap(g => g.items.map(i => sectionById.get(i.id)!));
const navGroups: GuideNavGroup[] = NAV_GROUPS.map(g => ({
  title: g.title,
  items: g.items.map(i => {
    const Icon = sectionById.get(i.id)!.icon;
    return { id: i.id, title: i.label, icon: <Icon /> };
  }),
}));

export default function UserGuidePage() {
  return (
    <div className="flex flex-col -m-4 md:-m-10 mb-12 md:mb-20">
      {/* Hero */}
      <section className="relative overflow-hidden py-10 md:py-14 bg-[var(--section-muted)]">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-60">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/30 blur-3xl" />
        </div>
        <div className="relative container mx-auto px-4">
          <Eyebrow>Cómo usar Oltinde</Eyebrow>
          <h1 className="text-3xl md:text-4xl font-bold font-headline tracking-tight text-foreground/90">
            Guía del Usuario
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            Descubra cómo sacar el máximo provecho de Oltinde: desde comprar en la tienda o alquilar una casa o un coche hasta registrar su negocio o planificar su próximo viaje.
          </p>
        </div>
      </section>

      {/* Mobile: sticky section chips */}
      <div className="lg:hidden sticky top-16 z-30 bg-background border-b px-4">
        <GuideChips groups={navGroups} />
      </div>

      <div className="container mx-auto px-4 py-10 md:py-14 grid lg:grid-cols-[250px_1fr] gap-10 xl:gap-14 items-start">
        <aside className="hidden lg:block sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-2">
          <GuideSidebar groups={navGroups} />
        </aside>

        <div className="min-w-0 flex flex-col gap-12">
          {orderedSections.map((section, index) => (
            <section key={section.id} id={section.id} className="scroll-mt-32 lg:scroll-mt-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-11 h-11 rounded-md bg-primary flex items-center justify-center shrink-0">
                  <section.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold font-headline normal-case">{section.title}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-6">
                {section.content.map((item) => (
                  <div key={item.subtitle} className="border-l-2 border-primary pl-4">
                    <h3 className="font-semibold">{item.subtitle}</h3>
                    <p className="text-sm text-muted-foreground mt-1" dangerouslySetInnerHTML={{ __html: item.text }} />
                  </div>
                ))}
              </div>
              {index < orderedSections.length - 1 && <div className="mt-12 border-b" />}
            </section>
          ))}
        </div>
      </div>

      {/* Final CTA */}
      <section className="relative overflow-hidden py-16 bg-primary">
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-56 h-56 rounded-full bg-black/5 pointer-events-none" />
        <div className="relative container mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">¿Listo para empezar?</h2>
          <p className="text-primary-foreground/80 mt-2 mb-6 max-w-xl mx-auto">
            Cree una cuenta para empezar a explorar todas las posibilidades de Oltinde.
          </p>
          <Button asChild size="lg" variant="secondary">
            <Link href="/signup">Registrarse Ahora</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
