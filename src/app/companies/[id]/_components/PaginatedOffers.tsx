'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/shared/archive/ListingCard';
import { Pagination } from '@/components/shared/Pagination';
import type { Offer } from '@/lib/types';

const ITEMS_PER_PAGE = 3;

export function PaginatedOffers({ offers, companyId, companyName, companyLogo }: {
  offers: Offer[];
  companyId: string;
  companyName: string;
  companyLogo: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(offers.length / ITEMS_PER_PAGE);
  const currentOffers = offers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-sm">Ofertas Activas</h3>
      {currentOffers.map(offer => (
        <ListingCard
          key={offer.id}
          href={`/offers/${offer.id}`}
          logoSrc={offer.image || companyLogo}
          logoAlt={offer.image ? offer.title : `${companyName} logo`}
          imageFit={offer.image ? 'cover' : 'contain'}
          name={offer.title}
          subtitle={companyName}
          description={offer.description}
          metaPrimary={offer.discount}
          metaSecondary={`Válido hasta ${new Date(offer.validUntil).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`}
          quickLinks={[
            { label: 'Ver Empresa', href: `/companies/${companyId}` },
            { label: 'Ver Oferta', href: `/offers/${offer.id}` },
          ]}
        />
      ))}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
