
import { getCompany } from "@/lib/firebase";
import { notFound } from "next/navigation";
import OffersList from "./OffersList";
import AddOfferForm from "./AddOfferForm";
import { Breadcrumbs } from "@/components/shared/Breadcrumbs";
import { revalidatePath } from "next/cache";

export default async function CompanyOffersPage({
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
      href: `/dashboard/companies/${params.companyId}/offers`,
      label: "Ofertas",
      isLast: true,
    },
  ];

  async function revalidateOffers() {
    'use server';
    revalidatePath(`/dashboard/companies/${params.companyId}/offers`);
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs segments={breadcrumbs} />
      <h1 className="text-2xl font-bold">Gestionar Ofertas</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <OffersList companyId={company.id} initialOffers={company.offers} />
        </div>
        <div>
          <AddOfferForm companyId={company.id} revalidateOffers={revalidateOffers} />
        </div>
      </div>
    </div>
  );
}
