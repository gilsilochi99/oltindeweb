'use client';

import { useState } from 'react';
import { ListingCard } from '@/components/shared/archive/ListingCard';
import { Pagination } from '@/components/shared/Pagination';
import type { Announcement } from '@/lib/types';

const ITEMS_PER_PAGE = 3;

export function PaginatedAnnouncements({ announcements, companyId, companyName, companyLogo }: {
  announcements: Announcement[];
  companyId: string;
  companyName: string;
  companyLogo: string;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(announcements.length / ITEMS_PER_PAGE);
  const currentAnnouncements = announcements.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="space-y-4 mt-6">
      <h3 className="font-semibold text-sm">Anuncios</h3>
      {currentAnnouncements.map(announcement => (
        <ListingCard
          key={announcement.id}
          href={`/announcements/${announcement.id}`}
          logoSrc={announcement.image || companyLogo}
          logoAlt={announcement.image ? announcement.title : `${companyName} logo`}
          imageFit={announcement.image ? 'cover' : 'contain'}
          name={announcement.title}
          subtitle={companyName}
          description={announcement.content}
          metaPrimary={new Date(announcement.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
          quickLinks={[
            { label: 'Ver Empresa', href: `/companies/${companyId}` },
            { label: 'Ver Anuncio', href: `/announcements/${announcement.id}` },
          ]}
        />
      ))}
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
