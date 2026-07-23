import { HealthFacilityArchive } from "@/components/shared/health/HealthFacilityArchive";

export const metadata = {
  title: 'Hospitales en Guinea Ecuatorial',
  description: 'Encuentre hospitales públicos y privados en Guinea Ecuatorial, con sus servicios, especialidades y datos de contacto.',
};

export default function HospitalsPage() {
  return (
    <HealthFacilityArchive
      facilityType="hospital"
      breadcrumbLabel="Hospitales"
      title="Encuentre Hospitales en Guinea Ecuatorial"
      description="Hospitales públicos y privados, con sus servicios, especialidades y datos de contacto."
      detailBasePath="/health/hospitals"
    />
  );
}
