// Everything a person can add, read by the + sheet (PublishSheet). Mirrors
// the web's src/lib/publish-options.ts with the app's own screen paths.
import { Briefcase, Building2, CalendarDays, FileText, GraduationCap, KeyRound, Landmark, Megaphone, Package, PenLine, Route, UtensilsCrossed, type LucideIcon } from 'lucide-react-native';
import type { PremiumFeature } from './types';

export type PublishOption = { label: string; hint: string; href: string; icon: LucideIcon };

/** What anyone can add with their own account, no company needed. */
export const PERSONAL_PUBLISH: PublishOption[] = [
  { label: 'Algo para alquilar', hint: 'Casa, coche, equipo o espacio', href: '/business/me/rental/new', icon: KeyRound },
  { label: 'Perfil profesional', hint: 'Aparezca en Profesionales', href: '/professionals/mi-perfil', icon: GraduationCap },
  { label: 'Contribución', hint: 'Artículo o guía', href: '/contribuciones/editar', icon: PenLine },
  { label: 'Itinerario', hint: 'Una ruta que recomienda', href: '/itineraries/editar', icon: Route },
  { label: 'Lugar turístico', hint: 'Sugiera un sitio', href: '/places/suggest', icon: Landmark },
];

export const COMPANY_PUBLISH: PublishOption = { label: 'Empresa', hint: 'Registre su empresa o negocio', href: '/business/new', icon: Building2 };

/** What a company can publish; each needs Premium and a category that allows it. */
export const BUSINESS_PUBLISH: { feature: PremiumFeature; label: string; icon: LucideIcon; path: string }[] = [
  { feature: 'shop', label: 'Producto', icon: Package, path: 'product/new' },
  { feature: 'rentals', label: 'Alquiler', icon: KeyRound, path: 'rental/new' },
  { feature: 'jobs', label: 'Empleo', icon: Briefcase, path: 'jobs/new' },
  { feature: 'offers', label: 'Oferta o anuncio', icon: Megaphone, path: 'news' },
  { feature: 'events', label: 'Evento', icon: CalendarDays, path: 'events/new' },
  { feature: 'menu', label: 'Plato del menú', icon: UtensilsCrossed, path: 'menu/new' },
  { feature: 'documents', label: 'Documento', icon: FileText, path: 'documents' },
];
