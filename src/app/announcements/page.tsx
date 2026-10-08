import type { Metadata } from 'next';
import type { Announcement } from "@/lib/types";
import { AnnouncementsPageClient } from "./AnnouncementsPageClient";
import { buildAnnouncementsData } from "./data";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Anuncios de Empresas",
  description: "Noticias, comunicados y novedades publicados por empresas e instituciones de Guinea Ecuatorial.",
  alternates: { canonical: '/announcements' },
};

export interface AnnouncementWithCompany extends Announcement {
    companyName: string;
    companyId: string;
    companyCategory: string;
    companyLogo: string;
}

export default async function AnnouncementsPage() {
  const { allAnnouncements, categoryList, companies } = await buildAnnouncementsData();
  const categories = ['all', ...categoryList];

  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-black" /></div>}>
      <AnnouncementsPageClient allAnnouncements={allAnnouncements} categories={categories} companies={companies} />
    </Suspense>
  );
}
