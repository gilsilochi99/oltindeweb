import { HealthFacilityArchive } from "@/components/shared/health/HealthFacilityArchive";

export const metadata = {
  title: 'Farmacias de guardia hoy en Malabo y Bata',
  description: 'Farmacias de guardia hoy en Guinea Ecuatorial y todas las farmacias de Malabo, Bata y el resto del país: dirección, teléfono y horario.',
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
