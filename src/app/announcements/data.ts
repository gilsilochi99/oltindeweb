import { getActiveCompanies } from "@/lib/data";
import type { AnnouncementWithCompany } from "./page";

export async function buildAnnouncementsData() {
  const companiesData = await getActiveCompanies();

  const allAnnouncements: AnnouncementWithCompany[] = [];
  const categorySet = new Set<string>();
  const companiesWithAnnouncements = new Map<string, string>();

  companiesData.forEach(company => {
    if (company.announcements && company.announcements.length > 0) {
        categorySet.add(company.category);
        companiesWithAnnouncements.set(company.id, company.name);
        company.announcements.forEach(ann => {
            allAnnouncements.push({
                ...ann,
                companyName: company.name,
                companyId: company.id,
                companyCategory: company.category,
                companyLogo: company.logo,
            });
        });
    }
  });

  allAnnouncements.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const categoryList = Array.from(categorySet);
  const companies = [{ id: 'all', name: 'Todas las Empresas' }, ...Array.from(companiesWithAnnouncements.entries()).map(([id, name]) => ({ id, name }))];

  return { allAnnouncements, categoryList, companies };
}
