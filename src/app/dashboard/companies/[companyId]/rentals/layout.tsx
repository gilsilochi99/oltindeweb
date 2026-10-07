import { RentalsNav } from '@/components/rentals/RentalsNav';

export default async function RentalsLayout({ children, params }: { children: React.ReactNode; params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  return (
    <>
      <RentalsNav companyId={companyId} />
      {children}
    </>
  );
}
