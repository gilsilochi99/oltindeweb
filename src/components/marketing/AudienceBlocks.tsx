'use client';

import Link from 'next/link';
import {
  ArrowRight, BadgeCheck, Briefcase, CalendarDays, Edit, FileText, KeyRound, LayoutDashboard,
  Megaphone, Plus, ShoppingBag, Sparkles, TicketPercent, UserCheck, UtensilsCrossed,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useViewer } from '@/hooks/use-viewer';
import { companyHasFeature, type PremiumFeature } from '@/lib/premium-features';

// The parts of "Para ti" and "Para empresas" that change with who is looking.
// Until we know (`ready`), the signed-out version is shown faded, so the
// server HTML stays useful for search engines and first paint.
const fade = (ready: boolean) => `transition-opacity duration-200 ${ready ? 'opacity-100' : 'opacity-0'}`;

// ---------------------------------------------------------------- Para empresas

export function EmpresasHeroActions() {
  const { ready, kind, allPremium } = useViewer();
  return (
    <div className={`mt-8 flex flex-wrap justify-center gap-4 ${fade(ready)}`}>
      {kind === 'business' ? (
        <>
          <Button asChild size="lg">
            <Link href="/dashboard"><LayoutDashboard className="mr-2 w-4 h-4" />Ir a mi panel</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent">
            {allPremium ? <a href="#mi-empresa">Atajos de mi empresa</a> : <a href="#planes">Ver qué añade Premium</a>}
          </Button>
        </>
      ) : (
        <>
          <Button asChild size="lg">
            <Link href="/dashboard/add-company"><Plus className="mr-2 w-4 h-4" />Registrar mi empresa gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-transparent">
            <a href="#publicar">Qué puedo publicar</a>
          </Button>
        </>
      )}
    </div>
  );
}

const FEATURE_LINKS: { key: PremiumFeature; label: string; path: string; icon: typeof ShoppingBag }[] = [
  { key: 'shop', label: 'Tienda', path: 'shop', icon: ShoppingBag },
  { key: 'rentals', label: 'Alquileres', path: 'rentals', icon: KeyRound },
  { key: 'menu', label: 'Menú', path: 'menu', icon: UtensilsCrossed },
  { key: 'jobs', label: 'Empleos', path: 'jobs', icon: Briefcase },
  { key: 'offers', label: 'Ofertas', path: 'offers', icon: TicketPercent },
  { key: 'announcements', label: 'Anuncios', path: 'announcements', icon: Megaphone },
  { key: 'events', label: 'Eventos', path: 'events', icon: CalendarDays },
  { key: 'documents', label: 'Documentos', path: 'documents', icon: FileText },
];

function Shortcut({ href, icon: Icon, label, plus }: { href: string; icon: typeof ShoppingBag; label: string; plus?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-background px-3 py-1.5 text-sm font-medium hover:bg-muted">
      <Icon className="w-4 h-4" />{label}{plus ? <Plus className="w-3.5 h-3.5" /> : null}
    </Link>
  );
}

// For owners: straight to each tool of their own companies.
export function MyCompanyShortcuts() {
  const { ready, kind, companies } = useViewer();
  if (!ready || kind !== 'business') return null;
  const shown = companies.slice(0, 3);
  return (
    <section id="mi-empresa" className="container mx-auto px-4 scroll-mt-24 -mt-8 md:-mt-12">
      <div className="max-w-5xl mx-auto rounded-xl border-2 border-primary bg-card p-5 md:p-6">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Atajos de {shown.length > 1 ? 'sus empresas' : 'su empresa'}</p>
        <div className="mt-3 divide-y divide-outline-variant">
          {shown.map(company => {
            const tools = FEATURE_LINKS.filter(f => companyHasFeature(company, f.key));
            return (
              <div key={company.id} className="py-3 first:pt-0 last:pb-0 flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
                <div className="flex items-center gap-2 md:w-56 shrink-0">
                  <span className="font-semibold truncate">{company.name}</span>
                  {company.isPremium ? <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold uppercase">Premium</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Shortcut href={`/dashboard/edit/${company.id}`} icon={Edit} label="Editar perfil" />
                  {!company.isVerified ? <Shortcut href={`/dashboard/companies/${company.id}/verification`} icon={BadgeCheck} label="Verificar" /> : null}
                  {tools.map(t => <Shortcut key={t.key} href={`/dashboard/companies/${company.id}/${t.path}`} icon={t.icon} label={t.label} plus />)}
                  {!company.isPremium ? (
                    <Link href="/contact" className="inline-flex items-center gap-1.5 rounded-full bg-black px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90">
                      <Sparkles className="w-4 h-4" />Activar Premium
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
        {companies.length > shown.length ? (
          <Link href="/dashboard" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold hover:underline">Ver todas en mi panel <ArrowRight className="w-4 h-4" /></Link>
        ) : null}
      </div>
    </section>
  );
}

// Plans and Premium pitches are noise for an owner whose companies are all Premium.
export function HideWhenAllPremium({ children }: { children: React.ReactNode }) {
  const { ready, allPremium } = useViewer();
  if (ready && allPremium) return null;
  return <>{children}</>;
}

const EMPRESAS_CLOSING = {
  start: {
    title: 'Ponga su empresa en el mapa hoy',
    text: 'Registrarla es gratis y lleva unos minutos. Cuando quiera vender, alquilar o contratar, activamos Premium.',
    primary: { label: 'Registrar mi empresa', href: '/dashboard/add-company' },
    secondary: { label: 'Contactar sobre Premium', href: '/contact' },
  },
  grow: {
    title: 'Dé el siguiente paso con Premium',
    text: 'Venda en la Tienda, publique alquileres, empleos y ofertas, y avise a sus seguidores cada vez que publica.',
    primary: { label: 'Contactar sobre Premium', href: '/contact' },
    secondary: { label: 'Ir a mi panel', href: '/dashboard' },
  },
  premium: {
    title: 'Sus herramientas Premium le esperan',
    text: 'Mantenga su catálogo, sus alquileres y sus vacantes al día: cada novedad llega a sus seguidores.',
    primary: { label: 'Ir a mi panel', href: '/dashboard' },
    secondary: { label: 'Publicar otra empresa', href: '/dashboard/add-company' },
  },
};

export function EmpresasClosingCta() {
  const { ready, kind, allPremium } = useViewer();
  const copy = EMPRESAS_CLOSING[kind !== 'business' ? 'start' : allPremium ? 'premium' : 'grow'];
  return (
    <div className={fade(ready)}>
      <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">{copy.title}</h2>
      <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">{copy.text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" variant="secondary">
          <Link href={copy.primary.href}>{copy.primary.label} <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
          <Link href={copy.secondary.href}>{copy.secondary.label}</Link>
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Para ti

export function ParaTiHeroActions() {
  const { ready, kind } = useViewer();
  return (
    <div className={`mt-8 flex flex-wrap justify-center gap-4 ${fade(ready)}`}>
      {kind === 'guest' ? (
        <Button asChild size="lg">
          <Link href="/signup"><UserCheck className="mr-2 w-4 h-4" />Crear cuenta gratis</Link>
        </Button>
      ) : (
        <Button asChild size="lg">
          <Link href="/dashboard"><LayoutDashboard className="mr-2 w-4 h-4" />Ir a mi panel</Link>
        </Button>
      )}
      <Button asChild size="lg" variant="outline" className="bg-transparent">
        <a href="#publicar"><Plus className="mr-2 w-4 h-4" />Qué puedo publicar</a>
      </Button>
    </div>
  );
}

const PARA_TI_CLOSING = {
  guest: {
    title: 'Su cuenta gratis le espera',
    text: 'Regístrese en menos de un minuto: guarde favoritos, reserve, compre y empiece a publicar lo suyo.',
    primary: { label: 'Crear cuenta gratis', href: '/signup' },
    secondary: { label: 'Publicar un alquiler', href: '/dashboard/alquileres/new' },
  },
  member: {
    title: 'Publique lo suyo hoy',
    text: 'Alquile lo que tiene guardado, cree su perfil profesional o comparta una guía. Todo desde su panel.',
    primary: { label: 'Publicar un alquiler', href: '/dashboard/alquileres/new' },
    secondary: { label: 'Ir a mi panel', href: '/dashboard' },
  },
  business: {
    title: '¿Y su empresa?',
    text: 'Venda, alquile, contrate y anúnciese como empresa, con más herramientas y estadísticas.',
    primary: { label: 'Ver Para empresas', href: '/para-empresas' },
    secondary: { label: 'Ir a mi panel', href: '/dashboard' },
  },
};

export function ParaTiClosingCta() {
  const { ready, kind } = useViewer();
  const copy = PARA_TI_CLOSING[kind === 'guest' ? 'guest' : kind === 'business' ? 'business' : 'member'];
  return (
    <div className={fade(ready)}>
      <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">{copy.title}</h2>
      <p className="text-primary-foreground/80 mt-2 max-w-xl mx-auto">{copy.text}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-4">
        <Button asChild size="lg" variant="secondary">
          <Link href={copy.primary.href}>{copy.primary.label} <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
        <Button asChild size="lg" variant="outline" className="bg-transparent border-black text-black hover:bg-black/5">
          <Link href={copy.secondary.href}>{copy.secondary.label}</Link>
        </Button>
      </div>
    </div>
  );
}
