import { getServicesByCompany } from "@/lib/data";
import { ServicesPageClient } from "./ServicesPageClient";

export default async function ServicesPage() {
  const allServices = await getServicesByCompany();
  return <ServicesPageClient allServices={allServices} />;
}
