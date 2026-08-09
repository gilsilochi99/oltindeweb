import { getActiveProfessionals, getServices } from "@/lib/data";
import { ProfessionalsPageClient } from "./ProfessionalsPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import type { Service } from "@/lib/types";

export default async function ProfessionalsPage() {
  const [allProfessionals, servicesData] = await Promise.all([
    getActiveProfessionals(),
    getServices(),
  ]);

  const uniqueCategories = [...new Set(servicesData.map((s: Service) => s.category))];
  const categories = ['all', ...uniqueCategories];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <ProfessionalsPageClient allProfessionals={allProfessionals} categories={categories} />
    </Suspense>
  );
}
