
'use client';

import { useParams } from 'next/navigation';
import PublicationForm from '@/components/dashboard/PublicationForm';

export default function EditPublicationPage() {
  const { id } = useParams();
  return <PublicationForm postId={id as string} />;
}
