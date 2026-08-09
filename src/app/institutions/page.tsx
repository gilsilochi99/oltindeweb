import { getInstitutions, getUniqueCategories } from "@/lib/data";
import { InstitutionsPageClient } from "./InstitutionsPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default async function InstitutionsPage() {
  const [allInstitutions, categoriesData] = await Promise.all([
    getInstitutions(),
    getUniqueCategories(),
  ]);

  const institutionCategories = new Set(allInstitutions.map(inst => inst.category));
  const categories = categoriesData.filter(c => institutionCategories.has(c.name));

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <InstitutionsPageClient allInstitutions={allInstitutions} categories={categories} />
    </Suspense>
  );
}
