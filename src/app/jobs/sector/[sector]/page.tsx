import { getActiveJobPostings, getUniqueJobSectors, getUniqueCities } from "@/lib/data";
import { JobsPageClient } from "../../JobsPageClient";
import { slugify } from "@/lib/slug";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ sector: string }>;
};

export async function generateStaticParams() {
  const sectorList = await getUniqueJobSectors();
  return sectorList.map((sector) => ({ sector: slugify(sector) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sector: slug } = await params;
  const sectorList = await getUniqueJobSectors();
  const match = sectorList.find((s) => slugify(s) === slug);

  if (!match) {
    return { title: "Sector no encontrado" };
  }

  return {
    title: `Empleos de ${match} en Guinea Ecuatorial`,
    description: `Ofertas de empleo en el sector ${match} en Oltinde, Guinea Ecuatorial.`,
  };
}

export default async function JobSectorPage({ params }: Props) {
  const { sector: slug } = await params;

  const [jobs, sectorList, cityList] = await Promise.all([
    getActiveJobPostings(),
    getUniqueJobSectors(),
    getUniqueCities(),
  ]);

  const match = sectorList.find((s) => slugify(s) === slug);
  if (!match) {
    notFound();
  }

  const allJobs = [...jobs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const sectors = ['all', ...sectorList];
  const cities = ['all', ...cityList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <JobsPageClient allJobs={allJobs} sectors={sectors} cities={cities} initialSector={match} />
    </Suspense>
  );
}
