import type { Metadata } from 'next';
import { getServicesByCompany } from "@/lib/data";
import { ServicesPageClient } from "./ServicesPageClient";

export const metadata: Metadata = {
  title: "Servicios en Guinea Ecuatorial",
  description: "Encuentre servicios de empresas de Guinea Ecuatorial por categoría y ciudad.",
  alternates: { canonical: '/services' },
};

export default async function ServicesPage() {
  const allServices = await getServicesByCompany();
  return <ServicesPageClient allServices={allServices} />;
}
