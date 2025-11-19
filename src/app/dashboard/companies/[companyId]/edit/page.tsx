
'use client';

import { useParams } from 'next/navigation';
import CompanyForm from '@/components/dashboard/CompanyForm';

export default function EditCompanyPage() {
  const { companyId } = useParams();
  return <CompanyForm companyId={companyId as string} />;
}
