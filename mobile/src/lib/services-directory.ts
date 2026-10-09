import {
  Briefcase, Car, GraduationCap, HardHat, Home, Landmark, Laptop, Megaphone, Scale, ShieldCheck, Sparkles, SprayCan, Stethoscope, Truck, UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';
import type { Branch, Company, Service } from './types';

// Services directory (web: /services, getServicesByCompany): every service and
// the companies whose branches offer it, built from data the app already has.
export type ServiceEntry = { service: Service; providers: (Company & { branches: Branch[] })[] };

export function buildServiceDirectory(services: Service[], companies: Company[]): ServiceEntry[] {
  return services
    .map((service) => ({
      service,
      providers: companies
        .map((c) => ({ ...c, branches: (c.branches ?? []).filter((b) => b.servicesOffered?.includes(service.id)) }))
        .filter((c) => c.branches.length > 0),
    }))
    .sort((a, b) => a.service.name.localeCompare(b.service.name));
}

// Same keyword → icon matching as the web (categories are free text).
export function serviceIcon(category: string): LucideIcon {
  const c = category.toLowerCase();
  if (/constru|obra|arquitect/.test(c)) return HardHat;
  if (/salud|médic|medic|clínic|clinic|hospital|dental/.test(c)) return Stethoscope;
  if (/restaurant|comida|gastronom|catering/.test(c)) return UtensilsCrossed;
  if (/tecnolog|software|inform|digital|web/.test(c)) return Laptop;
  if (/legal|abogad|jurídic|juridic/.test(c)) return Scale;
  if (/transport|logístic|logistic|envío|envio/.test(c)) return Truck;
  if (/educa|formaci|academia|escuela/.test(c)) return GraduationCap;
  if (/bellez|estétic|estetic|peluquer|spa/.test(c)) return Sparkles;
  if (/financ|banc|seguro|contabl/.test(c)) return Landmark;
  if (/limpieza/.test(c)) return SprayCan;
  if (/segur/.test(c)) return ShieldCheck;
  if (/hogar|mueble|decorac/.test(c)) return Home;
  if (/automó|automo|taller|mecánic|mecanic|vehículo|vehiculo/.test(c)) return Car;
  if (/marketing|public|diseñ|diseno/.test(c)) return Megaphone;
  return Briefcase;
}
