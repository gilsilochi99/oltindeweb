import { getActiveCompanies } from "@/lib/data";
import type { Offer } from "@/lib/types";
import { OffersPageClient } from "./OffersPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export interface OfferWithCompany extends Offer {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}

export default async function OffersPage() {
  const companiesData = await getActiveCompanies();

  const allOffers: OfferWithCompany[] = [];
  const categorySet = new Set<string>();
  const companiesWithOffers = new Map<string, string>();

  companiesData.forEach(company => {
    if (company.offers && company.offers.length > 0) {
        categorySet.add(company.category);
        companiesWithOffers.set(company.id, company.name);
        company.offers.forEach(offer => {
            allOffers.push({
                ...offer,
                companyName: company.name,
                companyId: company.id,
                companyCategory: company.category,
                companyLogo: company.logo,
            });
        });
    }
  });

  allOffers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const categories = ['all', ...Array.from(categorySet)];
  const companies = [{ id: 'all', name: 'Todas las Empresas' }, ...Array.from(companiesWithOffers.entries()).map(([id, name]) => ({ id, name }))];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <OffersPageClient allOffers={allOffers} categories={categories} companies={companies} />
    </Suspense>
  );
}
