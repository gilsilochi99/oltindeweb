import { HealthFacilityArchive } from "@/components/shared/health/HealthFacilityArchive";

export const metadata = {
  title: 'Farmacias en Guinea Ecuatorial',
  description: 'Encuentre farmacias en Guinea Ecuatorial y consulte cuáles están de guardia hoy.',
};

export default function PharmaciesPage() {
  return (
    <HealthFacilityArchive
      facilityType="pharmacy"
      breadcrumbLabel="Farmacias"
      title="Encuentre Farmacias en Guinea Ecuatorial"
      description="Farmacias públicas y privadas. Consulte cuáles están de guardia hoy."
      detailBasePath="/health/pharmacies"
    />
  );
}
