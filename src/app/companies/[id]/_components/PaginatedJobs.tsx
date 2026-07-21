'use client';

import { useState } from 'react';
import { JobCard } from '@/components/shared/JobCard';
import { Pagination } from '@/components/shared/Pagination';
import type { JobPosting } from '@/lib/types';

const ITEMS_PER_PAGE = 3;

export function PaginatedJobs({ jobs }: { jobs: JobPosting[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(jobs.length / ITEMS_PER_PAGE);
  const currentJobs = jobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {currentJobs.map(job => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>
      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      )}
    </div>
  );
}
