import { HealthFacilityArchive } from "@/components/shared/health/HealthFacilityArchive";

export const metadata = {
  title: 'Clínicas en Guinea Ecuatorial',
  description: 'Encuentre clínicas públicas y privadas en Guinea Ecuatorial, con sus servicios, especialidades y datos de contacto.',
};

export default function ClinicsPage() {
  return (
    <HealthFacilityArchive
      facilityType="clinic"
      breadcrumbLabel="Clínicas"
      title="Encuentre Clínicas en Guinea Ecuatorial"
      description="Clínicas públicas y privadas, con sus servicios, especialidades y datos de contacto."
      detailBasePath="/health/clinics"
    />
  );
}
