import type { Institution } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { OpeningStatusBadge } from "@/components/shared/OpeningStatusBadge";
import placeholderImages from '@/lib/placeholder-images.json';
import { maskPhone } from "@/lib/utils";

function averageRating(institution: Institution) {
  return institution.reviews && institution.reviews.length > 0
    ? institution.reviews.reduce((acc, r) => acc + r.rating, 0) / institution.reviews.length
    : 0;
}

// Single source of truth for how an Institution renders as a listing card.
export function InstitutionListingCard({ institution }: { institution: Institution }) {
  const mainBranch = institution.branches?.[0];
  const procedureCount = institution.procedures?.length ?? 0;
  const tags = [
    institution.category,
    ...(procedureCount > 0 ? [`${procedureCount} trámite${procedureCount === 1 ? '' : 's'}`] : []),
    ...(institution.branches && institution.branches.length > 1 ? [`${institution.branches.length} sucursales`] : []),
  ].filter(Boolean) as string[];

  return (
    <ListingCard
      href={`/institutions/${institution.id}`}
      logoSrc={institution.logo || placeholderImages.logo.src}
      logoAlt={`${institution.name} logo`}
      name={institution.name}
      subtitle={institution.responsiblePerson?.name ? `Responsable: ${institution.responsiblePerson.name}` : institution.category}
      statusBadge={<OpeningStatusBadge branch={mainBranch} />}
      rating={averageRating(institution)}
      reviewCount={institution.reviews?.length ?? 0}
      description={institution.description}
      tags={tags}
      metaPrimary={mainBranch?.contact.phone ? maskPhone(mainBranch.contact.phone) : undefined}
      metaSecondary={mainBranch ? `${mainBranch.location.address}, ${mainBranch.location.city}` : undefined}
      whatsapp={institution.contact.whatsapp}
      email={institution.contact.email}
      quickLinks={[
        ...(institution.contact.website ? [{ label: 'Sitio Web', href: institution.contact.website, external: true }] : []),
        { label: 'Más Información', href: `/institutions/${institution.id}` },
      ]}
    />
  );
}
