// Everything a person can add to Oltinde, in one list: the + button's sheet
// (PublishSheet) and the dashboard's "Publicar algo nuevo" card both read it.
// The app keeps its own copy (mobile/src/lib/publish-options.ts) because its
// screens live at different paths.
import { Building, Briefcase, CalendarDays, FileText, GraduationCap, KeyRound, MapPin, Megaphone, Newspaper, Route, ShoppingBag, Store, TicketPercent, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import type { PremiumFeature } from '@/lib/premium-features';

export type PublishOption = { label: string; hint: string; href: string; icon: LucideIcon };

/** What anyone can add with their own account, no company needed. */
export const PERSONAL_PUBLISH: PublishOption[] = [
  { label: 'Algo para alquilar', hint: 'Casa, coche, equipo o espacio', href: '/dashboard/alquileres/new', icon: KeyRound },
  { label: 'Perfil profesional', hint: 'Aparezca en Profesionales', href: '/dashboard/professional', icon: GraduationCap },
  { label: 'Contribución', hint: 'Artículo o guía', href: '/dashboard/contribuciones/new', icon: Newspaper },
  { label: 'Itinerario', hint: 'Una ruta que recomienda', href: '/dashboard/itineraries/new', icon: Route },
  { label: 'Lugar turístico', hint: 'Sugiera un sitio', href: '/places/suggest', icon: MapPin },
];

/** Registering a company or local business, the way into the business tools. */
export const COMPANY_PUBLISH: PublishOption[] = [
  { label: 'Empresa', hint: 'Registre su empresa', href: '/dashboard/add-company', icon: Building },
  { label: 'Negocio local', hint: 'Tienda, bar, taller…', href: '/dashboard/add-business', icon: Store },
];

/** What a company can publish; each needs Premium and a category that allows it. */
export const BUSINESS_PUBLISH: { feature: PremiumFeature; label: string; icon: LucideIcon; path: string }[] = [
  { feature: 'shop', label: 'Producto', icon: ShoppingBag, path: 'shop/new' },
  { feature: 'rentals', label: 'Alquiler', icon: KeyRound, path: 'rentals/new' },
  { feature: 'jobs', label: 'Empleo', icon: Briefcase, path: 'jobs/new' },
  { feature: 'offers', label: 'Oferta', icon: TicketPercent, path: 'offers' },
  { feature: 'announcements', label: 'Anuncio', icon: Megaphone, path: 'announcements' },
  { feature: 'events', label: 'Evento', icon: CalendarDays, path: 'events' },
  { feature: 'menu', label: 'Plato del menú', icon: UtensilsCrossed, path: 'menu/new' },
  { feature: 'documents', label: 'Documento', icon: FileText, path: 'documents' },
];

/** Sign-in link that brings the person back to `href` afterwards. */
export function signinFor(href: string) {
  return `/signin?next=${encodeURIComponent(href)}`;
}

/** The `next` parameter of the current URL, if it is a path on this site. */
export function readNextParam(): string | null {
  if (typeof window === 'undefined') return null;
  const next = new URLSearchParams(window.location.search).get('next');
  return next && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : null;
}
