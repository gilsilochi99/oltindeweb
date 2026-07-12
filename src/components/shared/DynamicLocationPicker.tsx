'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const DynamicLocationPicker = dynamic(
  () => import('./LocationPicker').then((m) => m.LocationPicker),
  { ssr: false, loading: () => <Skeleton className="h-[300px] w-full rounded-lg" /> }
);
