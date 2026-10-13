'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, Star } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useIsMobile } from '@/hooks/use-mobile';
import { getCompaniesByOwner } from '@/lib/data';
import type { Company } from '@/lib/types';
import { categoryAllowsFeature, companyHasFeature } from '@/lib/premium-features';
import { BUSINESS_PUBLISH, COMPANY_PUBLISH, PERSONAL_PUBLISH, signinFor, type PublishOption } from '@/lib/publish-options';
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// The + button (bottom bar on phones, "Publicar" in the desktop header) opens
// this: everything a person can add, for themselves or for their company.
// Signed-out visitors see it too; picking something sends them to sign in and
// then straight to that form.
const PublishContext = createContext<{ open: () => void }>({ open: () => {} });

export const usePublishSheet = () => useContext(PublishContext);

export function PublishProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();
  const close = () => setIsOpen(false);

  return (
    <PublishContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      {isMobile ? (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
            <SheetTitle className="font-semibold">Publicar en Oltinde</SheetTitle>
            <SheetDescription>¿Qué quiere añadir?</SheetDescription>
            {isOpen && <PublishOptions onPick={close} />}
          </SheetContent>
        </Sheet>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogTitle className="font-semibold">Publicar en Oltinde</DialogTitle>
            <DialogDescription>¿Qué quiere añadir?</DialogDescription>
            {isOpen && <PublishOptions onPick={close} />}
          </DialogContent>
        </Dialog>
      )}
    </PublishContext.Provider>
  );
}

function PublishOptions({ onPick }: { onPick: () => void }) {
  const { user, loading } = useAuth();
  const [companies, setCompanies] = useState<Company[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getCompaniesByOwner(user.uid).then(list => {
      if (cancelled) return;
      setCompanies(list);
      setSelectedId(list[0]?.id ?? null);
    }).catch(() => !cancelled && setCompanies([]));
    return () => { cancelled = true; };
  }, [user]);

  // Signed out: every option goes through sign-in and comes back to it.
  const to = (href: string) => (user ? href : signinFor(href));
  const company = companies?.find(c => c.id === selectedId) ?? null;

  return (
    <div className="mt-4 space-y-6">
      {!loading && !user && (
        <div className="rounded-lg border border-primary bg-primary/10 p-3 text-sm">
          <p>Elija qué quiere publicar: le pediremos que inicie sesión y después le llevamos directamente al formulario.</p>
          <div className="mt-3 flex gap-2">
            <Button asChild size="sm" onClick={onPick}><Link href={signinFor('/dashboard')}>Iniciar sesión</Link></Button>
            <Button asChild size="sm" variant="outline" onClick={onPick}><Link href={`/signup?next=${encodeURIComponent('/dashboard')}`}>Crear cuenta</Link></Button>
          </div>
        </div>
      )}

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Para usted</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PERSONAL_PUBLISH.map(o => <PublishTile key={o.href} option={{ ...o, href: to(o.href) }} onPick={onPick} />)}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Para su empresa</h3>
        {user && companies === null ? (
          <p className="text-sm text-muted-foreground">Cargando sus empresas…</p>
        ) : !company ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMPANY_PUBLISH.map(o => <PublishTile key={o.href} option={{ ...o, href: to(o.href) }} onPick={onPick} />)}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Con una empresa Premium también puede publicar productos, alquileres, empleos, ofertas, eventos y más.{' '}
              <Link href="/para-empresas" onClick={onPick} className="underline">Ver cómo</Link>
            </p>
          </>
        ) : (
          <>
            {companies!.length > 1 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {companies!.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={cn('rounded-full border px-3 py-1 text-sm', c.id === company.id ? 'border-black bg-black text-white' : 'border-outline-variant hover:border-black')}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BUSINESS_PUBLISH
                .filter(f => company.premiumFeatures ? company.premiumFeatures[f.feature] !== false : categoryAllowsFeature(undefined, f.feature, company.category))
                .map(f => companyHasFeature(company, f.feature) ? (
                  <PublishTile key={f.feature} option={{ label: f.label, hint: company.name, icon: f.icon, href: `/dashboard/companies/${company.id}/${f.path}` }} onPick={onPick} />
                ) : (
                  <PublishTile key={f.feature} premium option={{ label: f.label, hint: 'Con Premium', icon: f.icon, href: '/para-empresas#planes' }} onPick={onPick} />
                ))}
            </div>
            <Link href="/dashboard/add-company" onClick={onPick} className="mt-3 inline-flex items-center gap-1 text-sm underline">
              <Plus className="h-4 w-4" /> Registrar otra empresa
            </Link>
          </>
        )}
      </section>
    </div>
  );
}

function PublishTile({ option: { label, hint, href, icon: Icon }, premium, onPick }: { option: PublishOption; premium?: boolean; onPick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onPick}
      className={cn('group flex items-center gap-3 rounded-lg border border-outline-variant bg-card px-3 py-3 hover:border-black transition', premium && 'opacity-70')}
    >
      <span className={cn('relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full', premium ? 'bg-muted' : 'bg-primary text-primary-foreground')}>
        <Icon className="h-4 w-4" />
        <span className="absolute -right-1 -bottom-1 flex h-4 w-4 items-center justify-center rounded-full bg-black text-white ring-2 ring-card">
          {premium ? <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" /> : <Plus className="h-2.5 w-2.5" />}
        </span>
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight group-hover:underline">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{hint}</span>
      </span>
    </Link>
  );
}
