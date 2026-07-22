import type { Company } from "@/lib/types";
import { ListingCard } from "./ListingCard";
import { OpeningStatusBadge } from "@/components/shared/OpeningStatusBadge";

function averageRating(company: Company) {
  return company.reviews && company.reviews.length > 0
    ? company.reviews.reduce((acc, r) => acc + r.rating, 0) / company.reviews.length
    : 0;
}

// Single source of truth for how a Company renders as a listing card —
// used on the /companies archive page and the homepage's featured
// companies section, so both look identical.
export function CompanyListingCard({ company }: { company: Company }) {
  const mainBranch = company.branches?.[0];
  const tags = [company.companySize, company.geographicScope, company.capitalOwnership].filter(Boolean) as string[];

  return (
    <ListingCard
      href={`/companies/${company.id}`}
      logoSrc={company.logo}
      logoAlt={`${company.name} logo`}
      name={company.name}
      subtitle={company.category}
      verified={company.isVerified}
      statusBadge={<OpeningStatusBadge branch={mainBranch} />}
      rating={averageRating(company)}
      reviewCount={company.reviews?.length ?? 0}
      description={company.description}
      tags={tags}
      metaSecondary={mainBranch ? `${mainBranch.location.address}, ${mainBranch.location.city}` : undefined}
      featured={company.isFeatured}
      whatsapp={company.contact.socialMedia?.whatsapp}
      email={company.contact.email}
      phone={mainBranch?.contact.phone}
      quickLinks={[
        ...(company.contact.website ? [{ label: 'Sitio Web', href: company.contact.website, external: true }] : []),
        { label: 'Más Información', href: `/companies/${company.id}` },
      ]}
    />
  );
}
