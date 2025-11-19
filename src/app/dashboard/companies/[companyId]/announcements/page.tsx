
import { getCompany } from "@/lib/firebase";
import { notFound } from "next/navigation";
import AnnouncementsList from "./AnnouncementsList";
import AddAnnouncementForm from "./AddAnnouncementForm";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { revalidatePath } from "next/cache";

export default async function CompanyAnnouncementsPage({
  params,
}: {
  params: { companyId: string };
}) {
  const company = await getCompany(params.companyId);
  if (!company) {
    notFound();
  }

  const breadcrumbs = [
    { href: "/dashboard", label: "Dashboard" },
    {
      href: `/dashboard/companies/${params.companyId}`,
      label: "Empresa",
    },
    {
      href: `/dashboard/companies/${params.companyId}/announcements`,
      label: "Anuncios",
      isLast: true,
    },
  ];

  async function revalidateAnnouncements() {
    'use server';
    revalidatePath(`/dashboard/companies/${params.companyId}/announcements`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={breadcrumbs} />
      <h1 className="text-2xl font-bold">Gestionar Anuncios</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AnnouncementsList companyId={company.id} initialAnnouncements={company.announcements} />
        </div>
        <div>
          <AddAnnouncementForm companyId={company.id} revalidateAnnouncements={revalidateAnnouncements} />
        </div>
      </div>
    </div>
  );
}
