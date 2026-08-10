import type { ReactNode } from 'react';
import { MaterialIcon } from './MaterialIcon';
import { WhatsAppIcon, toWhatsAppHref } from '@/components/shared/WhatsAppButton';
import { stitch } from './stitch-tokens';
import { cn } from '@/lib/utils';

// Mobile-only quick-action strip rendered right under DetailHero — on
// mobile, DetailShell stacks the sidebar (where these same actions live
// today, via SidebarCard) below the entire main column, so a visitor has to
// scroll past the full page before reaching Call/Directions/WhatsApp. This
// duplicates just those actions higher up, matching how Maps/Yelp-style
// detail pages surface them. Desktop is untouched — the sidebar there
// already puts them above the fold.
export function QuickActionsRow({
  phone,
  whatsapp,
  mapHref,
  email,
  website,
}: {
  phone?: string;
  whatsapp?: string;
  mapHref?: string;
  email?: string;
  website?: string;
}) {
  const actions: { key: string; href: string; label: string; icon: ReactNode; external?: boolean }[] = [];
  if (phone) actions.push({ key: 'call', href: `tel:${phone}`, label: 'Llamar', icon: <MaterialIcon name="call" className="!text-[22px]" /> });
  if (mapHref) actions.push({ key: 'map', href: mapHref, label: 'Cómo Llegar', icon: <MaterialIcon name="map" className="!text-[22px]" />, external: true });
  if (whatsapp) actions.push({ key: 'whatsapp', href: toWhatsAppHref(whatsapp), label: 'WhatsApp', icon: <WhatsAppIcon className="w-[22px] h-[22px] fill-current" />, external: true });
  if (email) actions.push({ key: 'email', href: `mailto:${email}`, label: 'Email', icon: <MaterialIcon name="mail" className="!text-[22px]" /> });
  if (website) actions.push({ key: 'website', href: website, label: 'Web', icon: <MaterialIcon name="language" className="!text-[22px]" />, external: true });

  if (actions.length === 0) return null;

  return (
    <div
      className="md:hidden grid mb-6 rounded-lg border border-stitch-outline-variant overflow-hidden bg-card"
      style={{ gridTemplateColumns: `repeat(${actions.length}, minmax(0, 1fr))` }}
    >
      {actions.map((action, i) => (
        <a
          key={action.key}
          href={action.href}
          target={action.external ? '_blank' : undefined}
          rel={action.external ? 'noopener noreferrer' : undefined}
          className={cn(
            'flex flex-col items-center justify-center gap-1 py-3 text-xs font-semibold active:bg-stitch-surface-container-low transition-colors',
            i > 0 && 'border-l border-stitch-outline-variant'
          )}
          style={{ color: stitch.secondary }}
        >
          {action.icon}
          {action.label}
        </a>
      ))}
    </div>
  );
}
