import { getActiveCompanies, getInstitutions, getUniqueCategories } from "@/lib/data";
import { MapPageClient } from "./MapPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function MapPage() {
  const [companies, institutions, categoriesData] = await Promise.all([
    getActiveCompanies(),
    getInstitutions(),
    getUniqueCategories(),
  ]);

  const categories = ['all', ...categoriesData.map(c => c.name)];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <MapPageClient companies={companies} institutions={institutions} categories={categories} />
    </Suspense>
  );
}
