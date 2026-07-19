'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const DynamicItineraryMap = dynamic(
  () => import('./ItineraryMap').then((m) => m.ItineraryMap),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-lg" /> }
);
