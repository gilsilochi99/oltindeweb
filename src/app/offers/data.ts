import { getActiveCompanies } from "@/lib/data";
import type { OfferWithCompany } from "./page";

export async function buildOffersData() {
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

  const categoryList = Array.from(categorySet);
  const companies = [{ id: 'all', name: 'Todas las Empresas' }, ...Array.from(companiesWithOffers.entries()).map(([id, name]) => ({ id, name }))];

  return { allOffers, categoryList, companies };
}
