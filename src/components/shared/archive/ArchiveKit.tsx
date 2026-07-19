import type { ReactNode } from 'react';
import Link from 'next/link';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ArchiveShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-5">
      <main className="flex-1 min-w-0">{children}</main>
      <aside className="w-full md:w-80 shrink-0 space-y-5">{sidebar}</aside>
    </div>
  );
}

export function ArchiveHeader({
  breadcrumbLabel,
  title,
  description,
  resultCount,
  pageStart,
  pageEnd,
}: {
  breadcrumbLabel: string;
  title: string;
  description?: string;
  resultCount?: number;
  pageStart?: number;
  pageEnd?: number;
}) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-[32px] md:leading-[40px] font-bold text-on-background">{title}</h1>
      {description && <p className="mt-2 text-sm text-on-surface-variant max-w-3xl">{description}</p>}
      {resultCount !== undefined && (
        <div className="flex justify-between items-center mt-4 border-b border-outline-variant pb-2">
          <span className="text-xs text-secondary">
            {resultCount > 0 ? `Mostrando ${pageStart}-${pageEnd} de ${resultCount} resultados` : 'Sin resultados'}
          </span>
        </div>
      )}
    </div>
  );
}

export function SidebarWidget({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="border border-outline-variant rounded bg-card p-4">
      {title && <h3 className="font-bold text-sm text-on-background mb-4 pb-2 border-b-2 border-primary inline-block">{title}</h3>}
      {children}
    </section>
  );
}

export function ClaimListingWidget() {
  return (
    <SidebarWidget>
      <div className="text-center">
        <h3 className="text-lg font-bold text-on-background">
          Gestiona tu <span className="text-black underline decoration-2">perfil gratis</span>
        </h3>
        <p className="text-xs text-secondary mt-2 mb-4">Actualiza la información de tu empresa en solo unos pasos.</p>
        <Button asChild variant="secondary" className="w-full">
          <Link href="/list-your-company">Reclamar mi Negocio</Link>
        </Button>
      </div>
    </SidebarWidget>
  );
}

export type FeaturedListingItem = {
  id: string;
  href: string;
  name: string;
  subtitle?: string;
  metaPrimary?: string;
};

export function FeaturedListingsWidget({ title = 'Destacados', items }: { title?: string; items: FeaturedListingItem[] }) {
  if (items.length === 0) return null;
  return (
    <SidebarWidget title={title}>
      <div className="space-y-5">
        {items.map(item => (
          <div key={item.id}>
            <Link href={item.href} className="font-bold text-sm text-secondary underline">
              {item.name}
            </Link>
            {item.subtitle && <p className="text-[11px] text-on-surface-variant mt-1">{item.subtitle}</p>}
            {item.metaPrimary && <p className="text-sm font-bold text-on-background mt-1">{item.metaPrimary}</p>}
          </div>
        ))}
      </div>
    </SidebarWidget>
  );
}

export function QAWidget() {
  return (
    <SidebarWidget title="Preguntas y Respuestas">
      <Button asChild variant="outline" className="w-full gap-2">
        <Link href="/faq">
          <HelpCircle className="w-4 h-4 text-secondary" /> Ver Preguntas Frecuentes
        </Link>
      </Button>
    </SidebarWidget>
  );
}
