import { getActiveCompanies } from "@/lib/data";
import type { Announcement } from "@/lib/types";
import { AnnouncementsPageClient } from "./AnnouncementsPageClient";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export interface AnnouncementWithCompany extends Announcement {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}

export default async function AnnouncementsPage() {
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

  const categories = ['all', ...Array.from(categorySet)];
  const companies = [{ id: 'all', name: 'Todas las Empresas' }, ...Array.from(companiesWithAnnouncements.entries()).map(([id, name]) => ({ id, name }))];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <AnnouncementsPageClient allAnnouncements={allAnnouncements} categories={categories} companies={companies} />
    </Suspense>
  );
}
