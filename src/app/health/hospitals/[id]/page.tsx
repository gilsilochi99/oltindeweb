import { getHealthFacilityById } from "@/lib/data";
import { notFound } from "next/navigation";
import type { Metadata } from 'next';
import { HealthFacilityDetailView } from "@/components/shared/health/HealthFacilityDetailView";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const facility = await getHealthFacilityById(id);
  if (!facility || facility.type !== 'hospital') {
    return { title: 'Hospital no encontrado' };
  }
  return { title: facility.name, description: facility.description };
}

export default async function HospitalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const facility = await getHealthFacilityById(id);

  if (!facility || facility.type !== 'hospital') {
    notFound();
  }

  return <HealthFacilityDetailView facility={facility} detailPath="/health/hospitals" />;
}
