import type { Offer } from "@/lib/types";
import { OffersPageClient } from "./OffersPageClient";
import { buildOffersData } from "./data";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export interface OfferWithCompany extends Offer {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}

export default async function OffersPage() {
  const { allOffers, categoryList, companies } = await buildOffersData();
  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <OffersPageClient allOffers={allOffers} categories={categories} companies={companies} />
    </Suspense>
  );
}
