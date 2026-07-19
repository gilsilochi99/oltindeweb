

import { getOfferById } from "@/lib/data";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { MaterialIcon } from "@/components/shared/detail/MaterialIcon";
import { ShareButtons } from "@/components/shared/ShareButtons";
import { DetailShell, SidebarCard, DetailHero, InfoCard, InfoSection } from "@/components/shared/detail/StitchDetailKit";
import { stitch } from "@/components/shared/detail/stitch-tokens";

export default async function OfferDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getOfferById(id);

  if (!data) {
    notFound();
  }

  const { offer, company } = data;
  const mainBranch = company.branches?.[0];

  return (
    <DetailShell
        sidebar={
            <>
                <SidebarCard title="Ofrecido por">
                    <div className="flex items-center gap-3 mb-4">
                        <Image src={company.logo} alt={`${company.name} logo`} width={48} height={48} className="rounded-md bg-muted object-contain w-12 h-12" />
                        <div>
                            <Link href={`/companies/${company.id}`} className="font-semibold underline text-sm leading-tight" style={{ color: stitch.secondary }}>
                                {company.name}
                            </Link>
                            <p className="text-xs text-muted-foreground">{company.category}</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {mainBranch?.contact.phone && (
                            <a href={`tel:${mainBranch.contact.phone}`} className="flex items-center gap-3 py-1 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                                <MaterialIcon name="call" className="!text-[18px]" />
                                {mainBranch.contact.phone}
                            </a>
                        )}
                        {company.contact.email && (
                            <a href={`mailto:${company.contact.email}`} className="flex items-center gap-3 py-1 text-sm font-semibold underline" style={{ color: stitch.secondary }}>
                                <MaterialIcon name="mail" className="!text-[18px]" />
                                {company.contact.email}
                            </a>
                        )}
                        {mainBranch && (
                            <div className="text-[13px] text-black ml-9 -mt-1">
                                {mainBranch.location.address}, {mainBranch.location.city}
                            </div>
                        )}
                    </div>
                    <Button asChild className="w-full mt-4">
                        <Link href={`/companies/${company.id}`}><Building className="w-4 h-4 mr-2" />Ver Perfil Completo</Link>
                    </Button>
                </SidebarCard>
            </>
        }
    >
        <DetailHero
            logoSrc={company.logo}
            logoAlt={`${company.name} logo`}
            name={offer.title}
            tags={[offer.discount, 'Oferta']}
            actions={<ShareButtons path={`/offers/${offer.id}`} title={offer.title} />}
        />

        <InfoCard title="Detalles de la Oferta">
            <InfoSection label="Descripción" divider={false}>
                <p>{offer.description}</p>
            </InfoSection>
            <InfoSection label="Válido Hasta">
                <p className="font-semibold" style={{ color: stitch.error }}>
                    {new Date(offer.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
            </InfoSection>
        </InfoCard>
    </DetailShell>
  );
}
