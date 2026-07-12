
'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { SearchExperience } from '@/components/shared/search/SearchExperience';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';

    return <SearchExperience variant="page" initialQuery={query} />;
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <SearchPageContent />
        </Suspense>
    )
}
