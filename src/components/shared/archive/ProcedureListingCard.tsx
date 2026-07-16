import type { Procedure } from "@/lib/types";
import { ListingCard } from "./ListingCard";

function averageRating(procedure: Procedure) {
  return procedure.reviews && procedure.reviews.length > 0
    ? procedure.reviews.reduce((acc, r) => acc + r.rating, 0) / procedure.reviews.length
    : 0;
}

// Single source of truth for how a Procedure (trámite) renders as a listing card.
export function ProcedureListingCard({ procedure }: { procedure: Procedure }) {
  const rating = averageRating(procedure);
  const tags = [
    procedure.category,
    ...(procedure.requirements?.length ? [`${procedure.requirements.length} requisito${procedure.requirements.length === 1 ? '' : 's'}`] : []),
    ...(procedure.steps?.length ? [`${procedure.steps.length} paso${procedure.steps.length === 1 ? '' : 's'}`] : []),
  ].filter(Boolean) as string[];

  return (
    <ListingCard
      href={`/procedures/${procedure.id}`}
      logoAlt={procedure.name}
      name={procedure.name}
      subtitle={procedure.institution}
      rating={rating > 0 ? rating : undefined}
      reviewCount={procedure.reviews?.length ?? 0}
      description={procedure.description}
      tags={tags}
      metaPrimary={procedure.cost}
      metaSecondary={procedure.institution}
      quickLinks={[
        { label: 'Ver Institución', href: `/institutions/${procedure.institutionId}` },
        ...(procedure.documents && procedure.documents.length > 0 ? [{ label: `${procedure.documents.length} Documento${procedure.documents.length === 1 ? '' : 's'}`, href: `/procedures/${procedure.id}` }] : []),
        { label: 'Ver Detalles', href: `/procedures/${procedure.id}` },
      ]}
    />
  );
}
