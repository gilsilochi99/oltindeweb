import Image from 'next/image';
import type { ReactNode } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { sidebarCardClass, contentSectionClass, stitch } from './stitch-tokens';

export function DetailShell({ sidebar, children }: { sidebar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Mobile: main content (name, hero, info) first, sidebar last.
          Desktop: restore the mockup's sidebar-left/main-right order. */}
      <main className="flex-1 min-w-0 order-1 md:order-2">
        {children}
      </main>
      <aside className="w-full md:w-[320px] shrink-0 md:sticky top-20 order-2 md:order-1">
        {sidebar}
      </aside>
    </div>
  );
}

export function SidebarCard({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`${sidebarCardClass} shadow-sm ${className ?? ''}`}>
      {title && <h3 className="font-bold text-[#1a1c1c] mb-3">{title}</h3>}
      {children}
    </div>
  );
}

export function DetailHero({
  logoSrc,
  logoAlt,
  name,
  verified,
  verifiedLabel = 'Perfil Verificado',
  rating,
  reviewCount,
  tags,
  actions,
}: {
  logoSrc: string;
  logoAlt: string;
  name: string;
  verified?: boolean;
  verifiedLabel?: string;
  rating?: number;
  reviewCount?: number;
  tags?: string[];
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-8">
      <div className="w-20 h-20 sm:w-32 sm:h-32 bg-white rounded shrink-0 p-2 overflow-hidden">
        <Image src={logoSrc} alt={logoAlt} width={128} height={128} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-x-3 gap-y-1 mb-1">
          <h1 className="text-xl sm:text-2xl md:text-[32px] md:leading-[40px] font-bold text-[#1a1c1c]">{name}</h1>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
          {verified && (
            <div className="flex items-center" style={{ color: stitch.primary }}>
              <MaterialIcon name="check_circle" className="!text-[18px]" filled />
              <span className="ml-1 font-semibold">{verifiedLabel}</span>
            </div>
          )}
          {verified && rating !== undefined && <div className="text-[#7e775f]">|</div>}
          {rating !== undefined && (
            <div className="flex items-center" style={{ color: stitch.secondary }}>
              <span className="font-bold">{rating.toFixed(1)}</span>
              <div className="flex ml-1 text-[#e2e2e2]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <MaterialIcon key={i} name="star" className="!text-[16px]" filled={i < Math.round(rating)} />
                ))}
              </div>
              <span className="ml-1 font-medium text-black">({reviewCount ?? 0} reseñas)</span>
            </div>
          )}
        </div>
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map(tag => (
              <span key={tag} className="bg-[#eeeeee] text-black px-3 py-1 rounded-full text-xs font-bold uppercase">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function InfoCard({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="bg-white border border-[#e2e2e2] rounded-sm p-6 shadow-sm">
      {title && <h2 className="text-lg font-bold text-[#1a1c1c] mb-4">{title}</h2>}
      {children}
    </div>
  );
}

export function InfoSection({ label, children, divider = true }: { label: string; children: ReactNode; divider?: boolean }) {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-[150px_1fr] gap-3 lg:gap-6 ${divider ? contentSectionClass : ''}`}>
      <div className="text-sm font-bold text-black">{label}</div>
      <div className="text-sm text-[#1a1c1c] space-y-4 min-w-0">{children}</div>
    </div>
  );
}

export function ReviewsTeaserShell({ title = 'Reseñas de Clientes', action, children }: { title?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="mt-8 bg-[#f3f3f3] border border-[#e2e2e2] p-6 rounded-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#1a1c1c]">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
