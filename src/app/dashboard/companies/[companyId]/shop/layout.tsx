import { SellerShopNav } from '@/components/shop/SellerShopNav';

export default async function SellerShopLayout({ children, params }: { children: React.ReactNode; params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  return (
    <>
      <SellerShopNav companyId={companyId} />
      {children}
    </>
  );
}
