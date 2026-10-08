import type { Metadata } from 'next';
import { getActiveJobPostings, getUniqueJobSectors, getUniqueCities } from "@/lib/data";
import { JobsPageClient } from "./JobsPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Empleo en Guinea Ecuatorial: ofertas de trabajo y vacantes",
  description: "Ofertas de empleo y trabajo en Guinea Ecuatorial: vacantes, puestos, prácticas y contratos en empresas de Malabo, Bata y todo el país. Busque trabajo por sector y ciudad.",
  alternates: { canonical: '/jobs' },
};

export default async function JobsPage() {
  const [jobs, sectorList, cityList] = await Promise.all([
    getActiveJobPostings(),
    getUniqueJobSectors(),
    getUniqueCities(),
  ]);

  const allJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sectors = ['all', ...sectorList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <JobsPageClient allJobs={allJobs} sectors={sectors} cities={cities} />
    </Suspense>
  );
}
