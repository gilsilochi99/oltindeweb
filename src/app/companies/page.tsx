import type { Metadata } from 'next';
import { getActiveCompanies, getCompanyCategoryCounts, getServices } from "@/lib/data";
import { CompaniesPageClient } from "./CompaniesPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Directorio de Empresas en Guinea Ecuatorial",
  description: "Busque empresas verificadas en Malabo, Bata y todo el país por nombre, actividad o ciudad. Dirección, teléfono, horarios y reseñas.",
  alternates: { canonical: '/companies' },
};

// Deliberately does NOT read searchParams here (that would force this route
// to render dynamically on every request) — all three fetches below are
// already cached in data.ts, so this can stay a plain static/ISR page. Mode
// (browse vs. filtered list) and the actual filter values are derived
// client-side from useSearchParams() in CompaniesPageClient, which requires
// wrapping it in Suspense.
export default async function CompaniesPage() {
  const [companies, categories, services] = await Promise.all([
    getActiveCompanies(),
    getCompanyCategoryCounts(),
    getServices(),
  ]);

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <CompaniesPageClient
        initialCompanies={companies}
        initialCategories={categories}
        initialServices={services}
      />
    </Suspense>
  );
}
