'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

export const DynamicDirectoryMap = dynamic(
  () => import('./DirectoryMap').then((m) => m.DirectoryMap),
  { ssr: false, loading: () => <Skeleton className="h-[400px] w-full rounded-lg" /> }
);
