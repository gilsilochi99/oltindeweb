'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { getCompaniesByOwner } from '@/lib/data';

// The homepage's closing yellow panel, matched to who is looking:
// - signed out: create a free account;
// - signed in without a business: list your business;
// - signed in with a business: go to your panel (and see Premium if not on it).
// The page is rendered for everyone, so this decides in the browser.
type Variant = 'guest' | 'no-business' | 'business';

const COPY: Record<Variant, { title: string; text: string; primary: { label: string; href: string }; secondary: { label: string; href: string } }> = {
  guest: {
    title: 'Cree su cuenta gratis',
    text: 'Guarde sus favoritos, siga sus pedidos y reservas y reciba avisos de farmacias de guardia, empleos y ofertas de su ciudad.',
    primary: { label: 'Crear una cuenta', href: '/signup' },
    secondary: { label: '¿Ya tiene cuenta? Inicie sesión', href: '/signin' },
  },
  'no-business': {
    title: 'Registre su negocio en Oltinde',
    text: 'Publíquelo gratis para que los clientes le encuentren, reciba reseñas y venda sus productos en la Tienda.',
    primary: { label: 'Publicar mi empresa', href: '/list-your-company' },
    secondary: { label: 'Ver cómo funciona', href: '/para-empresas' },
  },
  business: {
    title: 'Haga crecer su negocio',
    text: 'Mantenga su ficha al día, publique ofertas y empleos, y vea cuántas personas visitan su empresa.',
    primary: { label: 'Ir a mi panel', href: '/dashboard' },
    secondary: { label: 'Ver planes Premium', href: '/para-empresas' },
  },
};

export function HomeClosingCta() {
  const { user, loading, isPremium } = useAuth();
  const [variant, setVariant] = useState<Variant>('guest');

  useEffect(() => {
    if (loading) return;
    if (!user) {
      setVariant('guest');
      return;
    }
    let cancelled = false;
    setVariant('no-business');
    getCompaniesByOwner(user.uid)
      .then((companies) => { if (!cancelled && companies.length > 0) setVariant('business'); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, loading]);

  const copy = COPY[variant];
  const showSecondary = !(variant === 'business' && isPremium);

  return (
    <div className={`flex flex-col md:flex-row md:items-center md:justify-between gap-6 rounded-xl bg-primary px-8 py-10 lg:px-12 transition-opacity duration-200 ${loading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="max-w-xl">
        <h2 className="text-2xl md:text-3xl font-bold font-headline normal-case text-primary-foreground">{copy.title}</h2>
        <p className="mt-2 text-primary-foreground/80">{copy.text}</p>
      </div>
      <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
        <Button asChild size="lg" variant="secondary">
          <Link href={copy.primary.href}>{copy.primary.label} <ArrowRight className="ml-2 w-4 h-4" /></Link>
        </Button>
        {showSecondary ? (
          <Link href={copy.secondary.href} className="text-sm text-primary-foreground/80 hover:underline">{copy.secondary.label}</Link>
        ) : null}
      </div>
    </div>
  );
}
